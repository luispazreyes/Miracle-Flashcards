// Base local (IndexedDB vía Dexie). Una base por usuario autenticado: `miracle-flashcards-{userId}`
// (frontend-specs.md §4.4), para no mezclar cuentas en el mismo dispositivo.
// Regla de migración: cada cambio de esquema añade una versión con `upgrade()`; nunca se edita una publicada.
import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Deck, DeckWord, OutboxOp, Preference, ProgressEvent, Word } from '../../domain'

export interface MetaEntry {
  key: string
  value: unknown
}

export class AppDb extends Dexie {
  words!: EntityTable<Word, 'id'>
  decks!: EntityTable<Deck, 'id'>
  deckWords!: Table<DeckWord, [string, string]>
  progressEvents!: EntityTable<ProgressEvent, 'id'>
  outbox!: EntityTable<OutboxOp, 'seq'>
  preferences!: EntityTable<Preference, 'userId'>
  meta!: EntityTable<MetaEntry, 'key'>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      words: 'id, userId, normalizedEnglish',
      decks: 'id, userId, normalizedName',
      deckWords: '[deckId+wordId], deckId, wordId, [deckId+status]',
      progressEvents: 'id, [deckId+wordId], localOrder',
      outbox: '++seq, opId, status, type',
      preferences: 'userId',
      meta: 'key',
    })
  }
}

export const dbName = (userId: string) => `miracle-flashcards-${userId}`

/** Abre la base del usuario. Sin `userId` no se abre nada (evita escribir datos sin cuenta). */
export function openDb(userId: string): AppDb {
  if (!userId || !userId.trim()) throw new Error('No se puede abrir la base local sin usuario.')
  return new AppDb(dbName(userId))
}

/** Borra la base local de una cuenta (cierre de sesión confirmado, RF-41). */
export async function deleteDb(userId: string): Promise<void> {
  await Dexie.delete(dbName(userId))
}
