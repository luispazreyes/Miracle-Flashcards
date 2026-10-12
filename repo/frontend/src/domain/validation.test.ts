import { validateDeckName, validateEmail, validateWordForm } from './validation'

describe('validateEmail (BR-31, EC-01)', () => {
  it.each(['ana@example.com', '  ana@example.com  '])('acepta %j', (v) => {
    expect(validateEmail(v)).toEqual({ ok: true, value: 'ana@example.com' })
  })
  it.each(['', 'ana', 'ana@', '@example.com', 'ana@example'])('rechaza %j', (v) => {
    expect(validateEmail(v)).toEqual({ ok: false, error: 'invalid' })
  })
})

describe('validateDeckName (BR-19, EC-48)', () => {
  const others = [{ id: 'd1', normalizedName: 'cafe' }]
  it('recorta y guarda el nombre normalizado sin acentos', () => {
    expect(validateDeckName('  Café  ', [])).toEqual({
      ok: true,
      value: { name: 'Café', normalizedName: 'cafe' },
    })
  })
  it('vacío tras recortar', () => {
    expect(validateDeckName('   ', [])).toEqual({ ok: false, error: 'empty' })
  })
  it('más de 60 caracteres', () => {
    expect(validateDeckName('a'.repeat(61), [])).toEqual({ ok: false, error: 'too-long' })
    expect(validateDeckName('a'.repeat(60), []).ok).toBe(true)
  })
  it('duplicado ignorando mayúsculas y acentos', () => {
    expect(validateDeckName('CAFÉ', others)).toEqual({ ok: false, error: 'duplicate' })
  })
  it('renombrar al mismo nombre no es duplicado', () => {
    expect(validateDeckName('Café', others, 'd1').ok).toBe(true)
  })
})

describe('validateWordForm (BR-11, BR-17, EC-13)', () => {
  it('exige inglés y español', () => {
    const r = validateWordForm({ english: ' ', spanish: '' })
    expect(r).toEqual({ ok: false, error: { english: 'required', spanish: 'required' } })
  })
  it('imagen, ejemplo y nota son opcionales y los vacíos se descartan', () => {
    const r = validateWordForm({ english: 'Hello', spanish: 'Hola', imageUrl: ' ', example: '' })
    expect(r).toEqual({
      ok: true,
      value: {
        english: 'Hello',
        normalizedEnglish: 'hello',
        spanish: 'Hola',
        imageUrl: undefined,
        example: undefined,
        note: undefined,
      },
    })
  })
  it('solo acepta enlaces http(s) (EC-14)', () => {
    expect(
      validateWordForm({ english: 'a', spanish: 'b', imageUrl: 'ftp://x.invalid/a.png' }),
    ).toEqual({ ok: false, error: { imageUrl: 'not-http' } })
    expect(validateWordForm({ english: 'a', spanish: 'b', imageUrl: 'no es url' }).ok).toBe(false)
    expect(
      validateWordForm({ english: 'a', spanish: 'b', imageUrl: 'https://ejemplo.invalid/a.png' })
        .ok,
    ).toBe(true)
  })
})
