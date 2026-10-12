// Contadores de progreso por mazo (BR-38, RF-26, RF-30).
import type { DeckWord } from './schemas'

export interface Counters {
  pending: number
  learned: number
  total: number
  /** 0–100, redondeado. Sin palabras → 0. */
  percent: number
}

export function counters(deckWords: readonly Pick<DeckWord, 'status'>[]): Counters {
  const learned = deckWords.filter((d) => d.status === 'learned').length
  const total = deckWords.length
  return {
    pending: total - learned,
    learned,
    total,
    percent: total === 0 ? 0 : Math.round((learned / total) * 100),
  }
}
