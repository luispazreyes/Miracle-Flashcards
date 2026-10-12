// RF-42: la apariencia se aplica antes del primer pintado y sigue al sistema sin preferencia guardada.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PALETTES, THEMES } from '../domain/appearance'
import {
  applyAppearance,
  PREFS_MIRROR_KEY,
  readStoredAppearance,
  storeAppearance,
} from './appearance'

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1]

function mockSystem(dark: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: dark && q.includes('dark'),
  })) as typeof window.matchMedia
}
const runInlineScript = () => new Function(script)()
const root = document.documentElement

beforeEach(() => {
  localStorage.clear()
  delete root.dataset.theme
  delete root.dataset.backgroundPalette
  delete root.dataset.cardPalette
  root.classList.remove('cambiando-tema')
  mockSystem(false)
})

describe('script anti-parpadeo de index.html', () => {
  it('sin preferencia guardada sigue al sistema: claro → white, oscuro → dark (nunca blue)', () => {
    runInlineScript()
    expect(root.dataset.theme).toBe('white')
    expect(root.dataset.backgroundPalette).toBeUndefined()
    expect(root.dataset.cardPalette).toBe('neutral')
    mockSystem(true)
    runInlineScript()
    expect(root.dataset.theme).toBe('dark')
  })

  it('aplica la preferencia guardada', () => {
    storeAppearance({ theme: 'blue', backgroundPalette: 'mint', cardPalette: 'sand' })
    runInlineScript()
    expect(root.dataset.theme).toBe('blue')
    expect(root.dataset.backgroundPalette).toBe('mint')
    expect(root.dataset.cardPalette).toBe('sand')
  })

  it('ignora valores inválidos o un JSON corrupto', () => {
    localStorage.setItem(
      PREFS_MIRROR_KEY,
      '{"theme":"rojo","backgroundPalette":"x","cardPalette":"y"}',
    )
    runInlineScript()
    expect(root.dataset.theme).toBe('white')
    expect(root.dataset.backgroundPalette).toBeUndefined()
    localStorage.setItem(PREFS_MIRROR_KEY, '{no es json')
    expect(() => runInlineScript()).not.toThrow()
  })

  it('acepta exactamente los mismos temas y paletas que domain/appearance.ts', () => {
    expect(script).toContain(JSON.stringify(THEMES).replace(/"/g, "'").replace(/,/g, ', '))
    expect(script).toContain(JSON.stringify(PALETTES).replace(/"/g, "'").replace(/,/g, ', '))
  })

  it('funciona sin matchMedia ni localStorage', () => {
    // @ts-expect-error simulación de entorno sin matchMedia
    window.matchMedia = undefined
    expect(() => runInlineScript()).not.toThrow()
    expect(root.dataset.theme).toBe('white')
  })
})

describe('lib/appearance', () => {
  it('lee y guarda el espejo de preferencias', () => {
    const a = { theme: 'dark', backgroundPalette: 'graphite', cardPalette: 'lavender' } as const
    storeAppearance(a)
    expect(readStoredAppearance()).toEqual(a)
  })

  it('applyAppearance pone atributos; neutral quita el preset de fondo', () => {
    applyAppearance({ theme: 'blue', backgroundPalette: 'mint', cardPalette: 'mint' })
    expect(root.dataset.backgroundPalette).toBe('mint')
    applyAppearance({ theme: 'blue', backgroundPalette: 'neutral', cardPalette: 'neutral' })
    expect(root.dataset.backgroundPalette).toBeUndefined()
    expect(root.dataset.cardPalette).toBe('neutral')
  })

  it('con movimiento reducido (duración 0) no añade la clase de transición', () => {
    root.style.setProperty('--mov-medio', '0.01ms')
    applyAppearance(
      { theme: 'dark', backgroundPalette: 'neutral', cardPalette: 'neutral' },
      { animate: true },
    )
    expect(root.classList.contains('cambiando-tema')).toBe(false)
    root.style.removeProperty('--mov-medio')
  })

  it('con movimiento normal añade la clase durante la transición y luego la quita', () => {
    vi.useFakeTimers()
    root.style.setProperty('--mov-medio', '240ms')
    applyAppearance(
      { theme: 'dark', backgroundPalette: 'neutral', cardPalette: 'neutral' },
      { animate: true },
    )
    expect(root.classList.contains('cambiando-tema')).toBe(true)
    vi.advanceTimersByTime(250)
    expect(root.classList.contains('cambiando-tema')).toBe(false)
    root.style.removeProperty('--mov-medio')
    vi.useRealTimers()
  })
})
