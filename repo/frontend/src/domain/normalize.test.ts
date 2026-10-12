import { normalizeText, normalizeWord } from './normalize'

describe('normalizeWord (BR-12)', () => {
  it('recorta, colapsa espacios y pasa a minúsculas', () => {
    expect(normalizeWord('  Hello   WORLD ')).toBe('hello world')
  })
  it('NO pliega acentos: "café" y "cafe" son distintos', () => {
    expect(normalizeWord('Café')).toBe('café')
    expect(normalizeWord('café')).not.toBe(normalizeWord('cafe'))
  })
  it('equipara la forma compuesta y descompuesta del mismo carácter', () => {
    expect(normalizeWord('café')).toBe(normalizeWord('café'))
  })
})

describe('normalizeText (BR-19, BR-25, BR-26)', () => {
  it('ignora mayúsculas y acentos', () => {
    expect(normalizeText('  CAFÉ   Olé ')).toBe('cafe ole')
  })
  it('es idempotente', () => {
    const once = normalizeText('Árbol  Ñandú')
    expect(normalizeText(once)).toBe(once)
  })
})
