import { useId, type InputHTMLAttributes, type Ref } from 'react'
import { Icon } from './Icon'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  help?: string
  error?: string
  inputRef?: Ref<HTMLInputElement>
  /** Contador visible, p. ej. "12/60" (WCAG 3.3: el límite se informa antes del error). */
  counter?: string
}

export function TextField({
  label,
  help,
  error,
  inputRef,
  counter,
  className = '',
  ...rest
}: Props) {
  const id = useId()
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const counterId = `${id}-counter`
  const describedBy =
    [help && helpId, counter && counterId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        ref={inputRef}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`objetivo-min rounded-md border bg-fondo px-3 py-2 text-base text-texto transition-colors ${
          error ? 'border-2 border-error' : 'border-borde focus-visible:border-primario'
        } ${className}`}
      />
      {help && (
        <p id={helpId} className="text-sm text-texto-suave">
          {help}
        </p>
      )}
      {counter && (
        <p id={counterId} className="text-sm text-texto-suave">
          {counter}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="flex anim-entrada items-start gap-1 text-sm font-semibold text-error"
        >
          <Icon name="error" className="mt-0.5 size-4" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
