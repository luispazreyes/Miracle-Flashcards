// Pestañas (patrón tablist): flechas, Inicio y Fin; el panel lo pinta quien llama con aria-labelledby.
import { useRef } from 'react'

export interface Pestana {
  id: string
  etiqueta: string
}

interface Props {
  etiqueta: string
  pestanas: Pestana[]
  activa: string
  onCambiar: (id: string) => void
  /** Prefijo para ids: `${prefijo}-tab-${id}` y `${prefijo}-panel-${id}`. */
  prefijo: string
  className?: string
}

export const idTab = (prefijo: string, id: string) => `${prefijo}-tab-${id}`
export const idPanel = (prefijo: string, id: string) => `${prefijo}-panel-${id}`

export function Tabs({ etiqueta, pestanas, activa, onCambiar, prefijo, className = '' }: Props) {
  const lista = useRef<HTMLDivElement>(null)

  function teclas(e: React.KeyboardEvent) {
    const i = pestanas.findIndex((p) => p.id === activa)
    let n = -1
    if (e.key === 'ArrowRight') n = (i + 1) % pestanas.length
    else if (e.key === 'ArrowLeft') n = (i - 1 + pestanas.length) % pestanas.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = pestanas.length - 1
    if (n < 0) return
    e.preventDefault()
    onCambiar(pestanas[n].id)
    requestAnimationFrame(() => document.getElementById(idTab(prefijo, pestanas[n].id))?.focus())
  }

  return (
    <div ref={lista} role="tablist" aria-label={etiqueta} onKeyDown={teclas} className={`flex gap-1 ${className}`}>
      {pestanas.map((p) => {
        const sel = p.id === activa
        return (
          <button
            key={p.id}
            id={idTab(prefijo, p.id)}
            role="tab"
            type="button"
            aria-selected={sel}
            aria-controls={idPanel(prefijo, p.id)}
            tabIndex={sel ? 0 : -1}
            onClick={() => onCambiar(p.id)}
            className={`objetivo-min flex-1 rounded-md border-2 px-4 font-semibold transition-colors ${
              sel ? 'border-primario bg-primario text-sobre-primario' : 'border-borde text-texto hover:bg-superficie'
            }`}
          >
            {p.etiqueta}
          </button>
        )
      })}
    </div>
  )
}
