// F-01 Acceso con enlace mágico — RF-09, RF-37, RF-41.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { TextField } from '../../components/TextField'

export type EstadoAcceso =
  | 'inicial'
  | 'enviando'
  | 'enviado'
  | 'enlace-invalido'
  | 'sin-conexion'
  | 'error-envio'

const ESPERA_REENVIO_S = 60
const ANUNCIO_CADA_S = 10
const EMAIL_PLACEHOLDER = 'persona@ejemplo.invalid'
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Props {
  /** Solo para revisar estados en el prototipo; en producción siempre arranca en "inicial". */
  estadoInicial?: EstadoAcceso
}

export function AccesoPage({ estadoInicial = 'inicial' }: Props) {
  const [estado, setEstado] = useState<EstadoAcceso>(estadoInicial)
  const [email, setEmail] = useState(estadoInicial === 'enviado' ? EMAIL_PLACEHOLDER : '')
  const [errorCampo, setErrorCampo] = useState<string>()
  const [restante, setRestante] = useState(estadoInicial === 'enviado' ? ESPERA_REENVIO_S : 0)
  const [anuncio, setAnuncio] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const mensajeRef = useRef<HTMLDivElement>(null)
  const sinAvance = useRef(estadoInicial !== 'inicial') // estado forzado: no avanza solo

  // Foco: al campo al cargar; al mensaje cuando aparece uno (F-01 Accesibilidad).
  useEffect(() => {
    if (estado === 'inicial') inputRef.current?.focus()
    else if (estado !== 'enviando') mensajeRef.current?.focus()
  }, [estado])

  // Cuenta regresiva de 60 s (RF-37); se anuncia cada 10 s, no cada segundo.
  useEffect(() => {
    if (restante <= 0) return
    const t = setTimeout(() => {
      const siguiente = restante - 1
      setRestante(siguiente)
      if (siguiente > 0 && siguiente % ANUNCIO_CADA_S === 0) {
        setAnuncio(`Podrás reenviar el enlace en ${siguiente} segundos.`)
      } else if (siguiente === 0) {
        setAnuncio('Ya puedes reenviar el enlace.')
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [restante])

  function validar(): boolean {
    const valor = email.trim()
    if (!valor) {
      setErrorCampo('Falta el campo «Correo electrónico». Escríbelo para recibir tu enlace.')
      return false
    }
    if (!EMAIL_VALIDO.test(valor)) {
      setErrorCampo('Escribe un correo válido.')
      return false
    }
    setErrorCampo(undefined)
    return true
  }

  function enviar(e?: FormEvent) {
    e?.preventDefault()
    if (!validar()) {
      inputRef.current?.focus()
      return
    }
    if (!navigator.onLine) {
      setEstado('sin-conexion')
      return
    }
    setEstado('enviando')
    if (sinAvance.current) return
    setTimeout(() => {
      setEstado('enviado')
      setRestante(ESPERA_REENVIO_S)
      setAnuncio('')
    }, 900)
  }

  function solicitarNuevo() {
    setEstado('inicial')
    setErrorCampo(undefined)
    sinAvance.current = false
  }

  const enviando = estado === 'enviando'
  const enviado = estado === 'enviado'
  const bloqueadoPorEspera = enviado && restante > 0

  return (
    <main id="contenido" className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg bg-superficie p-6 shadow-2">
        <header className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-pill bg-primario text-sobre-primario">
            <Icon name="correo" className="size-6" />
          </span>
          <h1 className="text-xl font-semibold">Miracle Flashcards</h1>
          <p className="text-texto-suave">Entra con tu correo. No necesitas contraseña.</p>
        </header>

        {estado === 'enlace-invalido' ? (
          <div className="flex flex-col gap-4">
            <Alert tipo="error" alertRef={mensajeRef}>
              <p className="font-semibold">Este enlace ya no es válido.</p>
              <p>Pudo caducar, haberse usado o estar incompleto.</p>
            </Alert>
            <Button onClick={solicitarNuevo}>Solicitar enlace nuevo</Button>
          </div>
        ) : (
          <form onSubmit={enviar} noValidate className="flex flex-col gap-4" aria-busy={enviando}>
            {estado === 'sin-conexion' && (
              <Alert tipo="aviso" alertRef={mensajeRef}>
                Necesitas conexión para iniciar sesión por primera vez.
              </Alert>
            )}
            {estado === 'error-envio' && (
              <Alert tipo="error" alertRef={mensajeRef}>
                No se pudo completar la acción. Inténtalo de nuevo.
              </Alert>
            )}
            {enviado && (
              <Alert tipo="exito" alertRef={mensajeRef}>
                <p className="font-semibold">Revisa tu correo.</p>
                <p>El enlace caduca en 1 hora y solo se puede usar una vez.</p>
              </Alert>
            )}

            <TextField
              etiqueta="Correo electrónico"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errorCampo}
              ayuda={errorCampo ? undefined : 'Te enviaremos un enlace para entrar.'}
              readOnly={enviando}
              inputRef={inputRef}
            />

            <Button type="submit" cargando={enviando} disabled={bloqueadoPorEspera}>
              {enviando
                ? 'Enviando…'
                : bloqueadoPorEspera
                  ? `Reenviar enlace en ${restante} s`
                  : enviado
                    ? 'Reenviar enlace'
                    : estado === 'error-envio'
                      ? 'Reintentar'
                      : 'Enviar enlace de acceso'}
            </Button>

            {/* Anuncios de la cuenta regresiva, cada 10 s (no cada segundo). */}
            <p className="sr-only" aria-live="polite">
              {anuncio}
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
