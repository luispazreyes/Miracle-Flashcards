// Valores permitidos de apariencia (RF-10, RF-11, RF-12). Sin color libre: solo presets predefinidos.
// Los colores viven únicamente en styles/tokens.css; aquí solo identificadores y nombres de UI.

export const THEMES = ['white', 'blue', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export const PALETTES = ['neutral', 'mint', 'sand', 'lavender', 'graphite'] as const
export type Palette = (typeof PALETTES)[number]

export const IMAGE_SIDES = ['front', 'back', 'both'] as const
export type ImageSide = (typeof IMAGE_SIDES)[number]

/** Valor inicial del lado de la imagen (RF-12, R45 / P-F1). */
export const DEFAULT_IMAGE_SIDE: ImageSide = 'back'

export const THEME_LABELS: Record<Theme, string> = {
  white: 'Blanco',
  blue: 'Azul',
  dark: 'Oscuro',
}

export const PALETTE_LABELS: Record<Palette, string> = {
  neutral: 'Neutro',
  mint: 'Menta',
  sand: 'Arena',
  lavender: 'Lavanda',
  graphite: 'Grafito',
}

export const IMAGE_SIDE_LABELS: Record<ImageSide, string> = {
  front: 'Frente',
  back: 'Reverso',
  both: 'Ambos',
}

export const isTheme = (v: unknown): v is Theme => THEMES.includes(v as Theme)
export const isPalette = (v: unknown): v is Palette => PALETTES.includes(v as Palette)

/** Tema inicial cuando no hay preferencia guardada: sigue al sistema (RF-42); Azul solo si lo elige el usuario. */
export const themeFromSystem = (prefersDark: boolean): Theme => (prefersDark ? 'dark' : 'white')
