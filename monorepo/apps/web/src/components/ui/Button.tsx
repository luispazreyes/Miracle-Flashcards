import type { ComponentProps } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text'

const styles: Record<ButtonVariant, string> = {
  primary: 'bg-primario text-sobre-primario border-transparent hover:opacity-90',
  secondary: 'bg-transparent text-texto border-borde hover:bg-superficie',
  danger: 'bg-error text-fondo border-transparent hover:opacity-90',
  text: 'bg-transparent text-primario border-transparent underline hover:bg-superficie',
}

interface Props extends ComponentProps<'button'> {
  variant?: ButtonVariant
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
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex objetivo-min items-center justify-center gap-2 rounded-md border px-4 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
