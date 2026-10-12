// Duplicados (BR-12, BR-13). "Mismo término" = igual `normalizedEnglish` (sin plegar acentos).

/** BR-12: al crear, ¿ya existe una palabra con ese inglés? (aviso no bloqueante). */
export function englishExists(
  words: readonly { id: string; normalizedEnglish: string }[],
  normalizedEnglish: string,
  excludeId?: string,
): boolean {
  return words.some((w) => w.id !== excludeId && w.normalizedEnglish === normalizedEnglish)
}

/** BR-13: ¿el mazo ya contiene una palabra con ese término? (bloqueante). */
export function duplicateInDeck(
  deckWordsNormalized: readonly string[],
  normalizedEnglish: string,
): boolean {
  return deckWordsNormalized.includes(normalizedEnglish)
}
