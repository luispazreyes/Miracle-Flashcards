// F-04 Crear y editar palabra (RF-03, RF-08, RF-15, RF-17, RF-19, RF-32, RF-36, RF-39; BR-11, BR-12, BR-16,
// BR-17). Diálogo en escritorio y pantalla completa en móvil.
import { useRef, useState, type FormEvent } from 'react'
import { useRepos, useServices } from '../../app/context'
import { useOnline } from '../../app/useOnline'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { TextArea } from '../../components/TextArea'
import { TextField } from '../../components/TextField'
import { RepoError } from '../../data/repositories'
import {
  englishExists,
  normalizeWord,
  validateWordForm,
  type Word,
  type WordFormErrors,
} from '../../domain'
import {
  common,
  messages,
  wordFieldError,
  wordFieldNames,
  wordForm as t,
} from '../../lib/messages.es'
import { ImageField, useImageCheck } from './ImageField'

interface Props {
  open: boolean
  /** Palabra a editar; sin ella se crea una nueva. */
  word: Word | null
  /** Palabras existentes (aviso de inglés repetido al crear, BR-12). */
  words: readonly Word[]
  onClose: () => void
  onSaved: (word: Word) => void
}

export function WordFormDialog({ open, word, words, onClose, onSaved }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={word ? t.titleEdit : t.titleNew}
      fullScreenOnMobile
      width="lg"
    >
      <WordForm word={word} words={words} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  )
}

type FieldKey = 'english' | 'spanish' | 'imageUrl'

function WordForm({ word, words, onClose, onSaved }: Omit<Props, 'open'>) {
  const repos = useRepos()
  const { checkImage } = useServices()
  const online = useOnline()

  const [values, setValues] = useState({
    english: word?.english ?? '',
    spanish: word?.spanish ?? '',
    imageUrl: word?.imageUrl ?? '',
    example: word?.example ?? '',
    note: word?.note ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [imageBlurred, setImageBlurred] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string>()

  const englishRef = useRef<HTMLInputElement>(null)
  const spanishRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  const unchangedImage = values.imageUrl.trim() === (word?.imageUrl ?? '')
  const image = useImageCheck(values.imageUrl, online, checkImage, !!word && unchangedImage)

  const set = (field: keyof typeof values) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    if (field in errors) setErrors((e) => ({ ...e, [field]: undefined }))
    setSaveError(undefined)
  }

  // BR-12: aviso no bloqueante al crear con un inglés que ya existe.
  const duplicate =
    !word && values.english.trim() !== '' && englishExists(words, normalizeWord(values.english))

  function fail(next: Partial<Record<FieldKey, string>>) {
    setErrors(next)
    const refs = { english: englishRef, spanish: spanishRef, imageUrl: imageRef }
    const first = (['english', 'spanish', 'imageUrl'] as const).find((k) => next[k])
    if (first) refs[first].current?.focus()
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setSubmitted(true)
    setSaveError(undefined)

    const parsed = validateWordForm(values)
    if (!parsed.ok) {
      const next: Partial<Record<FieldKey, string>> = {}
      for (const [field, code] of Object.entries(parsed.error) as [
        keyof WordFormErrors,
        NonNullable<WordFormErrors[keyof WordFormErrors]>,
      ][])
        next[field] = wordFieldError(field, code)
      fail(next)
      return
    }

    setBusy(true)
    try {
      const url = parsed.value.imageUrl
      let imageVerified = true
      if (url && url !== word?.imageUrl) {
        if (!online)
          imageVerified = false // BR-17: sin conexión no se rechaza por "no carga"
        else {
          const loads = url in image.results ? image.results[url] : await checkImage(url)
          if (!loads) {
            fail({ imageUrl: wordFieldError('imageUrl', 'not-http') })
            return
          }
        }
      }
      const saved = word
        ? await repos.words.update(word.id, { ...values, imageVerified })
        : (await repos.words.create({ ...values, imageVerified })).word
      onSaved(saved)
    } catch (error) {
      if (error instanceof RepoError && error.code === 'invalid-word' && error.detail?.fields) {
        const next: Partial<Record<FieldKey, string>> = {}
        for (const [field, code] of Object.entries(error.detail.fields) as [
          keyof WordFormErrors,
          NonNullable<WordFormErrors[keyof WordFormErrors]>,
        ][])
          next[field] = wordFieldError(field, code)
        fail(next)
      } else setSaveError(t.saveError)
    } finally {
      setBusy(false)
    }
  }

  const errorEntries = (Object.entries(errors) as [FieldKey, string | undefined][]).filter(
    ([, message]) => message,
  )

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
      {submitted && errorEntries.length > 0 && (
        <Alert kind="error">
          <p className="font-semibold">{t.errorSummary}</p>
          <ul className="list-disc pl-5">
            {errorEntries.map(([field]) => (
              <li key={field}>{wordFieldNames[field]}</li>
            ))}
          </ul>
        </Alert>
      )}

      <TextField
        label={t.english}
        lang="en"
        autoComplete="off"
        inputRef={englishRef}
        value={values.english}
        onChange={(e) => set('english')(e.target.value)}
        error={errors.english}
      />
      {duplicate && <Alert kind="warning">{messages.duplicateEnglish}</Alert>}
      <TextField
        label={t.spanish}
        autoComplete="off"
        inputRef={spanishRef}
        value={values.spanish}
        onChange={(e) => set('spanish')(e.target.value)}
        error={errors.spanish}
      />
      <ImageField
        value={values.imageUrl}
        onChange={set('imageUrl')}
        status={image.status}
        error={errors.imageUrl}
        showInvalid={submitted || imageBlurred}
        onBlur={() => setImageBlurred(true)}
        inputRef={imageRef}
      />
      <TextField
        label={t.example}
        autoComplete="off"
        value={values.example}
        onChange={(e) => set('example')(e.target.value)}
      />
      <TextArea label={t.note} value={values.note} onChange={(e) => set('note')(e.target.value)} />

      {saveError && (
        <Alert kind="error">
          <p>{saveError}</p>
        </Alert>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {common.cancel}
        </Button>
        <Button type="submit" loading={busy}>
          {saveError ? common.retry : t.save}
        </Button>
      </div>
    </form>
  )
}
