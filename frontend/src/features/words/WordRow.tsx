// Fila de palabra (F-03): inglés, español, miniatura, insignias de mazos, "Agregar a mazo" y "Más acciones".
// `data-word-id` identifica la fila (foco tras guardar, arrastre en la Fase 12).
import { useDragActions, useDragUi } from '../../app/DragContext'
import { ActionMenu, type MenuItem } from '../../components/ActionMenu'
import { Badge } from '../../components/Badge'
import { Icon } from '../../components/Icon'
import { DeckCombobox } from '../../components/DeckCombobox'
import { WordImage } from '../../components/WordImage'
import type { Deck, GroupKind, Word } from '../../domain'
import { words as t } from '../../lib/messages.es'
import { useIsWide } from '../../lib/useIsWide'

interface Props {
  word: Word
  /** Mazos a los que pertenece la palabra. */
  memberOf: readonly Deck[]
  /** Todos los mazos (opciones de "Agregar a mazo"). */
  allDecks: readonly Deck[]
  kind: GroupKind
  /** Mazo seleccionado, si la palabra está en él ("Quitar de este mazo"). */
  removableFrom: Deck | null
  leaving: boolean
  /** Resalta la fila sin mazo en la lista completa (BR-23). */
  highlightNone: boolean
  onAdd: (deckId: string) => void
  onEdit: () => void
  onDelete: () => void
  onRemoveFromDeck: () => void
}

const where: Record<GroupKind, string> = {
  deck: t.whereDeck,
  others: t.whereOthers,
  none: t.whereNone,
  all: t.whereAll,
}

export function WordRow({
  word,
  memberOf,
  allDecks,
  kind,
  removableFrom,
  leaving,
  highlightNone,
  onAdd,
  onEdit,
  onDelete,
  onRemoveFromDeck,
}: Props) {
  const items: MenuItem[] = [
    { text: t.edit, onSelect: onEdit },
    ...(removableFrom ? [{ text: t.removeFromDeck, onSelect: onRemoveFromDeck }] : []),
    { text: t.remove, onSelect: onDelete, danger: true },
  ]
  const noDeck = memberOf.length === 0
  const ui = useDragUi()
  const actions = useDragActions()
  const canDrag = useIsWide() && !leaving
  const dimmed = ui.dragging?.wordId === word.id
  const pulsing = ui.pulse?.wordId === word.id ? ui.pulse : null
  const whereText = noDeck && kind === 'all' ? t.whereNone : where[kind]

  return (
    <li
      data-word-id={leaving ? undefined : word.id}
      inert={leaving || undefined}
      className={`relative rounded-md border border-borde transition hover:border-primario ${
        leaving ? 'anim-salida' : 'anim-entrada'
      } ${highlightNone && noDeck ? 'border-2 bg-grupo-sin' : 'bg-superficie'} ${
        dimmed ? 'opacity-50' : ''
      }`}
    >
      {pulsing && (
        <span
          key={pulsing.nonce}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 anim-pulso-anillo rounded-md border-2 border-primario"
        />
      )}
      <div className="flex min-h-14 items-center gap-3 p-2">
        {canDrag && (
          // Asa solo para ratón y táctil: la alternativa sin arrastre es "Agregar a mazo" (WCAG 2.5.1).
          <span
            data-drag-handle
            aria-hidden="true"
            onPointerDown={(e) => actions.begin(word, e)}
            className="flex objetivo-min cursor-grab touch-none items-center justify-center rounded-md text-texto-suave select-none hover:bg-fondo"
          >
            <Icon name="grip" />
          </span>
        )}
        <div
          data-word-main
          tabIndex={-1}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-sm outline-none focus-visible:outline-solid"
        >
          {word.imageUrl && <WordImage src={word.imageUrl} />}
          <div className="min-w-0 flex-1">
            <p lang="en" className="truncate font-semibold">
              {word.english}
            </p>
            <p className="truncate text-texto-suave">
              <span className="sr-only">{t.rowSr(word.spanish, whereText)}</span>
              <span aria-hidden="true">{word.spanish}</span>
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {noDeck && kind === 'all' && <Badge icon="dash">{t.groupNone}</Badge>}
              {memberOf.map((d) => (
                <Badge key={d.id} icon="folder">
                  {d.name}
                </Badge>
              ))}
              {!word.imageVerified && (
                <Badge icon="alert" tone="warning">
                  {t.unverified}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <DeckCombobox
          decks={allDecks}
          label={t.addToDeckAria(word.english)}
          buttonText={t.addToDeck}
          searchLabel={t.searchDeck}
          onPick={onAdd}
        />
        <ActionMenu label={t.moreActions(word.english)} items={items} />
      </div>
    </li>
  )
}
