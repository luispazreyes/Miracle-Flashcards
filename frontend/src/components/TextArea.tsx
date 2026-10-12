import { useId, type Ref, type TextareaHTMLAttributes } from 'react'

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  inputRef?: Ref<HTMLTextAreaElement>
}

export function TextArea({ label, inputRef, className = '', ...rest }: Props) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <textarea
        {...rest}
        id={id}
        ref={inputRef}
        rows={rest.rows ?? 3}
        className={`min-h-(--objetivo-min) rounded-md border border-borde bg-fondo px-3 py-2 text-base text-texto transition-colors focus-visible:border-primario ${className}`}
      />
    </div>
  )
}
