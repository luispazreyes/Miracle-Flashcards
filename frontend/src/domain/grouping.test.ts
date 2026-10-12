import { groupWords } from './grouping'
import { duplicateInDeck, englishExists } from './duplicates'
import { filterDecks, filterWords } from './search'
import { counters } from './progress'

const w = (id: string, english: string, spanish = id) => ({
  id,
  english,
  spanish,
  normalizedEnglish: english.toLowerCase(),
})
const words = [
  w('1', 'Apple', 'manzana'),
  w('2', 'Bread', 'pan'),
  w('3', 'Cat', 'gato'),
  w('4', 'Dog', 'perro'),
]
const decks = new Map<string, Set<string>>([
  ['1', new Set(['A'])], // en A
  ['2', new Set(['A', 'B'])], // en A y B
  ['3', new Set(['B'])], // solo en B
  // 4 sin mazo
])

describe('groupWords (BR-22, BR-23)', () => {
  it('con mazo seleccionado: este mazo, otros mazos, sin mazo, en ese orden (EC-24)', () => {
    const g = groupWords(words, decks, 'A')
    expect(g.map((x) => x.kind)).toEqual(['deck', 'others', 'none'])
    expect(g[0].words.map((x) => x.id)).toEqual(['1', '2'])
    expect(g[1].words.map((x) => x.id)).toEqual(['3'])
    expect(g[2].words.map((x) => x.id)).toEqual(['4'])
  })
  it('una palabra en el mazo y en otros va solo en el primer grupo (EC-25)', () => {
    const g = groupWords(words, decks, 'A')
    expect(g.flatMap((x) => x.words).filter((x) => x.id === '2')).toHaveLength(1)
  })
  it('los grupos vacíos no se muestran', () => {
    const g = groupWords([words[0]], decks, 'A')
    expect(g.map((x) => x.kind)).toEqual(['deck'])
  })
  it('sin mazo seleccionado: lista única con las sin mazo al final (EC-26)', () => {
    const g = groupWords([words[3], ...words.slice(0, 3)], decks, null)
    expect(g).toHaveLength(1)
    expect(g[0].kind).toBe('all')
    expect(g[0].words.map((x) => x.id)).toEqual(['1', '2', '3', '4'])
  })
  it('sin palabras no hay grupos', () => {
    expect(groupWords([], decks, 'A')).toEqual([])
    expect(groupWords([], decks, null)).toEqual([])
  })
})

describe('search (BR-25, BR-26, EC-51, EC-52)', () => {
  it('busca por subcadena en inglés o español, sin mayúsculas ni acentos', () => {
    const list = [w('1', 'Cafe', 'café'), w('2', 'Tea', 'té')]
    expect(filterWords(list, 'CAF').map((x) => x.id)).toEqual(['1'])
    expect(filterWords(list, 'te').map((x) => x.id)).toEqual(['2'])
    expect(filterWords(list, '  tÉ ').map((x) => x.id)).toEqual(['2'])
  })
  it('texto vacío restaura todo', () => {
    expect(filterWords(words, '   ')).toHaveLength(4)
  })
  it('sin coincidencias devuelve vacío', () => {
    expect(filterWords(words, 'zzz')).toEqual([])
  })
  it('filtra mazos por nombre sin acentos (EC-19)', () => {
    expect(filterDecks([{ name: 'Verbos Básicos' }, { name: 'Comida' }], 'basi')).toEqual([
      { name: 'Verbos Básicos' },
    ])
  })
})

describe('duplicados (BR-12, BR-13)', () => {
  it('BR-12: detecta el mismo inglés al crear (EC-45)', () => {
    expect(englishExists(words, 'apple')).toBe(true)
    expect(englishExists(words, 'pear')).toBe(false)
  })
  it('BR-12: al editar no se compara consigo misma', () => {
    expect(englishExists(words, 'apple', '1')).toBe(false)
  })
  it('BR-13: detecta el término ya presente en el mazo (EC-17, EC-44)', () => {
    expect(duplicateInDeck(['apple', 'bread'], 'apple')).toBe(true)
    expect(duplicateInDeck(['apple'], 'cat')).toBe(false)
  })
})

describe('counters (BR-38, EC-47)', () => {
  it('cuenta pendientes, aprendidas y porcentaje', () => {
    expect(
      counters([
        { status: 'learned' },
        { status: 'pending' },
        { status: 'pending' },
        { status: 'learned' },
      ]),
    ).toEqual({ pending: 2, learned: 2, total: 4, percent: 50 })
  })
  it('sin palabras: todo en cero', () => {
    expect(counters([])).toEqual({ pending: 0, learned: 0, total: 0, percent: 0 })
  })
})
