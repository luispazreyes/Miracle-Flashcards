// Grupo de opciones excluyentes (tema, paletas, lado de la imagen): fieldset + radios nativos, con nombre y
// vista previa; el estado elegido se ve por el radio marcado y el borde, no solo por color (WCAG 1.4.1).
import type { ReactNode } from 'react'

export interface RadioOption<T extends string> {
  value: T
  label: string
  /** Muestra visual de la opción (no debe ser lo único que la identifique). */
  preview?: ReactNode
}

interface Props<T extends string> {
  legend: string
  name: string
  options: readonly RadioOption<T>[]
  value: T
  onChange: (value: T) => void
  help?: string
}

export function RadioCards<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  help,
}: Props<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-semibold">{legend}</legend>
      {help && <p className="text-sm text-texto-suave">{help}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex objetivo-min cursor-pointer items-center gap-3 rounded-md border-2 border-borde bg-superficie px-3 py-2 transition-colors hover:bg-fondo has-checked:border-primario"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="size-5 accent-primario"
            />
            {o.preview}
            <span className="font-semibold">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
