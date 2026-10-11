import { useId, type InputHTMLAttributes, type Ref } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  etiqueta: string
  ayuda?: string
  error?: string
  inputRef?: Ref<HTMLInputElement>
}

export function TextField({ etiqueta, ayuda, error, inputRef, className = '', ...rest }: Props) {
  const id = useId()
  const ayudaId = `${id}-ayuda`
  const errorId = `${id}-error`
  const describedBy = [ayuda && ayudaId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {etiqueta}
      </label>
      <input
        {...rest}
        id={id}
        ref={inputRef}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`objetivo-min rounded-md border bg-fondo px-3 py-2 text-base text-texto ${
          error ? 'border-error border-2' : 'border-borde'
        } ${className}`}
      />
      {ayuda && (
        <p id={ayudaId} className="text-sm text-texto-suave">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1 text-sm font-semibold text-error">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v5m0 3h.01" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
