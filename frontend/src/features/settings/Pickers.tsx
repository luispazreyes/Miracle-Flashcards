// Selectores de apariencia (F-08): tema (RF-10), paletas de fondo y de tarjeta (RF-11) y lado de la imagen
// (RF-12). Solo presets predefinidos: no hay color libre (BR-37). Cada muestra usa los atributos del preset, así
// se pinta con los tokens reales sin duplicar colores.
import { RadioCards } from '../../components/RadioCards'
import {
  IMAGE_SIDES,
  IMAGE_SIDE_LABELS,
  PALETTES,
  PALETTE_LABELS,
  THEMES,
  THEME_LABELS,
  type ImageSide,
  type Palette,
  type Theme,
} from '../../domain'
import { settings as t } from '../../lib/messages.es'

const swatch =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-sm border-2 border-borde text-sm font-semibold'

export function ThemePicker({ value, onChange }: { value: Theme; onChange: (v: Theme) => void }) {
  return (
    <RadioCards
      legend={t.theme}
      name="theme"
      value={value}
      onChange={onChange}
      options={THEMES.map((v) => ({
        value: v,
        label: THEME_LABELS[v],
        preview: (
          <span aria-hidden="true" data-theme={v} className={`${swatch} bg-fondo text-texto`}>
            Aa
          </span>
        ),
      }))}
    />
  )
}

export function PalettePicker({
  kind,
  value,
  onChange,
}: {
  kind: 'background' | 'card'
  value: Palette
  onChange: (v: Palette) => void
}) {
  return (
    <RadioCards
      legend={kind === 'background' ? t.backgroundPalette : t.cardPalette}
      name={`${kind}-palette`}
      value={value}
      onChange={onChange}
      options={PALETTES.map((v) => ({
        value: v,
        label: PALETTE_LABELS[v],
        preview:
          kind === 'background' ? (
            <span
              aria-hidden="true"
              // "Neutro" no define atributo: muestra el fondo del tema vigente.
              data-background-palette={v === 'neutral' ? undefined : v}
              className={`${swatch} bg-fondo text-texto`}
            >
              Aa
            </span>
          ) : (
            <span
              aria-hidden="true"
              data-card-palette={v}
              className={`${swatch} bg-tarjeta text-sobre-tarjeta`}
            >
              Aa
            </span>
          ),
      }))}
    />
  )
}

export function ImageSidePicker({
  value,
  onChange,
}: {
  value: ImageSide
  onChange: (v: ImageSide) => void
}) {
  return (
    <RadioCards
      legend={t.imageSide}
      help={t.imageSideHelp}
      name="image-side"
      value={value}
      onChange={onChange}
      options={IMAGE_SIDES.map((v) => ({ value: v, label: IMAGE_SIDE_LABELS[v] }))}
    />
  )
}
