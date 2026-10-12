// Nombre de mazo en línea, con contador n/60 y validación (RF-16, BR-19). Enter guarda, Esc cancela.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { DECK_NAME_MAX, validateDeckName, type Deck } from '../../domain'
import { common, deckNameErrors, decks as t } from '../../lib/messages.es'

interface Props {
  initial?: string
  /** Mazos existentes, para detectar duplicados al instante. */
  decks: readonly Deck[]
  excludeId?: string
  submitLabel: string
  /** Devuelve un texto de error si el repositorio lo rechaza. */
  onSubmit: (name: string) => Promise<string | undefined>
  onCancel: () => void
}

export function DeckForm({
  initial = '',
  decks,
  excludeId,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const parsed = validateDeckName(name, decks, excludeId)
    if (!parsed.ok) {
      setError(deckNameErrors[parsed.error])
      input.current?.focus()
      return
    }
    setBusy(true)
    const failure = await onSubmit(parsed.value.name)
    setBusy(false)
    if (failure) {
      setError(failure)
      input.current?.focus()
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Esc cancela desde cualquier campo del formulario
    <form
      onSubmit={(e) => void submit(e)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onCancel()
        }
      }}
      noValidate
      className="flex flex-col gap-2 rounded-md border border-borde bg-superficie p-3"
    >
      <TextField
        label={t.nameLabel}
        inputRef={input}
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setError(undefined)
        }}
        counter={t.counter(name.trim().length, DECK_NAME_MAX)}
        error={error}
        autoComplete="off"
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {common.cancel}
        </Button>
        <Button type="submit" loading={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
