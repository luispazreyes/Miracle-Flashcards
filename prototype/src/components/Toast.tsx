// Avisos (§A.7): informativos en role="status"; errores en role="alert" y no desaparecen solos.
// Entrada y salida animadas (RF-44).
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { esperarSalida } from '../lib/motion'
import { Icon } from './Icon'

type Tipo = 'info' | 'exito' | 'error'
interface Aviso {
  id: number
  tipo: Tipo
  texto: string
  saliendo?: boolean
}

const ToastContext = createContext<{ avisar: (texto: string, tipo?: Tipo) => void } | null>(null)
const DURACION_VISIBLE_MS = 6000
let siguiente = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const cerrar = useCallback((id: number) => {
    setAvisos((a) => a.map((x) => (x.id === id ? { ...x, saliendo: true } : x)))
    esperarSalida(() => setAvisos((a) => a.filter((x) => x.id !== id)))
  }, [])
  const avisar = useCallback(
    (texto: string, tipo: Tipo = 'exito') => {
      const id = ++siguiente
      setAvisos((a) => [...a, { id, tipo, texto }])
      if (tipo !== 'error') setTimeout(() => cerrar(id), DURACION_VISIBLE_MS)
    },
    [cerrar],
  )
  const valor = useMemo(() => ({ avisar }), [avisar])

  const lista = (tipo: 'status' | 'alert') => (
    <div role={tipo} className="pointer-events-none flex flex-col items-center gap-2">
      {avisos
        .filter((a) => (tipo === 'alert') === (a.tipo === 'error'))
        .map((a) => (
          <div
            key={a.id}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-md border-2 border-current bg-superficie p-3 shadow-3 ${
              a.saliendo ? 'anim-salida' : 'anim-entrada'
            } ${a.tipo === 'error' ? 'text-error' : 'text-exito'}`}
          >
            <Icon name={a.tipo === 'error' ? 'error' : 'check'} />
            <span className="text-texto">{a.texto}</span>
            <button
              type="button"
              onClick={() => cerrar(a.id)}
              aria-label="Cerrar aviso"
              className="objetivo-min flex items-center justify-center rounded-md text-texto transition-colors hover:bg-fondo"
            >
              <Icon name="cerrar" />
            </button>
          </div>
        ))}
    </div>
  )

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-2 z-40 flex flex-col items-center gap-2 px-2">
          {lista('status')}
          {lista('alert')}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast requiere <ToastProvider>')
  return ctx
}
