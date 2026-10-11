// Presets de paleta (RF-11) — docs/prototype-spec.md §A.2. Sin color libre.
// Cada preset de fondo es un conjunto coherente de tokens de página que ya cumple AA (ver tokens.test.ts);
// cada preset de tarjeta es un par {fondo, texto}. Presets nuevos: registrarlos primero en la spec.

export type PresetFondo = 'neutro' | 'menta' | 'arena' | 'lavanda' | 'grafito'
export type PresetTarjeta = PresetFondo

export const NOMBRES_PRESET: Record<PresetFondo, string> = {
  neutro: 'Neutro',
  menta: 'Menta',
  arena: 'Arena',
  lavanda: 'Lavanda',
  grafito: 'Grafito',
}

const CLARO = {
  '--color-superficie': '#ffffff',
  '--color-texto': '#111827',
  '--color-texto-suave': '#4b5563',
  '--color-primario': '#1d4ed8',
  '--color-sobre-primario': '#ffffff',
  '--color-borde': '#6b7280',
  '--color-error': '#b91c1c',
  '--color-exito': '#166534',
  '--color-aviso': '#92400e',
  '--color-foco': '#1d4ed8',
  '--color-grupo-mazo': '#dbeafe',
  '--color-grupo-otros': '#fef3c7',
  '--color-grupo-sin': '#ede9fe',
}

const OSCURO = {
  '--color-superficie': '#111827',
  '--color-texto': '#e5e7eb',
  '--color-texto-suave': '#a8b3c5',
  '--color-primario': '#93c5fd',
  '--color-sobre-primario': '#0f172a',
  '--color-borde': '#8190a8',
  '--color-error': '#fca5a5',
  '--color-exito': '#86efac',
  '--color-aviso': '#fcd34d',
  '--color-foco': '#93c5fd',
  '--color-grupo-mazo': '#1e3a8a',
  '--color-grupo-otros': '#6b2f0b',
  '--color-grupo-sin': '#4c1d95',
}

/** `null` = neutro: se usan los tokens del tema elegido. */
export const FONDOS: Record<PresetFondo, Record<string, string> | null> = {
  neutro: null,
  menta: { ...CLARO, '--color-fondo': '#e6f4ea' },
  arena: { ...CLARO, '--color-fondo': '#fbf3e4' },
  lavanda: { ...CLARO, '--color-fondo': '#efeafb' },
  grafito: { ...OSCURO, '--color-fondo': '#1f2937' },
}

export const TARJETAS: Record<PresetTarjeta, { fondo: string; texto: string }> = {
  neutro: { fondo: '#ffffff', texto: '#111827' },
  menta: { fondo: '#f0fdf4', texto: '#14532d' },
  arena: { fondo: '#fffbeb', texto: '#451a03' },
  lavanda: { fondo: '#f5f3ff', texto: '#2e1065' },
  grafito: { fondo: '#111827', texto: '#f9fafb' },
}

/** Muestra del preset de fondo para la vista previa (tema neutro: se resuelve en el componente). */
export const MUESTRA_FONDO: Record<Exclude<PresetFondo, 'neutro'>, string> = {
  menta: '#e6f4ea',
  arena: '#fbf3e4',
  lavanda: '#efeafb',
  grafito: '#1f2937',
}
