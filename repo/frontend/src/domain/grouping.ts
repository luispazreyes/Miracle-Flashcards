// Grupos del panel de palabras (BR-22, BR-23, BR-24).
export type GroupKind = 'deck' | 'others' | 'none' | 'all'

export interface WordGroup<T> {
  kind: GroupKind
  words: T[]
}

const byEnglish = <T extends { normalizedEnglish: string }>(a: T, b: T) =>
  a.normalizedEnglish.localeCompare(b.normalizedEnglish, 'es')

/**
 * Con un mazo seleccionado (BR-22): 1º en este mazo, 2º solo en otros mazos, 3º sin mazo; una palabra que está
 * en el mazo y en otros va solo en el 1º; los grupos vacíos no aparecen.
 * Sin mazo seleccionado (BR-23): lista única con las palabras sin mazo al final.
 * `deckIdsByWord`: ids de los mazos de cada palabra.
 */
export function groupWords<T extends { id: string; normalizedEnglish: string }>(
  words: readonly T[],
  deckIdsByWord: ReadonlyMap<string, ReadonlySet<string>>,
  selectedDeckId: string | null,
): WordGroup<T>[] {
  const decksOf = (w: T) => deckIdsByWord.get(w.id)
  const sorted = [...words].sort(byEnglish)

  if (selectedDeckId === null) {
    const withDeck = sorted.filter((w) => (decksOf(w)?.size ?? 0) > 0)
    const without = sorted.filter((w) => (decksOf(w)?.size ?? 0) === 0)
    return words.length ? [{ kind: 'all', words: [...withDeck, ...without] }] : []
  }

  const inDeck: T[] = []
  const others: T[] = []
  const none: T[] = []
  for (const w of sorted) {
    const d = decksOf(w)
    if (d?.has(selectedDeckId)) inDeck.push(w)
    else if (d && d.size > 0) others.push(w)
    else none.push(w)
  }
  const groups: WordGroup<T>[] = [
    { kind: 'deck', words: inDeck },
    { kind: 'others', words: others },
    { kind: 'none', words: none },
  ]
  return groups.filter((g) => g.words.length > 0)
}
