// Proveedores (frontend-specs.md §6.2): servicios, sesión y runtime de datos. El estado de los datos NO se
// duplica aquí: se lee de Dexie con useLiveQuery desde los hooks de data/hooks.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { Session } from '../data/auth/AuthService'
import type { SyncSnapshot } from '../data/sync/engine'
import type { Runtime } from './runtime'
import type { Services } from './services'

const ServicesContext = createContext<Services | null>(null)

export function ServicesProvider({
  services,
  children,
}: {
  services: Services
  children: ReactNode
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

export function useServices(): Services {
  const ctx = useContext(ServicesContext)
  if (!ctx) throw new Error('useServices requiere <ServicesProvider>')
  return ctx
}

// ----- Sesión -----

const AuthContext = createContext<{ session: Session | null } | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useServices()
  const [session, setSession] = useState<Session | null>(() => auth.getSession())
  useEffect(() => auth.onAuthChange(setSession), [auth])
  const value = useMemo(() => ({ session }), [session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requiere <AuthProvider>')
  return ctx
}

// ----- Runtime de la sesión (base local, repositorios, sincronización) -----

const RuntimeContext = createContext<Runtime | null>(null)

export function RuntimeProvider({ session, children }: { session: Session; children: ReactNode }) {
  const services = useServices()
  const runtime = useMemo(() => services.getRuntime(session), [services, session])
  useEffect(() => {
    runtime.engine.start()
    return () => runtime.engine.stop()
  }, [runtime])
  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>
}

export function useRuntime(): Runtime {
  const ctx = useContext(RuntimeContext)
  if (!ctx) throw new Error('useRuntime requiere <RuntimeProvider>')
  return ctx
}

export function useRepos() {
  return useRuntime().repos
}

/** Estado de sincronización (F-09). */
export function useSync(): SyncSnapshot & { retry: () => void } {
  const { engine } = useRuntime()
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  return useMemo(() => ({ ...snapshot, retry: () => void engine.retry() }), [snapshot, engine])
}
