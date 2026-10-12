// Consultas reactivas de la sesión: leen de Dexie y se actualizan solas (useLiveQuery).
import { useMemo } from 'react'
import { type Deck, type DeckWord, type Preference, type Word } from '../domain'
import { useLive, type Live } from '../data/hooks/useLive'
import { useRuntime } from './context'

const byName = (a: Deck, b: Deck) => a.normalizedName.localeCompare(b.normalizedName, 'es')

export function useDecks(): Live<Deck[]> {
  const { db } = useRuntime()
  return useLive(async () => (await db.decks.toArray()).sort(byName), [db])
}

export function useWords(): Live<Word[]> {
  const { db } = useRuntime()
  return useLive(() => db.words.toArray(), [db])
}

export function useDeckWords(): Live<DeckWord[]> {
  const { db } = useRuntime()
  return useLive(() => db.deckWords.toArray(), [db])
}

export function usePreference(): Live<Preference | null> {
  const { db, userId } = useRuntime()
  return useLive(async () => (await db.preferences.get(userId)) ?? null, [db, userId])
}

/** Ids de los mazos de cada palabra (para agrupar y marcar, BR-22, BR-23). */
export function useDeckIdsByWord(deckWords: readonly DeckWord[] | undefined) {
  return useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const dw of deckWords ?? []) {
      const set = map.get(dw.wordId) ?? new Set<string>()
      set.add(dw.deckId)
      map.set(dw.wordId, set)
    }
    return map
  }, [deckWords])
}
