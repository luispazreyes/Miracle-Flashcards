// F-03 Panel de palabras (RF-17, RF-20, RF-23, RF-33, RF-34, RF-40, RF-43): grupos, búsqueda, "Agregar a mazo",
// edición y borrado. El arrastre se añade en la Fase 12; el menú ya cubre RF-20 sin arrastre (WCAG 2.5.1).
import { useId, useMemo, useState } from 'react'
import { useRepos } from '../../app/context'
import { useDragActions } from '../../app/DragContext'
import { useDeckIdsByWord, useDeckWords, useDecks, useWords } from '../../app/queries'
import { Button } from '../../components/Button'
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews'
import { TextField } from '../../components/TextField'
import { useToast } from '../../components/Toast'
import { RepoError } from '../../data/repositories'
import { filterWords, groupWords, type Deck, type GroupKind, type Word } from '../../domain'
import { common, messages, words as t } from '../../lib/messages.es'
import { useAnimatedList } from '../../lib/useAnimatedList'
import { DeleteWordDialog, RemoveFromDeckDialog } from './WordDialogs'
import { WordFormDialog } from './WordFormDialog'
import { WordGroup } from './WordGroup'
import { WordRow } from './WordRow'

/**
 * Lleva el foco al elemento cuando la lista en vivo lo pinta. La fila puede volver a crearse al cambiar de grupo,
 * así que durante un momento se recupera el foco si se perdió (cae en <body>), sin quitárselo al usuario si ya
 * lo movió a otro sitio.
 */
function focusWhenReady(selector: string, settleMs = 2000) {
  const start = Date.now()
  const attempt = () => {
    const el = document.querySelector<HTMLElement>(selector)
    const active = document.activeElement
    const lost = !active || active === document.body
    if (el && (lost || Date.now() - start < 50)) el.focus()
    if (Date.now() - start < settleMs) setTimeout(attempt, 50)
  }
  attempt()
}

/** Fila recién guardada (F-04). */
const focusRow = (id: string) => focusWhenReady(`[data-word-id="${id}"] [data-word-main]`)
/** Botón "Agregar a mazo" de la fila, que se vuelve a crear si la palabra cambia de grupo. */
const focusAddButton = (id: string) =>
  focusWhenReady(`[data-word-id="${id}"] button[aria-haspopup="listbox"]`)
/** Tras borrar o quitar una fila el foco no puede quedar en un elemento que ya no existe. */
const focusPanelTitle = () => focusWhenReady('#titulo-panel-palabras')

interface Props {
  selectedDeckId: string | null
}

export function WordsPanel({ selectedDeckId }: Props) {
  const words = useWords()
  const decks = useDecks()
  const deckWords = useDeckWords()
  const deckIdsByWord = useDeckIdsByWord(deckWords.status === 'ready' ? deckWords.data : undefined)
  const repos = useRepos()
  const { deposit } = useDragActions()
  const { notify } = useToast()
  const groupId = useId()

  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Word | null>(null)
  const [deleting, setDeleting] = useState<Word | null>(null)
  const [removing, setRemoving] = useState<{ word: Word; deck: Deck } | null>(null)

  const deckList = useMemo(() => (decks.status === 'ready' ? decks.data : []), [decks])
  const deckById = useMemo(() => new Map(deckList.map((d) => [d.id, d])), [deckList])
  const selected = (selectedDeckId && deckById.get(selectedDeckId)) || null

  if (words.status === 'loading' || decks.status === 'loading' || deckWords.status === 'loading')
    return <LoadingState height="h-16" />
  if (words.status === 'error' || decks.status === 'error' || deckWords.status === 'error')
    return (
      <ErrorState
        text={t.loadError}
        onRetry={() => {
          if (words.status === 'error') words.retry()
          if (decks.status === 'error') decks.retry()
          if (deckWords.status === 'error') deckWords.retry()
        }}
      />
    )

  const all = words.data
  const filtered = filterWords(all, query)
  const groups = groupWords(filtered, deckIdsByWord, selected?.id ?? null)
  const memberOf = (w: Word) =>
    [...(deckIdsByWord.get(w.id) ?? [])]
      .map((id) => deckById.get(id))
      .filter((d): d is Deck => !!d)
      .sort((a, b) => a.normalizedName.localeCompare(b.normalizedName, 'es'))

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  async function addToDeck(word: Word, deckId: string) {
    const deck = deckById.get(deckId)
    if (!deck) return
    try {
      await repos.deckWords.add(deckId, word.id)
      deposit(deckId, word.id) // BR-29: versión breve del depósito (pulso del mazo y de la fila)
      notify(t.added(word.english, deck.name))
      focusAddButton(word.id)
    } catch (e) {
      if (e instanceof RepoError && e.code === 'duplicate-in-deck')
        notify(messages.alreadyInDeck(word.english), 'warning')
      else notify(common.genericError, 'error')
    }
  }

  async function deleteWord(word: Word) {
    setDeleting(null)
    try {
      await repos.words.delete(word.id)
      notify(t.deleted(word.english))
      focusPanelTitle()
    } catch {
      notify(common.genericError, 'error')
    }
  }

  async function removeFromDeck(word: Word, deck: Deck) {
    setRemoving(null)
    try {
      await repos.deckWords.remove(deck.id, word.id)
      notify(t.removed(word.english, deck.name))
      focusAddButton(word.id)
    } catch {
      notify(common.genericError, 'error')
    }
  }

  const title = selected ? t.titleDeck(selected.name) : t.titleAll
  const hasQuery = query.trim() !== ''

  const rowProps = (word: Word, kind: GroupKind, leaving: boolean) => ({
    word,
    kind,
    leaving,
    memberOf: memberOf(word),
    allDecks: deckList,
    removableFrom: selected && deckIdsByWord.get(word.id)?.has(selected.id) ? selected : null,
    highlightNone: kind === 'all',
    onAdd: (deckId: string) => void addToDeck(word, deckId),
    onEdit: () => {
      setEditing(word)
      setFormOpen(true)
    },
    onDelete: () => setDeleting(word),
    onRemoveFromDeck: () => selected && setRemoving({ word, deck: selected }),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-panel-palabras" tabIndex={-1} className="text-lg font-semibold outline-none">
          {title}
        </h2>
        {all.length > 0 && <Button onClick={openNew}>{t.newWord}</Button>}
      </div>

      {all.length > 0 && (
        <>
          <TextField
            label={t.search}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p role="status" className="sr-only">
            {hasQuery && filtered.length > 0 ? t.searchResults(filtered.length) : ''}
          </p>
        </>
      )}

      {all.length === 0 && (
        <EmptyState text={t.empty}>
          <Button onClick={openNew}>{t.newWord}</Button>
        </EmptyState>
      )}

      {all.length > 0 && filtered.length === 0 && (
        <p role="status" className="rounded-md border border-dashed border-borde p-4">
          {messages.noResults(query.trim())}
        </p>
      )}

      {groups.map((group, i) =>
        group.kind === 'all' ? (
          <Rows
            key="all"
            words={group.words}
            render={(w, leaving) => rowProps(w, 'all', leaving)}
          />
        ) : (
          <WordGroup
            key={group.kind}
            kind={group.kind}
            count={group.words.length}
            id={`${groupId}-${i}`}
          >
            <Rows words={group.words} render={(w, leaving) => rowProps(w, group.kind, leaving)} />
          </WordGroup>
        ),
      )}

      <WordFormDialog
        open={formOpen}
        word={editing}
        words={all}
        onClose={() => setFormOpen(false)}
        onSaved={(word) => {
          setFormOpen(false)
          notify(t.saved)
          focusRow(word.id)
        }}
      />
      <DeleteWordDialog
        word={deleting}
        deckCount={deleting ? (deckIdsByWord.get(deleting.id)?.size ?? 0) : 0}
        onCancel={() => setDeleting(null)}
        onConfirm={(w) => void deleteWord(w)}
      />
      <RemoveFromDeckDialog
        target={removing}
        onCancel={() => setRemoving(null)}
        onConfirm={(w, d) => void removeFromDeck(w, d)}
      />
    </div>
  )
}

function Rows({
  words,
  render,
}: {
  words: readonly Word[]
  render: (word: Word, leaving: boolean) => React.ComponentProps<typeof WordRow>
}) {
  const rows = useAnimatedList(words, (w) => w.id)
  return (
    <ul className="flex flex-col gap-2">
      {rows.map(({ item, leaving }) => (
        <WordRow key={item.id} {...render(item, leaving)} />
      ))}
    </ul>
  )
}
