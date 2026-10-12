// Contenedor flotante anclado a un botón (menús y combobox). Se pinta en un portal con posición fija
// para que no lo recorten los paneles con scroll.
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

interface Props {
  anchor: RefObject<HTMLElement | null>
  /** `esc`: el foco vuelve al ancla; `outside`: el usuario siguió su camino. */
  onClose: (reason: 'esc' | 'outside') => void
  children: ReactNode
  width?: string
  label?: string
  /** Panel no modal con su propio rol (p. ej. búsqueda con combobox): cuenta como región de la página. */
  dialog?: boolean
}

const ESTIMATED_HEIGHT_PX = 280

export function Popover({ anchor, onClose, children, width = '16rem', label, dialog }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({ opacity: 0 })

  useLayoutEffect(() => {
    const r = anchor.current?.getBoundingClientRect()
    if (!r) return
    const above = r.bottom + ESTIMATED_HEIGHT_PX > window.innerHeight && r.top > ESTIMATED_HEIGHT_PX
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la posición depende del DOM ya medido
    setStyle({
      position: 'fixed',
      right: Math.max(8, window.innerWidth - r.right),
      ...(above ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      width: `min(${width}, calc(100vw - 1rem))`,
    })
  }, [anchor, width])

  useEffect(() => {
    const outside = (e: PointerEvent) => {
      const t = e.target as Node
      if (!panel.current?.contains(t) && !anchor.current?.contains(t)) onClose('outside')
    }
    const close = () => onClose('outside')
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('resize', close)
    }
  }, [anchor, onClose])

  return createPortal(
    <div
      ref={panel}
      role={dialog ? 'dialog' : undefined}
      aria-label={label}
      style={style}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose('esc')
          anchor.current?.focus()
        }
      }}
      className="z-20 max-h-72 anim-menu overflow-y-auto rounded-md border border-borde bg-superficie p-1 shadow-2"
    >
      {children}
    </div>,
    document.body,
  )
}
