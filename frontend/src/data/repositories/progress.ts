import { applyAnswer, reactivate, type DeckWord } from '../../domain'
import { enqueue, RepoError, writeTx, type RepoDeps } from './context'

const ORDER_KEY = 'localOrderCounter'

export function createProgressRepository(deps: RepoDeps) {
  const { db } = deps

  return {
    /**
     * Registra una respuesta (BR-03, BR-04, BR-08): guarda el evento y recalcula contador y estado en la misma
     * transacción, sin esperar a la red.
     */
    async record(deckId: string, wordId: string, hit: boolean): Promise<DeckWord> {
      return writeTx(deps, async () => {
        const entry = await db.deckWords.get([deckId, wordId])
        if (!entry) throw new RepoError('not-found')
        const next: DeckWord = { ...entry, ...applyAnswer(entry, hit) }
        const counter = ((await db.meta.get(ORDER_KEY))?.value as number | undefined) ?? 0
        const localOrder = counter + 1
        await db.meta.put({ key: ORDER_KEY, value: localOrder })
        const eventId = deps.newId()
        const recordedAtClient = deps.now()
        await db.deckWords.put(next)
        await db.progressEvents.add({
          id: eventId,
          deckId,
          wordId,
          hit,
          localOrder,
          recordedAtClient,
        })
        await enqueue(deps, {
          type: 'progress.record',
          payload: { eventId, deckId, wordId, hit, localOrder, recordedAtClient },
        })
        return next
      })
    },

    /** BR-09: reactivar deja la palabra pendiente con el contador en 0, solo en ese mazo. */
    async reactivate(deckId: string, wordId: string): Promise<DeckWord> {
      return writeTx(deps, async () => {
        const entry = await db.deckWords.get([deckId, wordId])
        if (!entry) throw new RepoError('not-found')
        const next: DeckWord = { ...entry, ...reactivate() }
        await db.deckWords.put(next)
        await enqueue(deps, { type: 'progress.reactivate', payload: { deckId, wordId } })
        return next
      })
    },
  }
}

export type ProgressRepository = ReturnType<typeof createProgressRepository>
