// Campo "Enlace de imagen" (RF-03, RF-15, BR-17): validación en línea, vista previa y modo sin conexión
// ("sin verificar"). Solo se guarda el enlace, nunca el archivo.
import { useEffect, useState } from 'react'
import { Badge } from '../../components/Badge'
import { TextField } from '../../components/TextField'
import { WordImage } from '../../components/WordImage'
import { isHttpUrl } from '../../domain'
import { wordFieldError, wordForm as t, words as w } from '../../lib/messages.es'

export type ImageStatus = 'idle' | 'invalid' | 'checking' | 'ok' | 'fail' | 'unverified'

const DEBOUNCE_MS = 500

/**
 * Estado de la imagen del formulario. `skip` = la URL no cambió respecto a la guardada: no se vuelve a
 * comprobar. Sin conexión no se rechaza por "no carga": queda "sin verificar" (BR-17).
 */
export function useImageCheck(
  url: string,
  online: boolean,
  check: (url: string) => Promise<boolean>,
  skip: boolean,
) {
  const trimmed = url.trim()
  const [results, setResults] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (skip || !online || !isHttpUrl(trimmed) || trimmed in results) return
    let cancelled = false
    const id = setTimeout(() => {
      void check(trimmed).then((ok) => {
        if (!cancelled) setResults((r) => ({ ...r, [trimmed]: ok }))
      })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [trimmed, online, skip, results, check])

  const status: ImageStatus =
    !trimmed || skip
      ? 'idle'
      : !isHttpUrl(trimmed)
        ? 'invalid'
        : !online
          ? 'unverified'
          : trimmed in results
            ? results[trimmed]
              ? 'ok'
              : 'fail'
            : 'checking'

  return { status, results }
}

interface Props {
  value: string
  onChange: (value: string) => void
  status: ImageStatus
  /** Error de envío (p. ej. "no carga") o de validación. */
  error?: string
  /** Muestra el error de formato también antes de enviar (al salir del campo). */
  showInvalid: boolean
  onBlur: () => void
  inputRef?: React.Ref<HTMLInputElement>
}

export function ImageField({
  value,
  onChange,
  status,
  error,
  showInvalid,
  onBlur,
  inputRef,
}: Props) {
  const shownError =
    error ??
    (status === 'fail' || (status === 'invalid' && showInvalid)
      ? wordFieldError('imageUrl', 'not-http')
      : undefined)
  const url = value.trim()

  return (
    <div className="flex flex-col gap-2">
      <TextField
        label={t.image}
        help={t.imageHelp}
        type="url"
        inputMode="url"
        autoComplete="off"
        inputRef={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        error={shownError}
      />
      <div role="status" className="flex flex-col gap-2">
        {status === 'checking' && <p className="text-sm text-texto-suave">{t.checking}</p>}
        {status === 'unverified' && (
          <>
            <Badge icon="alert" tone="warning">
              {w.unverified}
            </Badge>
            <p className="text-sm text-texto-suave">{t.imageOffline}</p>
          </>
        )}
      </div>
      {(status === 'ok' || status === 'unverified') && isHttpUrl(url) && (
        <WordImage key={url} src={url} alt={t.imageAlt} className="h-32 w-full max-w-xs" />
      )}
    </div>
  )
}
