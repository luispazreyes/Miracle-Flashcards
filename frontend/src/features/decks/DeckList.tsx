// Lista de mazos (F-02): "Todas las palabras", mazos con selección y flechas, formulario en línea y estados.
import { useState } from 'react'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/StateViews'
import type { Deck } from '../../domain'
import { decks as t } from '../../lib/messages.es'
import { useAnimatedList } from '../../lib/useAnimatedList'
import { DeckForm } from './DeckForm'
import { DeckItem } from './DeckItem'

interface Props {
  decks: readonly Deck[]
  counts: ReadonlyMap<string, number>
  selectedId: string | null
  onSelect: (id: string | null) => void
  onStudy: (deck: Deck) => void
  onCreate: (name: string) => Promise<string | undefined>
  onRename: (id: string, name: string) => Promise<string | undefined>
  onDelete: (deck: Deck) => void
}

export function DeckList({
  decks,
  counts,
  selectedId,
  onSelect,
  onStudy,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const rows = useAnimatedList(decks, (d) => d.id)

  /** Flechas arriba/abajo recorren la lista (F-02); Tab sigue funcionando con normalidad. */
  function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const targets = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-deck-select]')]
    const i = targets.indexOf(document.activeElement as HTMLElement)
    if (i < 0) return
    e.preventDefault()
    targets[i + (e.key === 'ArrowDown' ? 1 : -1)]?.focus()
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- delegación de flechas; cada botón ya es operable con Tab
    <div className="flex flex-col gap-3" onKeyDown={onKeyDown}>
      {creating ? (
        <DeckForm
          decks={decks}
          submitLabel={t.create}
          onCancel={() => setCreating(false)}
          onSubmit={async (name) => {
            const error = await onCreate(name)
            if (!error) setCreating(false)
            return error
          }}
        />
      ) : (
        decks.length > 0 && (
          <Button variant="secondary" onClick={() => setCreating(true)}>
            {t.newDeck}
          </Button>
        )
      )}

      <ul className="flex flex-col gap-2" aria-label={t.listLabel}>
        <li>
          <button
            type="button"
            data-deck-select
            aria-current={selectedId === null ? 'true' : undefined}
            onClick={() => onSelect(null)}
            className={`objetivo-min w-full rounded-md border-2 px-3 py-2 text-left font-semibold transition-colors ${
              selectedId === null
                ? 'border-primario bg-grupo-mazo'
                : 'border-borde bg-superficie hover:bg-fondo'
            }`}
          >
            {t.all}
          </button>
        </li>
        {rows.map(({ item: deck, leaving }) =>
          editingId === deck.id && !leaving ? (
            <li key={deck.id}>
              <DeckForm
                initial={deck.name}
                decks={decks}
                excludeId={deck.id}
                submitLabel={t.save}
                onCancel={() => setEditingId(null)}
                onSubmit={async (name) => {
                  const error = await onRename(deck.id, name)
                  if (!error) setEditingId(null)
                  return error
                }}
              />
            </li>
          ) : (
            <DeckItem
              key={deck.id}
              deck={deck}
              wordCount={counts.get(deck.id) ?? 0}
              selected={selectedId === deck.id}
              leaving={leaving}
              onSelect={() => onSelect(deck.id)}
              onStudy={() => onStudy(deck)}
              onRename={() => setEditingId(deck.id)}
              onDelete={() => onDelete(deck)}
            />
          ),
        )}
      </ul>

      {decks.length === 0 && !creating && (
        <EmptyState text={t.empty}>
          <Button onClick={() => setCreating(true)}>{t.newDeck}</Button>
        </EmptyState>
      )}
    </div>
  )
}
