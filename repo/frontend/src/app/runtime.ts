// Runtime de una sesión: base local, repositorios y motor de sincronización de UN usuario (frontend-specs.md
// §4.4, §5). Se crea al iniciar sesión y se destruye al cerrarla.
import { deleteDb, openDb, type AppDb } from '../data/db/db'
import type { SyncRemote } from '../data/remote/contract'
import { createRepositories, type Repositories } from '../data/repositories'
import type { SyncNotice } from '../data/sync/applyChanges'
import { SyncEngine } from '../data/sync/engine'

export interface Runtime {
  userId: string
  db: AppDb
  repos: Repositories
  engine: SyncEngine
  /** Avisos del motor (eliminaciones en otro dispositivo, imágenes retiradas). */
  onNotice(listener: (notice: SyncNotice) => void): () => void
  dispose(options?: { deleteData?: boolean }): Promise<void>
}

export interface RuntimeDeps {
  userId: string
  remote: SyncRemote
  isOnline: () => boolean
  verifyImage?: (url: string) => Promise<boolean>
}

export function createRuntime({ userId, remote, isOnline, verifyImage }: RuntimeDeps): Runtime {
  const db = openDb(userId)
  const listeners = new Set<(n: SyncNotice) => void>()
  const ref: { engine?: SyncEngine } = {}
  const repos = createRepositories(db, userId, { onWrite: () => ref.engine?.trigger() })
  const engine = new SyncEngine({
    db,
    repos,
    remote,
    isOnline,
    verifyImage,
    onNotice: (n) => listeners.forEach((l) => l(n)),
  })
  ref.engine = engine
  return {
    userId,
    db,
    repos,
    engine,
    onNotice(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    async dispose({ deleteData = false } = {}) {
      engine.stop()
      db.close()
      if (deleteData) await deleteDb(userId)
    },
  }
}
