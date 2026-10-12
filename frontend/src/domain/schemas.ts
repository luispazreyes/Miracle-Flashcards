// Esquemas Zod de las entidades (frontend-specs.md §4.2, §4.5). Se validan en las fronteras: formularios y
// respuestas del remoto. Las marcas de tiempo son milisegundos desde epoch.
import { z } from 'zod'
import { DECK_NAME_MAX, LEARNED_THRESHOLD } from './constants'
import { IMAGE_SIDES, PALETTES, THEMES } from './appearance'

const id = z.string().min(1)
const timestamp = z.number().int().nonnegative()
const optionalText = z.string().optional()

/** Enlace http(s) (RF-15). */
export const httpUrlSchema = z.url({ protocol: /^https?$/ })
export const emailSchema = z.email()

export const themeSchema = z.enum(THEMES)
export const paletteSchema = z.enum(PALETTES)
export const imageSideSchema = z.enum(IMAGE_SIDES)
export const statusSchema = z.enum(['pending', 'learned'])

export const userSchema = z.object({ id, email: emailSchema, createdAt: timestamp })

export const preferenceSchema = z.object({
  userId: id,
  theme: themeSchema,
  backgroundPalette: paletteSchema,
  cardPalette: paletteSchema,
  imageSide: imageSideSchema,
  updatedAt: timestamp,
})

export const deckSchema = z.object({
  id,
  userId: id,
  name: z.string().trim().min(1).max(DECK_NAME_MAX),
  normalizedName: z.string().min(1),
  updatedAt: timestamp,
})

export const wordSchema = z.object({
  id,
  userId: id,
  english: z.string().trim().min(1),
  normalizedEnglish: z.string().min(1),
  spanish: z.string().trim().min(1),
  imageUrl: httpUrlSchema.optional(),
  imageVerified: z.boolean(),
  example: optionalText,
  note: optionalText,
  englishUpdatedAt: timestamp,
  spanishUpdatedAt: timestamp,
  imageUpdatedAt: timestamp,
  exampleUpdatedAt: timestamp,
  noteUpdatedAt: timestamp,
})

export const deckWordSchema = z.object({
  deckId: id,
  wordId: id,
  consecutiveHits: z.number().int().min(0).max(LEARNED_THRESHOLD),
  status: statusSchema,
})

export const progressEventSchema = z.object({
  id,
  deckId: id,
  wordId: id,
  hit: z.boolean(),
  localOrder: z.number().int().nonnegative(),
  recordedAtClient: timestamp,
  receivedAt: timestamp.optional(),
})

export type User = z.infer<typeof userSchema>
export type Preference = z.infer<typeof preferenceSchema>
export type Deck = z.infer<typeof deckSchema>
export type Word = z.infer<typeof wordSchema>
export type DeckWord = z.infer<typeof deckWordSchema>
export type ProgressEvent = z.infer<typeof progressEventSchema>
export type WordStatus = z.infer<typeof statusSchema>
/** Campos de la palabra que se editan por separado y llevan su propia marca (RF-29, BR-16). */
export const WORD_FIELDS = ['english', 'spanish', 'image', 'example', 'note'] as const
export type WordField = (typeof WORD_FIELDS)[number]
