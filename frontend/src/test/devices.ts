// Utilidad de pruebas: "dispositivos" con base local propia que comparten un servidor simulado.
import { AppDb } from '../data/db/db'
import { MockServer } from '../data/remote/mock/server'
import { MockSyncRemote } from '../data/remote/mock/MockSyncRemote'
import { createRepositories } from '../data/repositories'
import { SyncEngine } from '../data/sync/engine'
import type { SyncNotice } from '../data/sync/applyChanges'

export function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  }
}

export function makeServer() {
  return new MockServer(memoryStorage())
}

let counter = 0

export function makeDevice(
  server: MockServer,
  userId: string,
  options: { verifyImage?: (url: string) => Promise<boolean>; now?: () => number } = {},
) {
  const db = new AppDb(`device-${++counter}-${Math.random().toString(36).slice(2)}`)
  const net = { online: true }
  const events = new EventTarget()
  const timers: { fn: () => void; ms: number; cancelled: boolean }[] = []
  const notices: SyncNotice[] = []
  const remote = new MockSyncRemote(server, userId)
  const ref: { engine?: SyncEngine } = {}
  const repos = createRepositories(db, userId, {
    onWrite: () => ref.engine?.trigger(),
    ...(options.now ? { now: options.now } : {}),
  })
  const engine = new SyncEngine({
    db,
    repos,
    remote,
    isOnline: () => net.online,
    events,
    schedule: (fn, ms) => {
      const t = { fn, ms, cancelled: false }
      timers.push(t)
      return () => {
        t.cancelled = true
      }
    },
    onNotice: (n) => notices.push(n),
    verifyImage: options.verifyImage,
  })
  ref.engine = engine
  return {
    db,
    repos,
    remote,
    engine,
    net,
    events,
    timers,
    notices,
    /** Ejecuta el siguiente reintento programado, si lo hay. */
    async fireTimer() {
      const t = timers.find((x) => !x.cancelled)
      if (!t) return false
      t.cancelled = true
      t.fn()
      await engine.idle()
      return true
    },
    async cleanup() {
      engine.stop()
      db.close()
      await db.delete()
    },
  }
}

export type Device = ReturnType<typeof makeDevice>
