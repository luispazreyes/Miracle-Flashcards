// Motor de sincronización (frontend-specs.md §5.3, RF-22, RF-29, BR-40..BR-42).
// Envía la cola en orden de `seq`, aplica el estado devuelto, reintenta con espera creciente (máx. 5) y nunca
// descarta cambios locales. Toda dependencia externa es inyectable para poder probarlo sin red ni relojes.
import { SYNC_BACKOFF_S, SYNC_MAX_RETRIES, type OpBody } from '../../domain'
import type { AppDb } from '../db/db'
import { pullResponseSchema, pushResponseSchema, type SyncRemote } from '../remote/contract'
import type { Repositories } from '../repositories'
import { applyChanges, type SyncNotice } from './applyChanges'

export type SyncState = 'synced' | 'offline' | 'syncing' | 'unsynced'
export interface SyncSnapshot {
  state: SyncState
  /** Operaciones sin sincronizar (no cuenta las comprobaciones locales de imagen). */
  pending: number
}

export interface EngineDeps {
  db: AppDb
  repos: Repositories
  remote: SyncRemote
  isOnline?: () => boolean
  /** Programa `fn` tras `ms` y devuelve la función que lo cancela. */
  schedule?: (fn: () => void, ms: number) => () => void
  onNotice?: (notice: SyncNotice) => void
  /** Comprueba que una URL carga como imagen (BR-17). Sin esto las comprobaciones quedan en la cola. */
  verifyImage?: (url: string) => Promise<boolean>
  /** Origen de los eventos `online`/`offline` (por defecto, `window`). */
  events?: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>
  batchSize?: number
}

const CURSOR_KEY = 'lastPullCursor'

const defaultSchedule = (fn: () => void, ms: number) => {
  const id = setTimeout(fn, ms)
  return () => clearTimeout(id)
}

export class SyncEngine {
  private snapshot: SyncSnapshot = { state: 'synced', pending: 0 }
  private listeners = new Set<() => void>()
  private runPromise: Promise<void> | null = null
  private again = false
  private stopped = false
  private failures = 0
  /** Último error de sincronización (diagnóstico). */
  lastError: unknown = null
  private cancelTimer: (() => void) | null = null
  private detach: (() => void) | null = null

  private readonly isOnline: () => boolean
  private readonly schedule: NonNullable<EngineDeps['schedule']>
  private readonly batchSize: number

  constructor(private readonly deps: EngineDeps) {
    this.isOnline = deps.isOnline ?? (() => navigator.onLine)
    this.schedule = deps.schedule ?? defaultSchedule
    this.batchSize = deps.batchSize ?? 50
  }

  // ----- Estado observable (useSyncExternalStore) -----

  getSnapshot = (): SyncSnapshot => this.snapshot
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  private set(next: Partial<SyncSnapshot>) {
    const merged = { ...this.snapshot, ...next }
    if (merged.state === this.snapshot.state && merged.pending === this.snapshot.pending) return
    this.snapshot = merged
    this.listeners.forEach((l) => l())
  }

  // ----- Ciclo de vida -----

  /** Arranque con sesión (RF-22): escucha la conexión y sincroniza. */
  start(): void {
    this.stopped = false
    const target = this.deps.events ?? window
    const onOnline = () => void this.reconnect()
    const onOffline = () => void this.refresh()
    target.addEventListener('online', onOnline)
    target.addEventListener('offline', onOffline)
    this.detach = () => {
      target.removeEventListener('online', onOnline)
      target.removeEventListener('offline', onOffline)
    }
    void this.run()
  }

  stop(): void {
    this.stopped = true
    this.cancelTimer?.()
    this.cancelTimer = null
    this.detach?.()
    this.detach = null
  }

  /** Tras una escritura local. No salta la espera de un reintento programado ni reanuda los agotados. */
  trigger(): void {
    if (this.exhausted || this.cancelTimer) {
      void this.refresh()
      return
    }
    void this.run()
  }

  /** Botón "Reintentar" (RF-22). */
  async retry(): Promise<void> {
    await this.reconnect()
  }

  private get exhausted() {
    return this.failures > SYNC_MAX_RETRIES
  }

  private async reconnect() {
    this.failures = 0
    this.cancelTimer?.()
    this.cancelTimer = null
    await this.deps.repos.outbox.requeueFailed()
    await this.run()
  }

  /** Recalcula el estado sin sincronizar. */
  async refresh(): Promise<void> {
    const pending = await this.unsyncedCount()
    if (!this.isOnline()) this.set({ state: 'offline', pending })
    else if (this.runPromise) this.set({ pending })
    else this.set({ pending, state: pending === 0 ? 'synced' : 'unsynced' })
  }

  private async unsyncedCount() {
    return this.deps.repos.outbox.unsynced()
  }

  // ----- Ciclo -----

  run(): Promise<void> {
    if (this.runPromise) {
      this.again = true
      return this.runPromise
    }
    this.runPromise = (async () => {
      try {
        let ok: boolean
        do {
          this.again = false
          ok = await this.cycle()
          // Tras un fallo manda la espera programada: `again` no la salta.
        } while (ok && this.again && !this.stopped)
      } finally {
        this.runPromise = null
      }
    })()
    return this.runPromise
  }

  /** Se resuelve cuando no hay ningún ciclo en curso (sin provocar otro). */
  idle(): Promise<void> {
    return this.runPromise ?? Promise.resolve()
  }

  /** Devuelve `false` si el ciclo falló (ya queda programado el reintento). */
  private async cycle(): Promise<boolean> {
    if (!this.isOnline()) {
      this.set({ state: 'offline', pending: await this.unsyncedCount() })
      return true
    }
    this.set({ state: 'syncing' })
    try {
      await this.deps.repos.outbox.requeueInflight()
      await this.pushAll()
      await this.pullAll()
      await this.verifyImages()
      this.failures = 0
      this.cancelTimer = null
      const pending = await this.unsyncedCount()
      this.set({ state: pending === 0 ? 'synced' : 'unsynced', pending })
      if (pending > 0) this.again = true
      return true
    } catch (error) {
      if (!this.stopped) await this.onFailure(error)
      return false
    }
  }

  private async onFailure(error: unknown) {
    this.lastError = error
    const { repos } = this.deps
    this.failures++
    await repos.outbox.requeueInflight()
    const pending = await this.unsyncedCount()
    this.set({ state: 'unsynced', pending })
    if (this.failures <= SYNC_MAX_RETRIES) {
      const seconds = SYNC_BACKOFF_S[this.failures - 1]
      this.cancelTimer = this.schedule(() => {
        this.cancelTimer = null
        void this.run()
      }, seconds * 1000)
    } else {
      // Reintentos agotados: se marcan como fallidas hasta un reintento manual o la vuelta de la conexión.
      for (const op of await repos.outbox.pending()) {
        await repos.outbox.update(op.seq!, { status: 'failed', attempts: this.failures })
      }
    }
  }

  private async pushAll() {
    const { repos, remote, db } = this.deps
    for (;;) {
      const batch = (await repos.outbox.pending())
        .filter((o) => o.type !== 'image.verify')
        .slice(0, this.batchSize)
      if (batch.length === 0) return
      for (const op of batch) await repos.outbox.update(op.seq!, { status: 'inflight' })

      const response = pushResponseSchema.parse(
        await remote.push({
          ops: batch.map((o) => ({
            opId: o.opId,
            createdAt: o.createdAt,
            op: { type: o.type, payload: o.payload } as OpBody,
          })),
        }),
      )

      const acked = new Set(response.results.map((r) => r.opId))
      const done = batch.filter((o) => acked.has(o.opId))
      await repos.outbox.removeMany(done.map((o) => o.seq!))
      for (const op of batch)
        if (!acked.has(op.opId)) await repos.outbox.update(op.seq!, { status: 'pending' })

      const notices = await applyChanges(db, response.changes)
      notices.forEach((n) => this.deps.onNotice?.(n))
      if (done.length === 0) throw new Error('El servidor no confirmó ninguna operación')
    }
  }

  private async pullAll() {
    const { remote, db } = this.deps
    const cursor = ((await db.meta.get(CURSOR_KEY))?.value as number | undefined) ?? 0
    const changes = pullResponseSchema.parse(await remote.pull(cursor))
    const notices = await applyChanges(db, changes)
    await db.meta.put({ key: CURSOR_KEY, value: changes.cursor })
    notices.forEach((n) => this.deps.onNotice?.(n))
  }

  /** BR-17: comprueba las imágenes "sin verificar" al recuperar la conexión; si fallan, se retiran y se avisa. */
  private async verifyImages() {
    const { repos, db, verifyImage } = this.deps
    if (!verifyImage) return
    const ops = (await repos.outbox.all()).filter((o) => o.type === 'image.verify')
    for (const op of ops) {
      if (op.type !== 'image.verify') continue
      let loads: boolean
      try {
        loads = await verifyImage(op.payload.imageUrl)
      } catch {
        continue
      }
      const word = await db.words.get(op.payload.wordId)
      await repos.words.resolveImage(op.payload.wordId, loads)
      await repos.outbox.removeMany([op.seq!])
      if (!loads && word) this.deps.onNotice?.({ kind: 'image-removed', name: word.english })
      this.again = true
    }
  }
}
