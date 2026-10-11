import type { ComponentProps } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro' | 'texto'

const estilos: Record<Variante, string> = {
  primario: 'bg-primario text-sobre-primario border-transparent hover:opacity-90',
  secundario: 'bg-transparent text-texto border-borde hover:bg-superficie',
  peligro: 'bg-error text-fondo border-transparent hover:opacity-90',
  texto: 'bg-transparent text-primario border-transparent underline hover:bg-superficie',
}

interface Props extends ComponentProps<'button'> {
  variante?: Variante
  cargando?: boolean
}

export function Button({ variante = 'primario', cargando = false, className = '', children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled}
      aria-busy={cargando || undefined}
      className={`objetivo-min inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${estilos[variante]} ${className}`}
    >
      {cargando && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-pill border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
}
