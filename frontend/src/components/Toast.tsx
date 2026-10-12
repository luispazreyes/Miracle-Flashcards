// Avisos (prototype-spec §A.7): informativos en role="status"; errores en role="alert" y no desaparecen
// solos. Entrada y salida animadas (RF-44).
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { waitForExit } from '../lib/motion'
import { Icon } from './Icon'

type Kind = 'info' | 'success' | 'error' | 'warning'
interface ToastItem {
  id: number
  kind: Kind
  text: string
  leaving?: boolean
}

const ToastContext = createContext<{ notify: (text: string, kind?: Kind) => void } | null>(null)
const VISIBLE_MS = 6000
let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const close = useCallback((id: number) => {
    setItems((a) => a.map((x) => (x.id === id ? { ...x, leaving: true } : x)))
    waitForExit(() => setItems((a) => a.filter((x) => x.id !== id)))
  }, [])
  const notify = useCallback(
    (text: string, kind: Kind = 'success') => {
      const id = ++nextId
      setItems((a) => [...a, { id, kind, text }])
      if (kind !== 'error') setTimeout(() => close(id), VISIBLE_MS)
    },
    [close],
  )
  const value = useMemo(() => ({ notify }), [notify])

  const region = (role: 'status' | 'alert') => (
    <div role={role} className="pointer-events-none flex flex-col items-center gap-2">
      {items
        .filter((a) => (role === 'alert') === (a.kind === 'error'))
        .map((a) => (
          <div
            key={a.id}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-md border-2 border-current bg-superficie p-3 shadow-3 ${
              a.leaving ? 'anim-salida' : 'anim-entrada'
            } ${a.kind === 'error' ? 'text-error' : a.kind === 'warning' ? 'text-aviso' : 'text-exito'}`}
          >
            <Icon name={a.kind === 'error' ? 'error' : a.kind === 'warning' ? 'alert' : 'check'} />
            <span className="text-texto">{a.text}</span>
            <button
              type="button"
              onClick={() => close(a.id)}
              aria-label="Cerrar aviso"
              className="flex objetivo-min items-center justify-center rounded-md text-texto transition-colors hover:bg-fondo"
            >
              <Icon name="close" />
            </button>
          </div>
        ))}
    </div>
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-2 z-40 flex flex-col items-center gap-2 px-2">
          {region('status')}
          {region('alert')}
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
