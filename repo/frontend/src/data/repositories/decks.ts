import { validateDeckName, type Deck } from '../../domain'
import { enqueue, RepoError, writeTx, type RepoDeps } from './context'
import { deleteEventsForDeck } from './events'

export function createDeckRepository(deps: RepoDeps) {
  const { db } = deps

  return {
    list: () => db.decks.toArray(),
    get: (id: string) => db.decks.get(id),

    /** BR-19: nombre recortado, obligatorio, ≤ 60 y único sin mayúsculas ni acentos. */
    async create(rawName: string): Promise<Deck> {
      return writeTx(deps, async () => {
        const parsed = validateDeckName(rawName, await db.decks.toArray())
        if (!parsed.ok) throw new RepoError('invalid-deck-name', { deckName: parsed.error })
        const deck: Deck = {
          id: deps.newId(),
          userId: deps.userId,
          name: parsed.value.name,
          normalizedName: parsed.value.normalizedName,
          updatedAt: deps.now(),
        }
        await db.decks.add(deck)
        await enqueue(deps, {
          type: 'deck.create',
          payload: { id: deck.id, name: deck.name, normalizedName: deck.normalizedName },
        })
        return deck
      })
    },

    async rename(id: string, rawName: string): Promise<Deck> {
      return writeTx(deps, async () => {
        const current = await db.decks.get(id)
        if (!current) throw new RepoError('not-found')
        const parsed = validateDeckName(rawName, await db.decks.toArray(), id)
        if (!parsed.ok) throw new RepoError('invalid-deck-name', { deckName: parsed.error })
        const next: Deck = { ...current, ...parsed.value, updatedAt: deps.now() }
        await db.decks.put(next)
        await enqueue(deps, {
          type: 'deck.rename',
          payload: { id, name: next.name, normalizedName: next.normalizedName },
        })
        return next
      })
    },

    /** BR-20: borra el mazo, sus pertenencias y sus eventos. Las palabras se conservan (quedan "Sin mazo"). */
    async delete(id: string): Promise<void> {
      await writeTx(deps, async () => {
        if (!(await db.decks.get(id))) throw new RepoError('not-found')
        await deleteEventsForDeck(db, id)
        await db.deckWords.where('deckId').equals(id).delete()
        await db.decks.delete(id)
        await enqueue(deps, { type: 'deck.delete', payload: { id } })
      })
    },
  }
}

export type DeckRepository = ReturnType<typeof createDeckRepository>
