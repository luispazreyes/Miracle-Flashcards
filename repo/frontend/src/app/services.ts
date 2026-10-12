// Composición de los servicios según VITE_REMOTE_MODE (frontend-specs.md §3, D-07). En modo `mock` todo
// funciona sin backend; `supabase` se conectará cuando exista el SQL (fase posterior).
import { deleteDb } from '../data/db/db'
import type { AuthService, Session } from '../data/auth/AuthService'
import { MockAuthService } from '../data/auth/mock/MockAuthService'
import { MockSyncRemote } from '../data/remote/mock/MockSyncRemote'
import { MockServer } from '../data/remote/mock/server'
import type { SyncRemote } from '../data/remote/contract'
import type { Random } from '../domain'
import { checkImageLoads } from '../lib/imageCheck'
import { createRuntime, type Runtime } from './runtime'

export type RemoteMode = 'mock' | 'supabase'

export interface Services {
  mode: RemoteMode
  auth: AuthService
  isOnline: () => boolean
  random: Random
  /** Comprueba que una URL carga como imagen (RF-15, BR-17). */
  checkImage: (url: string) => Promise<boolean>
  /** Runtime de la sesión (uno por usuario, reutilizado). */
  getRuntime(session: Session): Runtime
  disposeRuntime(userId: string, options?: { deleteData?: boolean }): Promise<void>
}

export interface ServicesOptions {
  mode?: RemoteMode
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  isOnline?: () => boolean
  random?: Random
  /** Pruebas: reutiliza un servidor simulado compartido. */
  server?: MockServer
  /** Pruebas: se ejecuta con cada remoto creado (para controlar latencia y fallos). */
  onRemote?: (remote: MockSyncRemote) => void
  checkImage?: (url: string) => Promise<boolean>
  auth?: AuthService
}

export function createServices(options: ServicesOptions = {}): Services {
  const mode =
    options.mode ?? (import.meta.env.VITE_REMOTE_MODE === 'supabase' ? 'supabase' : 'mock')
  if (mode === 'supabase')
    throw new Error('El modo supabase aún no está disponible: falta el esquema SQL (D-07).')

  const storage = options.storage ?? window.localStorage
  const isOnline = options.isOnline ?? (() => navigator.onLine)
  const server = options.server ?? new MockServer(storage)
  const auth = options.auth ?? new MockAuthService({ store: storage, isOnline })
  const checkImage = options.checkImage ?? checkImageLoads
  const runtimes = new Map<string, Runtime>()

  return {
    mode,
    auth,
    isOnline,
    random: options.random ?? Math.random,
    checkImage,
    getRuntime(session) {
      let runtime = runtimes.get(session.userId)
      if (!runtime) {
        const remote = new MockSyncRemote(server, session.userId)
        options.onRemote?.(remote)
        runtime = createRuntime({
          userId: session.userId,
          remote: remote as SyncRemote,
          isOnline,
          verifyImage: checkImage,
        })
        runtimes.set(session.userId, runtime)
      }
      return runtime
    },
    async disposeRuntime(userId, disposeOptions) {
      const runtime = runtimes.get(userId)
      runtimes.delete(userId)
      if (runtime) await runtime.dispose(disposeOptions)
      else if (disposeOptions?.deleteData) await deleteDb(userId)
    },
  }
}
