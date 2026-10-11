// RF-20: "Agregar a mazo" con búsqueda predictiva (sin mayúsculas ni acentos, por subcadena).
// Patrón combobox ARIA: role="combobox", aria-expanded, aria-activedescendant.
import { useId, useMemo, useRef, useState } from 'react'
import { normalizar } from '../lib/texto'
import type { Mazo } from '../state/DataContext'
import { Icon } from './Icon'
import { Popover } from './Popover'

interface Props {
  etiqueta: string
  mazos: Mazo[]
  onElegir: (mazo: Mazo) => void
}

export function ComboboxMazos({ etiqueta, mazos, onElegir }: Props) {
  const id = useId()
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [activo, setActivo] = useState(0)
  const boton = useRef<HTMLButtonElement>(null)

  const filtrados = useMemo(
    () => mazos.filter((m) => normalizar(m.nombre).includes(normalizar(texto))),
    [mazos, texto],
  )

  function cerrar(devolverFoco: boolean) {
    setAbierto(false)
    setTexto('')
    setActivo(0)
    if (devolverFoco) boton.current?.focus()
  }

  function elegir(m: Mazo) {
    cerrar(true)
    onElegir(m)
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActivo((a) => Math.min(a + 1, filtrados.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const m = filtrados[activo]
      if (m) elegir(m)
    } else if (e.key === 'Tab') cerrar(false)
  }

  return (
    <>
      <button
        ref={boton}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={etiqueta}
        onClick={() => (abierto ? cerrar(false) : setAbierto(true))}
        className="objetivo-min flex items-center justify-center gap-1 rounded-md border border-borde px-3 text-sm font-semibold transition-colors hover:bg-fondo"
      >
        <Icon name="mascircular" className="size-4" />
        <span>Agregar a mazo</span>
      </button>
      {abierto && (
        <Popover ancla={boton} onCerrar={(m) => cerrar(m === 'esc')} ancho="18rem">
          <label htmlFor={`${id}-q`} className="sr-only">
            Buscar mazo
          </label>
          <input
            id={`${id}-q`}
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-lista`}
            aria-autocomplete="list"
            aria-activedescendant={filtrados[activo] ? `${id}-o-${filtrados[activo].id}` : undefined}
            placeholder="Buscar mazo…"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setActivo(0)
            }}
            onKeyDown={teclas}
            className="objetivo-min mb-1 w-full rounded-md border border-borde bg-fondo px-3 text-texto"
          />
          <ul id={`${id}-lista`} role="listbox" aria-label="Mazos">
            {filtrados.map((m, i) => (
              <li
                key={m.id}
                id={`${id}-o-${m.id}`}
                role="option"
                aria-selected={i === activo}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(m)}
                className={`objetivo-min flex cursor-pointer items-center gap-2 rounded-sm px-3 transition-colors ${
                  i === activo ? 'bg-primario text-sobre-primario' : 'hover:bg-fondo'
                }`}
              >
                <Icon name="carpeta" className="size-4" />
                {m.nombre}
              </li>
            ))}
          </ul>
          <p role="status" className="px-3 py-2 text-sm text-texto-suave">
            {mazos.length === 0
              ? 'Aún no tienes mazos. Crea uno primero.'
              : filtrados.length === 0
                ? `Sin resultados para «${texto}».`
                : ''}
          </p>
        </Popover>
      )}
    </>
  )
}
