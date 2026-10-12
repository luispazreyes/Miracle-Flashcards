// Aplicación de la apariencia al documento (RF-10, RF-11, RF-42).
// El script inline de index.html hace lo mismo ANTES del primer pintado; esta es la versión de la app.
import { isPalette, isTheme, themeFromSystem, type Palette, type Theme } from '../domain/appearance'
import { durationMs } from './motion'

export interface Appearance {
  theme: Theme
  backgroundPalette: Palette
  cardPalette: Palette
}

/** Clave del espejo local de las preferencias; la lee el script de index.html (RF-42). */
export const PREFS_MIRROR_KEY = 'mf:prefs'

const prefersDark = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

/** Apariencia por defecto: tema del sistema y presets neutros (RF-42). */
export function defaultAppearance(): Appearance {
  return {
    theme: themeFromSystem(prefersDark()),
    backgroundPalette: 'neutral',
    cardPalette: 'neutral',
  }
}

export function readStoredAppearance(): Appearance {
  const base = defaultAppearance()
  try {
    const raw = JSON.parse(
      localStorage.getItem(PREFS_MIRROR_KEY) ?? 'null',
    ) as Partial<Appearance> | null
    return {
      theme: isTheme(raw?.theme) ? raw.theme : base.theme,
      backgroundPalette: isPalette(raw?.backgroundPalette) ? raw.backgroundPalette : 'neutral',
      cardPalette: isPalette(raw?.cardPalette) ? raw.cardPalette : 'neutral',
    }
  } catch {
    return base
  }
}

export function storeAppearance(a: Appearance): void {
  try {
    localStorage.setItem(PREFS_MIRROR_KEY, JSON.stringify(a))
  } catch {
    // Sin almacenamiento: la preferencia sigue viva en memoria y en Dexie.
  }
}

/**
 * Pone los atributos de tema y presets en <html>. Con `animate` añade `.cambiando-tema` solo durante
 * la transición de colores (RF-44); con movimiento reducido la duración es 0 y no se añade.
 */
export function applyAppearance(a: Appearance, { animate = false } = {}): void {
  const root = document.documentElement
  const ms = animate ? durationMs('--mov-medio') : 0
  if (ms > 0) {
    root.classList.add('cambiando-tema')
    setTimeout(() => root.classList.remove('cambiando-tema'), ms)
  }
  root.dataset.theme = a.theme
  if (a.backgroundPalette === 'neutral') delete root.dataset.backgroundPalette
  else root.dataset.backgroundPalette = a.backgroundPalette
  root.dataset.cardPalette = a.cardPalette
}
