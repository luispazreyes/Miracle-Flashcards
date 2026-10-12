import type { ComponentProps } from 'react'
import { Icon, type IconName } from './Icon'

interface Props extends Omit<ComponentProps<'button'>, 'children' | 'aria-label'> {
  icon: IconName
  /** Obligatoria: el botón no tiene texto visible. */
  label: string
}

export function IconButton({ icon, label, className = '', type = 'button', ...rest }: Props) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      className={`inline-flex objetivo-min items-center justify-center rounded-md border border-transparent text-texto hover:bg-superficie disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <Icon name={icon} />
    </button>
  )
}
