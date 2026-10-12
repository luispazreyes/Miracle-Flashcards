import { deckSchema, deckWordSchema, preferenceSchema, wordSchema } from './schemas'

const now = 1_700_000_000_000
const word = {
  id: 'w1',
  userId: 'u1',
  english: 'Hello',
  normalizedEnglish: 'hello',
  spanish: 'Hola',
  imageVerified: true,
  englishUpdatedAt: now,
  spanishUpdatedAt: now,
  imageUpdatedAt: now,
  exampleUpdatedAt: now,
  noteUpdatedAt: now,
}

describe('esquemas Zod', () => {
  it('acepta una palabra válida y exige inglés y español', () => {
    expect(wordSchema.safeParse(word).success).toBe(true)
    expect(wordSchema.safeParse({ ...word, english: '  ' }).success).toBe(false)
    expect(wordSchema.safeParse({ ...word, spanish: '' }).success).toBe(false)
  })
  it('imageUrl solo http(s) (RF-15)', () => {
    expect(wordSchema.safeParse({ ...word, imageUrl: 'https://x.invalid/a.png' }).success).toBe(
      true,
    )
    expect(wordSchema.safeParse({ ...word, imageUrl: 'javascript:alert(1)' }).success).toBe(false)
  })
  it('el nombre del mazo va de 1 a 60 caracteres', () => {
    const deck = { id: 'd', userId: 'u', name: 'Mazo', normalizedName: 'mazo', updatedAt: now }
    expect(deckSchema.safeParse(deck).success).toBe(true)
    expect(deckSchema.safeParse({ ...deck, name: 'a'.repeat(61) }).success).toBe(false)
  })
  it('el contador de DeckWord va de 0 a 3', () => {
    const dw = { deckId: 'd', wordId: 'w', consecutiveHits: 3, status: 'learned' }
    expect(deckWordSchema.safeParse(dw).success).toBe(true)
    expect(deckWordSchema.safeParse({ ...dw, consecutiveHits: 4 }).success).toBe(false)
  })
  it('las preferencias solo admiten presets (RF-11, BR-37)', () => {
    const pref = {
      userId: 'u',
      theme: 'blue',
      backgroundPalette: 'mint',
      cardPalette: 'neutral',
      imageSide: 'back',
      updatedAt: now,
    }
    expect(preferenceSchema.safeParse(pref).success).toBe(true)
    expect(preferenceSchema.safeParse({ ...pref, backgroundPalette: '#ff0000' }).success).toBe(
      false,
    )
  })
})
