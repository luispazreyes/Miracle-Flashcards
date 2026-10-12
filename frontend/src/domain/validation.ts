// Validaciones de formularios (BR-11, BR-19, BR-31). Devuelven códigos; el texto en español lo pone la UI
// (lib/messages.es.ts) para que domain no dependa de nada.
import { DECK_NAME_MAX } from './constants'
import { normalizeText, normalizeWord } from './normalize'
import { emailSchema, httpUrlSchema } from './schemas'

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

// --- Correo (BR-31) ---
export function validateEmail(raw: string): Result<string, 'invalid'> {
  const value = raw.trim()
  return emailSchema.safeParse(value).success
    ? { ok: true, value }
    : { ok: false, error: 'invalid' }
}

// --- Mazos (BR-19) ---
export type DeckNameError = 'empty' | 'too-long' | 'duplicate'

export function validateDeckName(
  raw: string,
  others: readonly { id: string; normalizedName: string }[],
  excludeId?: string,
): Result<{ name: string; normalizedName: string }, DeckNameError> {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (name.length === 0) return { ok: false, error: 'empty' }
  if (name.length > DECK_NAME_MAX) return { ok: false, error: 'too-long' }
  const normalizedName = normalizeText(name)
  if (others.some((d) => d.id !== excludeId && d.normalizedName === normalizedName))
    return { ok: false, error: 'duplicate' }
  return { ok: true, value: { name, normalizedName } }
}

// --- Palabras (BR-11, BR-17) ---
export interface WordFormInput {
  english: string
  spanish: string
  imageUrl?: string
  example?: string
  note?: string
}
export interface WordFormValue {
  english: string
  normalizedEnglish: string
  spanish: string
  imageUrl?: string
  example?: string
  note?: string
}
export type WordFormErrors = Partial<
  Record<'english' | 'spanish' | 'imageUrl', 'required' | 'not-http'>
>

const blankToUndefined = (s: string | undefined) => {
  const t = s?.trim()
  return t ? t : undefined
}

export function isHttpUrl(value: string): boolean {
  return httpUrlSchema.safeParse(value.trim()).success
}

export function validateWordForm(input: WordFormInput): Result<WordFormValue, WordFormErrors> {
  const english = input.english.trim().replace(/\s+/g, ' ')
  const spanish = input.spanish.trim().replace(/\s+/g, ' ')
  const imageUrl = blankToUndefined(input.imageUrl)
  const errors: WordFormErrors = {}
  if (!english) errors.english = 'required'
  if (!spanish) errors.spanish = 'required'
  if (imageUrl && !isHttpUrl(imageUrl)) errors.imageUrl = 'not-http'
  if (Object.keys(errors).length) return { ok: false, error: errors }
  return {
    ok: true,
    value: {
      english,
      normalizedEnglish: normalizeWord(english),
      spanish,
      imageUrl,
      example: blankToUndefined(input.example),
      note: blankToUndefined(input.note),
    },
  }
}
