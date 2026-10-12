// Operaciones de la cola de salida (frontend-specs.md §4.3). Son el contrato entre el cliente y el remoto:
// `data/remote/contract.ts` las reutiliza. Cada operación es idempotente por `opId` (RF-22, BR-40).
import { z } from 'zod'
import { imageSideSchema, paletteSchema, themeSchema } from './schemas'

const id = z.string().min(1)
const nullableText = z.string().nullable().optional()

/** Parche por campo de una palabra: solo los campos modificados (BR-16, RF-29). `null` = quitar el valor. */
export const wordPatchSchema = z.object({
  english: z.string().optional(),
  normalizedEnglish: z.string().optional(),
  spanish: z.string().optional(),
  imageUrl: nullableText,
  imageVerified: z.boolean().optional(),
  example: nullableText,
  note: nullableText,
})

export const preferencePatchSchema = z.object({
  theme: themeSchema.optional(),
  backgroundPalette: paletteSchema.optional(),
  cardPalette: paletteSchema.optional(),
  imageSide: imageSideSchema.optional(),
})

export const opBodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('word.create'),
    payload: z.object({
      id,
      english: z.string(),
      normalizedEnglish: z.string(),
      spanish: z.string(),
      imageUrl: z.string().optional(),
      imageVerified: z.boolean(),
      example: z.string().optional(),
      note: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('word.update'),
    payload: z.object({ id, patch: wordPatchSchema }),
  }),
  z.object({ type: z.literal('word.delete'), payload: z.object({ id }) }),
  z.object({
    type: z.literal('deck.create'),
    payload: z.object({ id, name: z.string(), normalizedName: z.string() }),
  }),
  z.object({
    type: z.literal('deck.rename'),
    payload: z.object({ id, name: z.string(), normalizedName: z.string() }),
  }),
  z.object({ type: z.literal('deck.delete'), payload: z.object({ id }) }),
  z.object({
    type: z.literal('deckWord.add'),
    payload: z.object({ deckId: id, wordId: id }),
  }),
  z.object({
    type: z.literal('deckWord.remove'),
    payload: z.object({ deckId: id, wordId: id }),
  }),
  z.object({
    type: z.literal('progress.record'),
    payload: z.object({
      eventId: id,
      deckId: id,
      wordId: id,
      hit: z.boolean(),
      localOrder: z.number().int().nonnegative(),
      recordedAtClient: z.number().int().nonnegative(),
    }),
  }),
  z.object({
    type: z.literal('progress.reactivate'),
    payload: z.object({ deckId: id, wordId: id }),
  }),
  z.object({
    type: z.literal('preference.update'),
    payload: z.object({ patch: preferencePatchSchema }),
  }),
  z.object({
    type: z.literal('image.verify'),
    payload: z.object({ wordId: id, imageUrl: z.string() }),
  }),
])

export type OpBody = z.infer<typeof opBodySchema>
export type OpType = OpBody['type']
export type WordPatch = z.infer<typeof wordPatchSchema>
export type PreferencePatch = z.infer<typeof preferencePatchSchema>

export type OpStatus = 'pending' | 'inflight' | 'failed'

/** Operación guardada en la tabla `outbox` (solo local). */
export type OutboxOp = OpBody & {
  /** Orden de envío (autonumérico de Dexie). */
  seq?: number
  /** Identificador de idempotencia (UUID). */
  opId: string
  createdAt: number
  attempts: number
  status: OpStatus
}
