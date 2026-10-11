// §A.1/A.2 + §B.1: contraste WCAG 2.1 de todos los temas y presets (CI antes de publicar presets).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FONDOS, TARJETAS } from './presets'

const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

function variables(bloque: string): Record<string, string> {
  const r: Record<string, string> = {}
  for (const m of bloque.matchAll(/(--color-[\w-]+):\s*(#[0-9a-f]{6})/gi)) r[m[1]] = m[2].toLowerCase()
  return r
}
const bloque = (inicio: string) => {
  const i = css.indexOf(inicio)
  return css.slice(i, css.indexOf('\n}', i))
}

const blanco = variables(bloque('@theme static'))
const TEMAS: Record<string, Record<string, string>> = {
  blanco,
  azul: { ...blanco, ...variables(bloque("[data-tema='azul']")) },
  oscuro: { ...blanco, ...variables(bloque("[data-tema='oscuro']")) },
}
for (const [nombre, set] of Object.entries(FONDOS)) if (set) TEMAS[`preset ${nombre}`] = set

function luminancia(hex: string) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
function ratio(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

describe.each(Object.entries(TEMAS))('contraste: %s', (_nombre, t) => {
  const get = (k: string) => t[`--color-${k}`]
  const fondos = ['fondo', 'superficie']

  it.each(fondos)('texto principal y suave sobre %s ≥ 4.5', (f) => {
    expect(ratio(get('texto'), get(f))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(get('texto-suave'), get(f))).toBeGreaterThanOrEqual(4.5)
  })
  it.each(fondos)('primario, error, éxito y aviso (texto) sobre %s ≥ 4.5', (f) => {
    for (const k of ['primario', 'error', 'exito', 'aviso']) {
      expect(ratio(get(k), get(f)), `${k} sobre ${f}`).toBeGreaterThanOrEqual(4.5)
    }
  })
  it.each(fondos)('borde y foco sobre %s ≥ 3 (UI)', (f) => {
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
  it.each(Object.entries(TARJETAS))('%s: texto sobre fondo ≥ 4.5', (_n, p) => {
    expect(ratio(p.texto, p.fondo)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('presets de fondo', () => {
  it.each(Object.entries(FONDOS).filter(([, v]) => v))('%s: tarjeta sobre el fondo se separa por borde (3:1)', (_n, set) => {
    expect(ratio(set!['--color-borde'], set!['--color-fondo'])).toBeGreaterThanOrEqual(3)
  })
})

describe('colisiones de nombres entre tokens', () => {
  // Tailwind resuelve `text-x` como color si existe --color-x; un --text-x con el mismo sufijo no se aplicaría.
  it('ningún --text-* comparte sufijo con un --color-*', () => {
    const colores = new Set([...css.matchAll(/--color-([\w-]+):/g)].map((m) => m[1]))
    const tamanos = [...css.matchAll(/--text-([\w-]+):/g)].map((m) => m[1])
    expect(tamanos.filter((t) => colores.has(t))).toEqual([])
  })
})
