// Búsqueda (BR-25, BR-26): subcadena sin mayúsculas ni acentos, recortando espacios del texto.
import { normalizeText } from './normalize'

export function matchesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const q = normalizeText(query)
  if (!q) return true
  return fields.some((f) => f !== undefined && normalizeText(f).includes(q))
}

/** BR-25: filtra palabras por inglés o español. */
export function filterWords<T extends { english: string; spanish: string }>(
  words: readonly T[],
  query: string,
): T[] {
  return words.filter((w) => matchesQuery(query, w.english, w.spanish))
}

/** BR-26: filtra mazos por nombre. */
export function filterDecks<T extends { name: string }>(decks: readonly T[], query: string): T[] {
  return decks.filter((d) => matchesQuery(query, d.name))
}
