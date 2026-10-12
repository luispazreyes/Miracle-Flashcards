// Aplica en local el estado definitivo devuelto por el servidor (RF-29, BR-42): sustituye lo local, elimina
// lo borrado en otro dispositivo (el borrado prevalece) y avisa de esas eliminaciones (EC-41).
import type { OutboxOp } from '../../domain'
import type { AppDb } from '../db/db'
import type { Changes } from '../remote/contract'
import { deleteEventsForPair } from '../repositories/events'

export type SyncNotice =
  | { kind: 'remote-deleted'; entity: 'word' | 'deck'; name: string }
  | { kind: 'image-removed'; name: string }

const pairKey = (deckId: string, wordId: string) => `pair:${deckId}:${wordId}`

/**
 * Entidades con operaciones locales todavía sin confirmar. Su estado local manda hasta que el servidor las
 * procese: sobrescribirlas con una foto anterior perdería ediciones hechas durante la sincronización.
 */
export function touchedKeys(ops: readonly OutboxOp[]): Set<string> {
  const keys = new Set<string>()
  for (const o of ops) {
    switch (o.type) {
      case 'word.create':
      case 'word.update':
      case 'word.delete':
        keys.add(`word:${o.payload.id}`)
        break
      case 'image.verify':
        keys.add(`word:${o.payload.wordId}`)
        break
      case 'deck.create':
      case 'deck.rename':
      case 'deck.delete':
        keys.add(`deck:${o.payload.id}`)
        break
      case 'deckWord.add':
      case 'deckWord.remove':
      case 'progress.record':
      case 'progress.reactivate':
        keys.add(pairKey(o.payload.deckId, o.payload.wordId))
        break
      case 'preference.update':
        keys.add('preference')
        break
    }
  }
  return keys
}

/**
 * Las entidades con operaciones pendientes se leen DENTRO de la transacción: así una escritura local hecha
 * mientras llegaba la respuesta (p. ej. borrar) no se pisa con una foto anterior del servidor.
 */
export async function applyChanges(db: AppDb, changes: Changes): Promise<SyncNotice[]> {
  const notices: SyncNotice[] = []

  await db.transaction('rw', db.tables, async () => {
    const pending = touchedKeys(await db.outbox.toArray())

    // Eliminaciones primero: el borrado prevalece.
    for (const id of changes.deleted.words) {
      if (pending.has(`word:${id}`)) continue
      const word = await db.words.get(id)
      if (!word) continue
      for (const m of await db.deckWords.where('wordId').equals(id).toArray())
        await deleteEventsForPair(db, m.deckId, id)
      await db.deckWords.where('wordId').equals(id).delete()
      await db.words.delete(id)
      notices.push({ kind: 'remote-deleted', entity: 'word', name: word.english })
    }
    for (const id of changes.deleted.decks) {
      if (pending.has(`deck:${id}`)) continue
      const deck = await db.decks.get(id)
      if (!deck) continue
      for (const m of await db.deckWords.where('deckId').equals(id).toArray())
        await deleteEventsForPair(db, id, m.wordId)
      await db.deckWords.where('deckId').equals(id).delete()
      await db.decks.delete(id)
      notices.push({ kind: 'remote-deleted', entity: 'deck', name: deck.name })
    }
    for (const { deckId, wordId } of changes.deleted.deckWords) {
      if (pending.has(pairKey(deckId, wordId))) continue
      await deleteEventsForPair(db, deckId, wordId)
      await db.deckWords.delete([deckId, wordId])
    }

    // Estado definitivo: mazos y palabras antes que las pertenencias.
    for (const deck of changes.decks) if (!pending.has(`deck:${deck.id}`)) await db.decks.put(deck)
    for (const word of changes.words) if (!pending.has(`word:${word.id}`)) await db.words.put(word)
    for (const dw of changes.deckWords) {
      if (pending.has(pairKey(dw.deckId, dw.wordId))) continue
      const [deck, word] = await Promise.all([db.decks.get(dw.deckId), db.words.get(dw.wordId)])
      if (deck && word) await db.deckWords.put(dw)
    }
    if (changes.preference && !pending.has('preference'))
      await db.preferences.put(changes.preference)
  })

  return notices
}
