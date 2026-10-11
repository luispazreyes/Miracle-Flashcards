// Menú de acciones ("Más acciones"): patrón menu button ARIA con flechas, Inicio/Fin, Esc.
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { Popover } from './Popover'

export interface ItemMenu {
  texto: string
  onSelect: () => void
  peligro?: boolean
}

interface Props {
  /** Nombre accesible completo, p. ej. "Más acciones de «Mazo 1»". */
  etiqueta: string
  items: ItemMenu[]
}

export function MenuAcciones({ etiqueta, items }: Props) {
  const [abierto, setAbierto] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const lista = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (abierto) lista.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus()
  }, [abierto])

  function mover(e: React.KeyboardEvent) {
    const els = [...(lista.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])]
    const i = els.indexOf(document.activeElement as HTMLElement)
    const ir = (n: number) => {
      e.preventDefault()
      els[(n + els.length) % els.length]?.focus()
    }
    if (e.key === 'ArrowDown') ir(i + 1)
    else if (e.key === 'ArrowUp') ir(i - 1)
    else if (e.key === 'Home') ir(0)
    else if (e.key === 'End') ir(els.length - 1)
    else if (e.key === 'Tab') setAbierto(false)
  }

  return (
    <>
      <button
        ref={boton}
        type="button"
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className="objetivo-min flex items-center justify-center rounded-md text-texto transition-colors hover:bg-fondo"
      >
        <Icon name="mas" className="size-6" />
      </button>
      {abierto && (
        <Popover ancla={boton} onCerrar={() => setAbierto(false)} ancho="12rem">
          <div ref={lista} role="menu" aria-label={etiqueta} onKeyDown={mover}>
            {items.map((it) => (
              <button
                key={it.texto}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  setAbierto(false)
                  boton.current?.focus()
                  it.onSelect()
                }}
                className={`objetivo-min flex w-full items-center rounded-sm px-3 text-left font-semibold transition-colors hover:bg-fondo ${
                  it.peligro ? 'text-error' : 'text-texto'
                }`}
              >
                {it.texto}
              </button>
            ))}
          </div>
        </Popover>
      )}
    </>
  )
}
