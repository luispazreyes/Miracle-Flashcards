// Menú de acciones ("Más acciones"): patrón menu button ARIA con flechas, Inicio/Fin y Esc.
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { Popover } from './Popover'

export interface MenuItem {
  text: string
  onSelect: () => void
  danger?: boolean
}

interface Props {
  /** Nombre accesible completo, p. ej. "Más acciones de «Mazo 1»". */
  label: string
  items: MenuItem[]
}

export function ActionMenu({ label, items }: Props) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus()
  }, [open])

  function onKeyDown(e: React.KeyboardEvent) {
    const els = [...(list.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])]
    const i = els.indexOf(document.activeElement as HTMLElement)
    const go = (n: number) => {
      e.preventDefault()
      els[(n + els.length) % els.length]?.focus()
    }
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(els.length - 1)
    else if (e.key === 'Tab') setOpen(false)
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex objetivo-min items-center justify-center rounded-md text-texto transition-colors hover:bg-fondo"
      >
        <Icon name="more" className="size-6" />
      </button>
      {open && (
        <Popover anchor={button} onClose={() => setOpen(false)} width="12rem">
          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- el foco lo gestionan los menuitem (roving) */}
          <div ref={list} role="menu" aria-label={label} onKeyDown={onKeyDown}>
            {items.map((it) => (
              <button
                key={it.text}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  setOpen(false)
                  button.current?.focus()
                  it.onSelect()
                }}
                className={`flex objetivo-min w-full items-center rounded-sm px-3 text-left font-semibold transition-colors hover:bg-fondo ${
                  it.danger ? 'text-error' : 'text-texto'
                }`}
              >
                {it.text}
              </button>
            ))}
          </div>
        </Popover>
      )}
    </>
  )
}
