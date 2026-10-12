import { duplicateInDeck, type Deck, type DeckWord, type Word } from '../../domain'
import { enqueue, RepoError, writeTx, type RepoDeps } from './context'
import { deleteEventsForPair } from './events'

export function createDeckWordRepository(deps: RepoDeps) {
  const { db } = deps

  return {
    listAll: () => db.deckWords.toArray(),
    forDeck: (deckId: string) => db.deckWords.where('deckId').equals(deckId).toArray(),

    /** Todo lo que necesita una sesión de estudio de un mazo (RF-35). `null` si el mazo no existe. */
    async studySet(
      deckId: string,
    ): Promise<{ deck: Deck; words: Word[]; entries: DeckWord[] } | null> {
      const deck = await db.decks.get(deckId)
      if (!deck) return null
      const entries = await db.deckWords.where('deckId').equals(deckId).toArray()
      const words = (await db.words.bulkGet(entries.map((e) => e.wordId))).filter(
        (w): w is Word => !!w,
      )
      return { deck, words, entries: entries.filter((e) => words.some((w) => w.id === e.wordId)) }
    },

    /**
     * Agrega una palabra a un mazo (RF-23). BR-13: si el mazo ya tiene ese término (misma palabra u otra con
     * el mismo `normalizedEnglish`) se bloquea. En otro mazo distinto sí se permite.
     */
    async add(deckId: string, wordId: string): Promise<DeckWord> {
      return writeTx(deps, async () => {
        const [deck, word] = await Promise.all([db.decks.get(deckId), db.words.get(wordId)])
        if (!deck || !word) throw new RepoError('not-found')
        const members = await db.deckWords.where('deckId').equals(deckId).toArray()
        const memberWords = await db.words.bulkGet(members.map((m) => m.wordId))
        const terms = memberWords.flatMap((w) => (w ? [w.normalizedEnglish] : []))
        if (duplicateInDeck(terms, word.normalizedEnglish))
          throw new RepoError('duplicate-in-deck', { english: word.english })
        const entry: DeckWord = { deckId, wordId, consecutiveHits: 0, status: 'pending' }
        await db.deckWords.add(entry)
        await enqueue(deps, { type: 'deckWord.add', payload: { deckId, wordId } })
        return entry
      })
    },

    /** BR-14: quita la palabra del mazo y elimina su progreso allí; la palabra se conserva. */
    async remove(deckId: string, wordId: string): Promise<void> {
      await writeTx(deps, async () => {
        if (!(await db.deckWords.get([deckId, wordId]))) throw new RepoError('not-found')
        await deleteEventsForPair(db, deckId, wordId)
        await db.deckWords.delete([deckId, wordId])
        await enqueue(deps, { type: 'deckWord.remove', payload: { deckId, wordId } })
      })
    },
  }
}

export type DeckWordRepository = ReturnType<typeof createDeckWordRepository>
