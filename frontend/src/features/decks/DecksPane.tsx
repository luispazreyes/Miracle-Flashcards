// Columna de mazos (F-02): lee de Dexie, escribe con los repositorios y avisa de cada resultado.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useRepos } from '../../app/context'
import { useDeckWords, useDecks } from '../../app/queries'
import { ErrorState, LoadingState } from '../../components/StateViews'
import { useToast } from '../../components/Toast'
import { RepoError } from '../../data/repositories'
import type { Deck } from '../../domain'
import { common, deckNameErrors, decks as t } from '../../lib/messages.es'
import { DeckList } from './DeckList'
import { DeleteDeckDialog } from './DeleteDeckDialog'

interface Props {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

const errorText = (e: unknown) =>
  e instanceof RepoError && e.code === 'invalid-deck-name' && e.detail?.deckName
    ? deckNameErrors[e.detail.deckName]
    : common.genericError

export function DecksPane({ selectedId, onSelect }: Props) {
  const decks = useDecks()
  const deckWords = useDeckWords()
  const repos = useRepos()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState<Deck | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    if (deckWords.status === 'ready')
      for (const dw of deckWords.data) map.set(dw.deckId, (map.get(dw.deckId) ?? 0) + 1)
    return map
  }, [deckWords])

  // Un `?deck=` que ya no existe (p. ej. mazo borrado en otro dispositivo) vuelve a "Todas las palabras".
  const knownIds = decks.status === 'ready' ? decks.data.map((d) => d.id).join() : null
  useEffect(() => {
    if (knownIds !== null && selectedId && !knownIds.split(',').includes(selectedId)) onSelect(null)
  }, [knownIds, selectedId, onSelect])

  if (decks.status === 'loading' || deckWords.status === 'loading') return <LoadingState />
  if (decks.status === 'error' || deckWords.status === 'error')
    return (
      <ErrorState
        text={t.loadError}
        onRetry={() => {
          if (decks.status === 'error') decks.retry()
          if (deckWords.status === 'error') deckWords.retry()
        }}
      />
    )

  const list = decks.data

  async function create(name: string) {
    try {
      const deck = await repos.decks.create(name)
      onSelect(deck.id)
      notify(t.created(deck.name))
    } catch (e) {
      return errorText(e)
    }
  }

  async function rename(id: string, name: string) {
    try {
      const deck = await repos.decks.rename(id, name)
      notify(t.renamed(deck.name))
    } catch (e) {
      return errorText(e)
    }
  }

  async function remove(deck: Deck) {
    setDeleting(null)
    try {
      await repos.decks.delete(deck.id)
      if (selectedId === deck.id) onSelect(null)
      notify(t.deleted(deck.name))
      // La fila borrada ya no existe: el foco vuelve al inicio de la lista.
      setTimeout(() => document.querySelector<HTMLElement>('[data-deck-select]')?.focus(), 0)
    } catch {
      notify(common.genericError, 'error')
    }
  }

  function select(id: string | null) {
    onSelect(id)
    const name = list.find((d) => d.id === id)?.name
    setAnnouncement(name ? t.selected(name) : t.selectedAll)
  }

  return (
    <>
      <DeckList
        decks={list}
        counts={counts}
        selectedId={selectedId}
        onSelect={select}
        onStudy={(deck) => navigate(`/estudio/${deck.id}`)}
        onCreate={create}
        onRename={rename}
        onDelete={setDeleting}
      />
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <DeleteDeckDialog
        deck={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={(d) => void remove(d)}
      />
    </>
  )
}
