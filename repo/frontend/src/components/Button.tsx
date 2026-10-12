import type { ComponentProps } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'text'

const styles: Record<Variant, string> = {
  primary: 'bg-primario text-sobre-primario border-transparent hover:opacity-90',
  secondary: 'bg-transparent text-texto border-borde hover:bg-superficie',
  danger: 'bg-error text-fondo border-transparent hover:opacity-90',
  text: 'bg-transparent text-primario border-transparent underline hover:bg-superficie',
}

interface Props extends ComponentProps<'button'> {
  variant?: Variant
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      className={`inline-flex objetivo-min items-center justify-center gap-2 rounded-md border px-4 py-2 text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:active:scale-100 ${styles[variant]} ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-pill border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
}
