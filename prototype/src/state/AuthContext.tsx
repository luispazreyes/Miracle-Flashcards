// Sesión simulada. RF-41: la sesión persiste en el dispositivo y no requiere red.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface AuthValor {
  haySesion: boolean
  iniciarSesion: () => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthValor | null>(null)
const CLAVE = 'mf-sesion'

function leer(): boolean {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

function guardar(v: boolean) {
  try {
    if (v) localStorage.setItem(CLAVE, '1')
    else localStorage.removeItem(CLAVE)
  } catch {
    /* sin almacenamiento: la sesión dura solo esta pestaña */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [haySesion, setHaySesion] = useState(leer)

  const iniciarSesion = useCallback(() => {
    guardar(true)
    setHaySesion(true)
  }, [])
  const cerrarSesion = useCallback(() => {
    guardar(false)
    setHaySesion(false)
  }, [])

  const valor = useMemo(() => ({ haySesion, iniciarSesion, cerrarSesion }), [haySesion, iniciarSesion, cerrarSesion])
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValor {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requiere <AuthProvider>')
  return ctx
}
