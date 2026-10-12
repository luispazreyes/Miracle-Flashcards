import Dexie from 'dexie'
import type { AppDb } from '../db/db'

/** Elimina los eventos de progreso de un par mazo-palabra (BR-14, BR-15). */
export function deleteEventsForPair(db: AppDb, deckId: string, wordId: string) {
  return db.progressEvents.where('[deckId+wordId]').equals([deckId, wordId]).delete()
}

/** Elimina todos los eventos de un mazo (BR-20). */
export function deleteEventsForDeck(db: AppDb, deckId: string) {
  return db.progressEvents
    .where('[deckId+wordId]')
    .between([deckId, Dexie.minKey], [deckId, Dexie.maxKey])
    .delete()
}
