// Contraste WCAG 2.1 de todos los temas y presets (design-tokens.md §8, prototype-spec §B.1).
// Lee los colores directamente de tokens.css (única fuente).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PALETTES, THEMES } from '../domain/appearance'

const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

type Vars = Record<string, string>

/** Reglas simples `selectores { --color-x: #rrggbb }` (sin anidar). */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selectors: m[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(',')
    .map((s) => s.trim()),
  vars: Object.fromEntries(
    [...m[2].matchAll(/(--color-[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((v) => [
      v[1],
      v[2].toLowerCase(),
    ]),
  ) as Vars,
}))

function varsFor(selector: string): Vars {
  return Object.assign(
    {},
    ...rules.filter((r) => r.selectors.includes(selector)).map((r) => r.vars),
  )
}

const base = varsFor('@theme static')

const SETS: Record<string, Vars> = {}
for (const t of THEMES)
  SETS[`tema ${t}`] = t === 'white' ? base : { ...base, ...varsFor(`[data-theme='${t}']`) }
for (const p of PALETTES) {
  if (p !== 'neutral')
    SETS[`preset de fondo ${p}`] = { ...base, ...varsFor(`[data-background-palette='${p}']`) }
}

function luminance(hex: string) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
function ratio(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

describe('el CSS define lo esperado', () => {
  it('[data-theme=white] repite exactamente la base (solo sirve para las muestras de ajustes)', () => {
    const white = varsFor("[data-theme='white']")
    expect(Object.keys(white).length).toBeGreaterThan(10)
    for (const [k, v] of Object.entries(white)) expect(base[k], k).toBe(v)
  })

  it('hay un tema base y un bloque por tema y por preset', () => {
    expect(Object.keys(base).length).toBeGreaterThan(10)
    for (const t of ['blue', 'dark'])
      expect(Object.keys(varsFor(`[data-theme='${t}']`)).length).toBeGreaterThan(5)
    for (const p of PALETTES.filter((x) => x !== 'neutral')) {
      expect(Object.keys(varsFor(`[data-background-palette='${p}']`)), p).toContain('--color-fondo')
    }
    for (const p of PALETTES) {
      expect(Object.keys(varsFor(`[data-card-palette='${p}']`)), p).toEqual([
        '--color-tarjeta',
        '--color-sobre-tarjeta',
      ])
    }
  })
})

describe.each(Object.entries(SETS))('contraste: %s', (_name, t) => {
  const get = (k: string) => t[`--color-${k}`]
  const backgrounds = ['fondo', 'superficie']

  it.each(backgrounds)('texto principal y suave sobre %s ≥ 4.5', (f) => {
    expect(ratio(get('texto'), get(f))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(get('texto-suave'), get(f))).toBeGreaterThanOrEqual(4.5)
  })
  it.each(backgrounds)('primario, error, éxito y aviso (texto) sobre %s ≥ 4.5', (f) => {
    for (const k of ['primario', 'error', 'exito', 'aviso']) {
      expect(ratio(get(k), get(f)), `${k} sobre ${f}`).toBeGreaterThanOrEqual(4.5)
    }
  })
  it.each(backgrounds)('borde y foco sobre %s ≥ 3 (UI)', (f) => {
    expect(ratio(get('borde'), get(f))).toBeGreaterThanOrEqual(3)
    expect(ratio(get('foco'), get(f))).toBeGreaterThanOrEqual(3)
  })
  it('texto sobre primario ≥ 4.5', () => {
    expect(ratio(get('sobre-primario'), get('primario'))).toBeGreaterThanOrEqual(4.5)
  })
  it('texto sobre los fondos de grupo ≥ 4.5 (texto y texto suave)', () => {
    for (const g of ['grupo-mazo', 'grupo-otros', 'grupo-sin']) {
      expect(ratio(get('texto'), get(g)), g).toBeGreaterThanOrEqual(4.5)
      expect(ratio(get('texto-suave'), get(g)), `suave sobre ${g}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('presets de tarjeta', () => {
  it.each(PALETTES)('%s: texto sobre fondo ≥ 4.5', (p) => {
    const v = varsFor(`[data-card-palette='${p}']`)
    expect(ratio(v['--color-sobre-tarjeta'], v['--color-tarjeta'])).toBeGreaterThanOrEqual(4.5)
  })
})

describe('presets de fondo', () => {
  it.each(PALETTES.filter((p) => p !== 'neutral'))(
    '%s: la tarjeta se separa del fondo por borde (3:1)',
    (p) => {
      const v = SETS[`preset de fondo ${p}`]
      expect(ratio(v['--color-borde'], v['--color-fondo'])).toBeGreaterThanOrEqual(3)
    },
  )
})

describe('reglas de CSS', () => {
  it('los presets y temas se declaran después de la base y el bloque de movimiento reducido es el último', () => {
    const iPreset = css.indexOf("[data-background-palette='mint']")
    expect(css.indexOf("[data-theme='dark']")).toBeLessThan(iPreset)
    expect(css.lastIndexOf('@media (prefers-reduced-motion: reduce)')).toBeGreaterThan(
      css.indexOf("[data-card-palette='graphite']"),
    )
  })

  it('con movimiento reducido todas las duraciones valen 0.01ms y desplazamiento 0, escalas 1', () => {
    const block = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'))
    for (const d of ['rapido', 'medio', 'volteo', 'deposito']) {
      expect(block).toContain(`--mov-${d}: 0.01ms`)
    }
    expect(block).toContain('--mov-distancia: 0rem')
    expect(block).toContain('--mov-escala-entrada: 1')
    expect(block).toContain('--mov-escala-elevada: 1')
  })

  it('ningún --text-* comparte sufijo con un --color-* (Tailwind lo resolvería como color)', () => {
    const colors = new Set([...css.matchAll(/--color-([\w-]+):/g)].map((m) => m[1]))
    const sizes = [...css.matchAll(/--text-([\w-]+):/g)].map((m) => m[1])
    expect(sizes.filter((s) => colors.has(s))).toEqual([])
  })
})
