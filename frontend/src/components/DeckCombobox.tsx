// "Agregar a mazo" (RF-20): botón + combobox ARIA con búsqueda predictiva por subcadena, sin mayúsculas
// ni acentos (BR-26). Es la alternativa sin arrastre (WCAG 2.5.1).
import { useId, useRef, useState } from 'react'
import { filterDecks } from '../domain'
import { messages } from '../lib/messages.es'
import { Icon } from './Icon'
import { Popover } from './Popover'

interface Props {
  decks: readonly { id: string; name: string }[]
  /** Nombre accesible del botón, p. ej. "Agregar «Apple» a un mazo". */
  label: string
  buttonText: string
  searchLabel: string
  onPick: (deckId: string) => void
}

export function DeckCombobox({ decks, label, buttonText, searchLabel, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const button = useRef<HTMLButtonElement>(null)
  const listId = useId()

  const matches = filterDecks(decks, query)
  const current = Math.min(active, matches.length - 1)
  const optionId = (i: number) => `${listId}-${i}`

  function close() {
    setOpen(false)
    setQuery('')
    setActive(0)
  }

  function pick(id: string) {
    close()
    button.current?.focus()
    onPick(id)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(matches.length ? (current + 1) % matches.length : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(matches.length ? (current - 1 + matches.length) % matches.length : 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (matches[current]) pick(matches[current].id)
    }
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex objetivo-min items-center gap-1 rounded-md border border-borde px-3 font-semibold text-texto transition-colors hover:bg-fondo"
      >
        <Icon name="plusCircle" />
        <span className="max-sm:sr-only">{buttonText}</span>
      </button>
      {open && (
        <Popover anchor={button} onClose={close} width="18rem" dialog label={searchLabel}>
          <div className="flex flex-col gap-2 p-2">
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus -- el combobox se abre para escribir
              autoFocus
              type="text"
              role="combobox"
              aria-label={searchLabel}
              aria-expanded={matches.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={matches.length ? optionId(current) : undefined}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
              autoComplete="off"
              className="objetivo-min rounded-md border border-borde bg-fondo px-3 text-base text-texto"
            />
            {
              <ul
                id={listId}
                role="listbox"
                aria-label={searchLabel}
                hidden={matches.length === 0}
                className="flex flex-col"
              >
                {matches.map((d, i) => (
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- el teclado opera desde el combobox (activedescendant)
                  <li
                    key={d.id}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === current}
                    onClick={() => pick(d.id)}
                    className={`flex objetivo-min cursor-pointer items-center rounded-sm px-3 transition-colors ${
                      i === current ? 'bg-primario text-sobre-primario' : 'hover:bg-fondo'
                    }`}
                  >
                    {d.name}
                  </li>
                ))}
              </ul>
            }
            {matches.length === 0 && (
              <p role="status" className="px-3 py-2 text-texto-suave">
                {messages.noResults(query.trim())}
              </p>
            )}
          </div>
        </Popover>
      )}
    </>
  )
}
