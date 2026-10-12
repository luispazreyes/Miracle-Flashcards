import {
  englishExists,
  validateWordForm,
  type Word,
  type WordFormInput,
  type WordPatch,
} from '../../domain'
import { enqueue, RepoError, writeTx, type RepoDeps } from './context'
import { deleteEventsForPair } from './events'

export interface WordInput extends WordFormInput {
  /** `false` si la imagen no se pudo comprobar por falta de conexión (BR-17). Por defecto `true`. */
  imageVerified?: boolean
}

export function createWordRepository(deps: RepoDeps) {
  const { db } = deps

  return {
    list: () => db.words.toArray(),
    get: (id: string) => db.words.get(id),

    /**
     * Crea una palabra (BR-11). Devuelve además si ya existía otra con el mismo inglés (BR-12): aviso no
     * bloqueante, la palabra se crea igual.
     */
    async create(input: WordInput): Promise<{ word: Word; duplicateEnglish: boolean }> {
      const parsed = validateWordForm(input)
      if (!parsed.ok) throw new RepoError('invalid-word', { fields: parsed.error })
      const v = parsed.value
      const verified = v.imageUrl ? (input.imageVerified ?? true) : true
      return writeTx(deps, async () => {
        const now = deps.now()
        const duplicateEnglish = englishExists(await db.words.toArray(), v.normalizedEnglish)
        const word: Word = {
          id: deps.newId(),
          userId: deps.userId,
          english: v.english,
          normalizedEnglish: v.normalizedEnglish,
          spanish: v.spanish,
          imageUrl: v.imageUrl,
          imageVerified: verified,
          example: v.example,
          note: v.note,
          englishUpdatedAt: now,
          spanishUpdatedAt: now,
          imageUpdatedAt: now,
          exampleUpdatedAt: now,
          noteUpdatedAt: now,
        }
        await db.words.add(word)
        await enqueue(deps, {
          type: 'word.create',
          payload: {
            id: word.id,
            english: word.english,
            normalizedEnglish: word.normalizedEnglish,
            spanish: word.spanish,
            imageUrl: word.imageUrl,
            imageVerified: word.imageVerified,
            example: word.example,
            note: word.note,
          },
        })
        if (word.imageUrl && !word.imageVerified)
          await enqueue(deps, {
            type: 'image.verify',
            payload: { wordId: word.id, imageUrl: word.imageUrl },
          })
        return { word, duplicateEnglish }
      })
    },

    /** Edita una palabra; la operación lleva solo los campos que cambiaron (BR-16, RF-29). */
    async update(id: string, input: WordInput): Promise<Word> {
      const parsed = validateWordForm(input)
      if (!parsed.ok) throw new RepoError('invalid-word', { fields: parsed.error })
      const v = parsed.value
      return writeTx(deps, async () => {
        const current = await db.words.get(id)
        if (!current) throw new RepoError('not-found')
        const patch: WordPatch = {}
        const next: Word = { ...current }
        if (v.english !== current.english) {
          patch.english = v.english
          patch.normalizedEnglish = v.normalizedEnglish
          next.english = v.english
          next.normalizedEnglish = v.normalizedEnglish
        }
        if (v.spanish !== current.spanish) {
          patch.spanish = v.spanish
          next.spanish = v.spanish
        }
        const imageChanged = v.imageUrl !== current.imageUrl
        if (imageChanged) {
          patch.imageUrl = v.imageUrl ?? null
          next.imageUrl = v.imageUrl
          next.imageVerified = v.imageUrl ? (input.imageVerified ?? true) : true
          patch.imageVerified = next.imageVerified
        }
        if (v.example !== current.example) {
          patch.example = v.example ?? null
          next.example = v.example
        }
        if (v.note !== current.note) {
          patch.note = v.note ?? null
          next.note = v.note
        }
        if (Object.keys(patch).length === 0) return current
        await db.words.put(next)
        await enqueue(deps, { type: 'word.update', payload: { id, patch } })
        if (imageChanged && next.imageUrl && !next.imageVerified)
          await enqueue(deps, {
            type: 'image.verify',
            payload: { wordId: id, imageUrl: next.imageUrl },
          })
        return next
      })
    },

    /** BR-15: borrado definitivo de la palabra, sus pertenencias a mazos y sus eventos. */
    async delete(id: string): Promise<void> {
      await writeTx(deps, async () => {
        if (!(await db.words.get(id))) throw new RepoError('not-found')
        const memberships = await db.deckWords.where('wordId').equals(id).toArray()
        for (const m of memberships) await deleteEventsForPair(db, m.deckId, id)
        await db.deckWords.where('wordId').equals(id).delete()
        await db.words.delete(id)
        await enqueue(deps, { type: 'word.delete', payload: { id } })
      })
    },

    /**
     * Resultado de comprobar una imagen "sin verificar" al recuperar la conexión (BR-17): si carga, queda
     * verificada; si no, se retira del dato y se sincroniza el cambio.
     */
    async resolveImage(wordId: string, loads: boolean): Promise<void> {
      await writeTx(deps, async () => {
        const word = await db.words.get(wordId)
        if (!word || !word.imageUrl || word.imageVerified) return
        if (loads) {
          await db.words.update(wordId, { imageVerified: true })
          await enqueue(deps, {
            type: 'word.update',
            payload: { id: wordId, patch: { imageVerified: true } },
          })
        } else {
          await db.words.update(wordId, { imageUrl: undefined, imageVerified: true })
          await enqueue(deps, {
            type: 'word.update',
            payload: { id: wordId, patch: { imageUrl: null, imageVerified: true } },
          })
        }
      })
    },
  }
}

export type WordRepository = ReturnType<typeof createWordRepository>
