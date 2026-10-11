// Contenedor flotante anclado a un botón (menús y combobox). Se pinta en un portal con posición fija
// para que no lo recorten los paneles con scroll.
import { useLayoutEffect, useEffect, useRef, useState, type ReactNode, type RefObject, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  ancla: RefObject<HTMLElement | null>
  /** `esc`: devolver el foco al ancla; `fuera`: el usuario siguió su camino. */
  onCerrar: (motivo: 'esc' | 'fuera') => void
  children: ReactNode
  ancho?: string
  etiqueta?: string
}

const ALTO_ESTIMADO_PX = 280

export function Popover({ ancla, onCerrar, children, ancho = '16rem', etiqueta }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const [estilo, setEstilo] = useState<CSSProperties>({ visibility: 'hidden' })

  useLayoutEffect(() => {
    const r = ancla.current?.getBoundingClientRect()
    if (!r) return
    const arriba = r.bottom + ALTO_ESTIMADO_PX > window.innerHeight && r.top > ALTO_ESTIMADO_PX
    setEstilo({
      position: 'fixed',
      right: Math.max(8, window.innerWidth - r.right),
      ...(arriba ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      width: `min(${ancho}, calc(100vw - 1rem))`,
    })
  }, [ancla, ancho])

  useEffect(() => {
    const fuera = (e: PointerEvent) => {
      const t = e.target as Node
      if (!panel.current?.contains(t) && !ancla.current?.contains(t)) onCerrar('fuera')
    }
    const cerrar = () => onCerrar('fuera')
    document.addEventListener('pointerdown', fuera)
    window.addEventListener('resize', cerrar)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      window.removeEventListener('resize', cerrar)
    }
  }, [ancla, onCerrar])

  return createPortal(
    <div
      ref={panel}
      aria-label={etiqueta}
      style={estilo}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onCerrar('esc')
          ancla.current?.focus()
        }
      }}
      className="anim-menu z-20 max-h-72 overflow-y-auto rounded-md border border-borde bg-superficie p-1 shadow-2"
    >
      {children}
    </div>,
    document.body,
  )
}
