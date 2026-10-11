// F-04 Crear y editar palabra — RF-03, RF-08, RF-15, RF-17, RF-19, RF-32, RF-36, RF-39.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { TextField } from '../../components/TextField'
import { useToast } from '../../components/Toast'
import { normalizar } from '../../lib/texto'
import { useData, type Palabra } from '../../state/DataContext'
import { useSync } from '../../state/SyncContext'

type EstadoImagen = 'ninguna' | 'comprobando' | 'valida' | 'invalida' | 'sin-verificar'
const ESPERA_COMPROBACION_MS = 8000
const ESPERA_ESCRITURA_MS = 500
const GUARDADO_SIMULADO_MS = 400

interface Props {
  abierto: boolean
  palabra?: Palabra
  onCerrar: () => void
  onGuardada: (id: string) => void
}

export function FormularioPalabra({ abierto, palabra, onCerrar, onGuardada }: Props) {
  // Se monta cada vez que se abre para partir siempre de un estado limpio.
  return (
    <Dialog
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={palabra ? 'Editar palabra' : 'Nueva palabra'}
      pantallaCompletaMovil
      ancho="lg"
    >
      <Formulario palabra={palabra} onCerrar={onCerrar} onGuardada={onGuardada} />
    </Dialog>
  )
}

function Formulario({ palabra, onCerrar, onGuardada }: Omit<Props, 'abierto'>) {
  const data = useData()
  const { estado: sync } = useSync()
  const { avisar } = useToast()

  const [ingles, setIngles] = useState(palabra?.ingles ?? '')
  const [espanol, setEspanol] = useState(palabra?.espanol ?? '')
  const [url, setUrl] = useState(palabra?.imagen?.url ?? '')
  const [ejemplo, setEjemplo] = useState(palabra?.ejemplo ?? '')
  const [nota, setNota] = useState(palabra?.nota ?? '')
  const [imagen, setImagen] = useState<EstadoImagen>(
    palabra?.imagen ? (palabra.imagen.verificada ? 'valida' : 'sin-verificar') : 'ninguna',
  )
  const [errores, setErrores] = useState<{ ingles?: string; espanol?: string; imagen?: string }>({})
  const [guardando, setGuardando] = useState(false)
  const [falloGuardado, setFalloGuardado] = useState(false)

  const refIngles = useRef<HTMLInputElement>(null)
  const refEspanol = useRef<HTMLInputElement>(null)
  const refUrl = useRef<HTMLInputElement>(null)

  const sinConexion = sync === 'sin-conexion' || !navigator.onLine
  const duplicado =
    ingles.trim() !== '' &&
    data.palabras.some((p) => p.id !== palabra?.id && normalizar(p.ingles) === normalizar(ingles))

  // RF-15: comprobar el enlace de imagen (http/https y que cargue como imagen).
  const primera = useRef(true)
  useEffect(() => {
    if (primera.current) {
      primera.current = false
      if (palabra?.imagen) return // ya validada al guardarla
    }
    const valor = url.trim()
    if (!valor) return setImagen('ninguna')
    if (!/^https?:\/\//i.test(valor)) return setImagen('invalida')
    if (sinConexion) return setImagen('sin-verificar')
    setImagen('comprobando')
    let vigente = true
    const espera = setTimeout(() => {
      const img = new Image()
      const limite = setTimeout(() => vigente && setImagen('invalida'), ESPERA_COMPROBACION_MS)
      img.onload = () => {
        clearTimeout(limite)
        if (vigente) setImagen('valida')
      }
      img.onerror = () => {
        clearTimeout(limite)
        if (vigente) setImagen('invalida')
      }
      img.src = valor
    }, ESPERA_ESCRITURA_MS)
    return () => {
      vigente = false
      clearTimeout(espera)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, sinConexion])

  function guardar(e: FormEvent) {
    e.preventDefault()
    const nuevos: typeof errores = {}
    if (!ingles.trim()) nuevos.ingles = 'Falta el campo «Inglés». Escríbelo para crear la palabra.'
    if (!espanol.trim()) nuevos.espanol = 'Falta el campo «Español». Escríbelo para crear la palabra.'
    if (imagen === 'invalida') nuevos.imagen = 'El enlace no es http(s) o no carga como imagen.'
    if (imagen === 'comprobando') nuevos.imagen = 'Espera a que termine la comprobación de la imagen.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      requestAnimationFrame(() => (nuevos.ingles ? refIngles : nuevos.espanol ? refEspanol : refUrl).current?.focus())
      return
    }

    setFalloGuardado(false)
    setGuardando(true)
    setTimeout(() => {
      const r = data.guardarPalabra(
        {
          ingles: ingles.trim(),
          espanol: espanol.trim(),
          ejemplo: ejemplo.trim() || undefined,
          nota: nota.trim() || undefined,
          imagen: url.trim() ? { url: url.trim(), verificada: imagen === 'valida' } : undefined,
        },
        palabra?.id,
      )
      setGuardando(false)
      if (!r.ok) return setFalloGuardado(true) // RF-22: no se pierde lo escrito
      avisar('Palabra guardada')
      onCerrar()
      onGuardada(r.id)
    }, GUARDADO_SIMULADO_MS)
  }

  const lista = [errores.ingles, errores.espanol, errores.imagen].filter(Boolean) as string[]

  return (
    <form onSubmit={guardar} noValidate aria-busy={guardando} className="flex flex-col gap-4">
      {lista.length > 0 && (
        <div role="alert" className="rounded-md border-2 border-error p-3 text-error">
          <p className="font-semibold">Revisa estos campos:</p>
          <ul className="list-disc pl-5 text-texto">
            {lista.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {falloGuardado && (
        <Alert tipo="error">No se pudo completar la acción. Inténtalo de nuevo. No se perdió lo que escribiste.</Alert>
      )}

      <TextField
        etiqueta="Inglés (obligatorio)"
        lang="en"
        value={ingles}
        onChange={(e) => setIngles(e.target.value)}
        error={errores.ingles}
        inputRef={refIngles}
        autoComplete="off"
        required
        data-autofocus
      />
      {duplicado && <Alert tipo="aviso">Ya existe una palabra con ese inglés. Puedes continuar.</Alert>}

      <TextField
        etiqueta="Español (obligatorio)"
        value={espanol}
        onChange={(e) => setEspanol(e.target.value)}
        error={errores.espanol}
        inputRef={refEspanol}
        autoComplete="off"
        required
      />

      <div className="flex flex-col gap-2">
        <TextField
          etiqueta="Enlace de imagen"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={errores.imagen && imagen === 'invalida' ? errores.imagen : undefined}
          ayuda="Opcional. Debe empezar por http:// o https://."
          inputRef={refUrl}
          autoComplete="off"
        />
        {imagen === 'comprobando' && (
          <p role="status" className="flex items-center gap-2 text-sm text-texto-suave">
            <Icon name="sincronizar" className="size-4 animate-spin" />
            Comprobando imagen…
          </p>
        )}
        {imagen === 'valida' && (
          <img src={url.trim()} alt="Imagen de la palabra" className="max-h-32 w-auto self-start rounded-md" />
        )}
        {imagen === 'invalida' && !errores.imagen && (
          <p role="status" className="flex items-center gap-2 text-sm font-semibold text-error">
            <Icon name="error" className="size-4" />
            El enlace no es http(s) o no carga como imagen.
          </p>
        )}
        {imagen === 'sin-verificar' && (
          <div className="flex flex-col gap-1">
            <p className="flex w-fit items-center gap-1 rounded-pill border-2 border-aviso px-2 text-sm font-semibold text-aviso">
              <Icon name="alerta" className="size-4" />
              Imagen sin verificar
            </p>
            <p role="status" className="text-sm text-texto-suave">
              Se comprobará cuando recuperes la conexión. Si falla, se retirará y te avisaremos.
            </p>
          </div>
        )}
      </div>

      <TextField
        etiqueta="Ejemplo de uso"
        value={ejemplo}
        onChange={(e) => setEjemplo(e.target.value)}
        ayuda="Opcional."
        autoComplete="off"
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="nota-palabra" className="font-semibold">
          Nota
        </label>
        <textarea
          id="nota-palabra"
          rows={3}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          aria-describedby="nota-ayuda"
          className="rounded-md border border-borde bg-fondo px-3 py-2 text-base text-texto"
        />
        <p id="nota-ayuda" className="text-sm text-texto-suave">
          Opcional.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variante="secundario" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" cargando={guardando}>
          {falloGuardado ? 'Reintentar' : 'Guardar palabra'}
        </Button>
      </div>
    </form>
  )
}
