// Estado de sincronización simulado (F-09). En producción lo alimentará la cola local (RF-22).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export type EstadoSync = 'sincronizado' | 'sin-conexion' | 'sincronizando' | 'sin-sincronizar'

interface SyncValor {
  estado: EstadoSync
  /** Intento automático en curso (1..MAX_INTENTOS) tras un fallo; 0 si no aplica. */
  intento: number
  /** Solo prototipo: fuerza un estado para revisarlo. */
  forzar: (e: EstadoSync) => void
  /** Solo prototipo: simula un fallo de sincronización con reintentos automáticos. */
  simularFallo: () => void
  /** Reintento manual (RF-22). */
  reintentar: () => void
}

const SyncContext = createContext<SyncValor | null>(null)

const DURACION_SYNC_MS = 1500
export const MAX_INTENTOS = 5
const ESPERA_BASE_MS = 500 // espera creciente: 0.5 s, 1 s, 2 s, 4 s, 8 s

export function SyncProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSync>(() => (navigator.onLine ? 'sincronizado' : 'sin-conexion'))
  const [intento, setIntento] = useState(0)
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined)

  const cancelar = () => clearTimeout(temporizador.current)

  const reintentar = useCallback(() => {
    cancelar()
    setIntento(0)
    setEstado('sincronizando')
    temporizador.current = setTimeout(() => setEstado('sincronizado'), DURACION_SYNC_MS)
  }, [])

  const simularFallo = useCallback(() => {
    cancelar()
    const ciclo = (n: number) => {
      if (n > MAX_INTENTOS) {
        setIntento(0)
        setEstado('sin-sincronizar') // los cambios locales no se descartan (RF-22)
        return
      }
      setIntento(n)
      setEstado('sincronizando')
      temporizador.current = setTimeout(() => ciclo(n + 1), ESPERA_BASE_MS * 2 ** (n - 1))
    }
    ciclo(1)
  }, [])

  const forzar = useCallback((e: EstadoSync) => {
    cancelar()
    setIntento(0)
    setEstado(e)
  }, [])

  // Al recuperar la conexión sincroniza solo (RF-22); al perderla pasa a "Sin conexión".
  useEffect(() => {
    const alVolver = () => reintentar()
    const alPerder = () => {
      cancelar()
      setIntento(0)
      setEstado('sin-conexion')
    }
    window.addEventListener('online', alVolver)
    window.addEventListener('offline', alPerder)
    return () => {
      window.removeEventListener('online', alVolver)
      window.removeEventListener('offline', alPerder)
      cancelar()
    }
  }, [reintentar])

  const valor = useMemo(
    () => ({ estado, intento, forzar, simularFallo, reintentar }),
    [estado, intento, forzar, simularFallo, reintentar],
  )
  return <SyncContext.Provider value={valor}>{children}</SyncContext.Provider>
}

export function useSync(): SyncValor {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync requiere <SyncProvider>')
  return ctx
}
