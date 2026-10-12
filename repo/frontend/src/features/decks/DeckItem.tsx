// Fila de mazo (F-02): selección, "Estudiar" y menú de acciones. Un solo objetivo de selección por fila y
// botones independientes (≥ 44 px). `data-deck-id` lo usa el arrastre como destino (Fase 12).
import { useDragUi } from '../../app/DragContext'
import { ActionMenu } from '../../components/ActionMenu'
import { Button } from '../../components/Button'
import type { Deck } from '../../domain'
import { Icon } from '../../components/Icon'
import { decks as t, drag as dragText } from '../../lib/messages.es'

interface Props {
  deck: Deck
  wordCount: number
  selected: boolean
  leaving: boolean
  onSelect: () => void
  onStudy: () => void
  onRename: () => void
  onDelete: () => void
}

export function DeckItem({
  deck,
  wordCount,
  selected,
  leaving,
  onSelect,
  onStudy,
  onRename,
  onDelete,
}: Props) {
  const empty = wordCount === 0
  const ui = useDragUi()
  const dragActive = ui.dragging !== null && !leaving
  const hovered = dragActive && ui.dragging?.hoverDeckId === deck.id
  const pulse = ui.pulse?.deckId === deck.id ? ui.pulse : null
  const reasonId = `deck-${deck.id}-reason`
  return (
    <li
      data-deck-id={leaving ? undefined : deck.id}
      inert={leaving || undefined}
      className={`relative rounded-md border-2 transition ${
        leaving ? 'anim-salida' : 'anim-entrada'
      } ${
        hovered
          ? 'scale-(--mov-escala-elevada) border-solid border-primario bg-grupo-mazo shadow-2'
          : selected
            ? 'border-primario bg-grupo-mazo'
            : `border-borde bg-superficie hover:bg-fondo ${dragActive ? 'border-dashed' : ''}`
      }`}
    >
      {pulse && (
        <span
          key={pulse.nonce}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 anim-pulso-anillo rounded-md border-2 border-primario"
        />
      )}
      <div className="flex items-center gap-1 p-1">
        <button
          type="button"
          data-deck-select
          aria-current={selected ? 'true' : undefined}
          onClick={onSelect}
          className="objetivo-min min-w-0 flex-1 rounded-sm px-2 py-1 text-left"
        >
          <span className="block truncate font-semibold">{deck.name}</span>
          <span className="block text-sm text-texto-suave">
            <span
              key={pulse?.nonce ?? 'idle'}
              className={pulse ? 'anim-pulso-contador' : undefined}
            >
              {t.words(wordCount)}
            </span>
          </span>
          {hovered && (
            <span className="flex items-center gap-1 text-sm font-semibold text-primario">
              <Icon name="plusCircle" className="size-4" />
              {dragText.dropHere}
            </span>
          )}
        </button>
        <Button
          variant="secondary"
          aria-label={t.studyAria(deck.name)}
          aria-disabled={empty || undefined}
          aria-describedby={empty ? reasonId : undefined}
          onClick={() => {
            if (!empty) onStudy()
          }}
          className="px-3"
        >
          {t.study}
        </Button>
        <ActionMenu
          label={t.moreActions(deck.name)}
          items={[
            { text: t.rename, onSelect: onRename },
            { text: t.remove, onSelect: onDelete, danger: true },
          ]}
        />
      </div>
      {empty && (
        <p id={reasonId} className="sr-only">
          {t.studyEmpty}
        </p>
      )}
    </li>
  )
}
