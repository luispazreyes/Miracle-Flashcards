// Base común de los repositorios (frontend-specs.md §5.2): cada escritura es UNA transacción Dexie que
// modifica los datos Y añade su OutboxOp, de modo que nunca queda un cambio local sin su operación (BR-40).
import type { DeckNameError, OpBody, OutboxOp, WordFormErrors } from '../../domain'
import type { AppDb } from '../db/db'

export interface RepoDeps {
  db: AppDb
  userId: string
  now: () => number
  newId: () => string
  /** Se invoca DESPUÉS de confirmar una escritura (dispara la sincronización). */
  onWrite?: () => void
}

export type RepoErrorCode = 'invalid-word' | 'invalid-deck-name' | 'duplicate-in-deck' | 'not-found'

export class RepoError extends Error {
  constructor(
    readonly code: RepoErrorCode,
    readonly detail?: { fields?: WordFormErrors; deckName?: DeckNameError; english?: string },
  ) {
    super(code)
    this.name = 'RepoError'
  }
}

/** Ejecuta `fn` en una transacción de lectura/escritura sobre todas las tablas y avisa al confirmar. */
export async function writeTx<T>(deps: RepoDeps, fn: () => Promise<T>): Promise<T> {
  const result = await deps.db.transaction('rw', deps.db.tables, fn)
  deps.onWrite?.()
  return result
}

/** Añade una operación a la cola. Debe llamarse dentro de `writeTx`. */
export async function enqueue(deps: RepoDeps, body: OpBody): Promise<void> {
  const op: OutboxOp = {
    ...body,
    opId: deps.newId(),
    createdAt: deps.now(),
    attempts: 0,
    status: 'pending',
  }
  await deps.db.outbox.add(op)
}
