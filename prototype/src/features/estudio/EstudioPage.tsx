// F-05 Sesión de estudio — RF-01 a RF-07, RF-12, RF-13, RF-25, RF-31, RF-35.
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { EstadoError, Esqueleto } from '../../components/Estados'
import { Icon } from '../../components/Icon'
import { ACIERTOS_PARA_APRENDER, useTitulo } from '../../lib/texto'
import { useData, type Mazo, type Palabra } from '../../state/DataContext'
import { usePrefs } from '../../state/PrefsContext'
import { useSync } from '../../state/SyncContext'
import { EstudioFin } from './EstudioFin'
import { Flashcard } from './Flashcard'

type Respuesta = { tipo: 'acierto' | 'fallo' | 'aprendida'; aciertos: number }

/** Pasada barajada; con ≥ 2 pendientes la primera nunca repite la última vista (RF-31). */
function barajar(ids: string[], ultima: string | null): string[] {
  const a = [...ids]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  if (a.length >= 2 && a[0] === ultima) [a[0], a[a.length - 1]] = [a[a.length - 1], a[0]]
  return a
}

export function EstudioPage() {
  const { mazoId } = useParams()
  const data = useData()
  const mazo = data.mazos.find((m) => m.id === mazoId)

  if (data.estadoCarga === 'cargando')
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="sr-only">Estudiar</h1>
        <Esqueleto filas={1} alto="h-64" />
      </div>
    )
  if (data.estadoCarga === 'error')
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="sr-only">Estudiar</h1>
        <EstadoError texto="No se pudo cargar el mazo." onReintentar={data.reintentarCarga} />
      </div>
    )
  if (!mazo) return <Navigate to="/mazos" replace />
  return <Sesion key={mazo.id} mazo={mazo} />
}

function Sesion({ mazo }: { mazo: Mazo }) {
  const data = useData()
  const { ladoImagen } = usePrefs()
  const { estado: sync } = useSync()

  const palabras = data.palabrasDeMazo(mazo.id)
  const [inicio] = useState(() =>
    data.progreso.filter((p) => p.mazoId === mazo.id && !p.aprendida).map((p) => p.palabraId),
  )
  const [pendientes, setPendientes] = useState(inicio)
  const [cola, setCola] = useState(() => barajar(inicio, null))
  const [volteada, setVolteada] = useState(false)
  const [aciertos, setAciertos] = useState(0)
  const [fallos, setFallos] = useState(0)
  const [ultima, setUltima] = useState<Respuesta | null>(null)
  const [anuncio, setAnuncio] = useState('')

  const tarjeta = useRef<HTMLButtonElement>(null)
  const botonAcerte = useRef<HTMLButtonElement>(null)
  const primera = useRef(true)

  const actualId = cola[0]
  const actual: Palabra | undefined = palabras.find((p) => p.id === actualId)
  const racha = data.progreso.find((p) => p.mazoId === mazo.id && p.palabraId === actualId)?.aciertos ?? 0

  useTitulo(`Estudiar «${mazo.nombre}»`)

  // Foco: al voltear, al botón "Acerté"; al pasar a la tarjeta siguiente, a la tarjeta (F-05 Accesibilidad).
  useEffect(() => {
    if (primera.current) {
      primera.current = false
      return
    }
    if (volteada) botonAcerte.current?.focus()
  }, [volteada])

  function voltear() {
    if (!actual) return
    const siguiente = !volteada
    setVolteada(siguiente)
    if (siguiente) {
      setAnuncio(
        [`Traducción: ${actual.espanol}.`, actual.ejemplo && `Ejemplo: ${actual.ejemplo}`, actual.nota && `Nota: ${actual.nota}`]
          .filter(Boolean)
          .join(' '),
      )
    } else setAnuncio('')
  }

  function responder(acierto: boolean) {
    if (!actual) return
    const r = data.responder(mazo.id, actual.id, acierto)
    if (acierto) setAciertos((n) => n + 1)
    else setFallos((n) => n + 1)
    setUltima({ tipo: r.aprendida ? 'aprendida' : acierto ? 'acierto' : 'fallo', aciertos: r.aciertos })
    setAnuncio('')

    const quedan = r.aprendida ? pendientes.filter((id) => id !== actual.id) : pendientes
    setPendientes(quedan)
    const resto = cola.slice(1)
    setCola(resto.length > 0 ? resto : barajar(quedan, actual.id))
    setVolteada(false)
    requestAnimationFrame(() => tarjeta.current?.focus())
  }

  if (palabras.length === 0)
    return <EstudioFin tipo="sin-palabras" mazoId={mazo.id} nombreMazo={mazo.nombre} />
  if (inicio.length === 0)
    return <EstudioFin tipo="sin-pendientes" mazoId={mazo.id} nombreMazo={mazo.nombre} />
  if (pendientes.length === 0 || !actual)
    return <EstudioFin tipo="sesion" mazoId={mazo.id} nombreMazo={mazo.nombre} resumen={{ aciertos, fallos }} />

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{mazo.nombre}</h1>
          <p className="text-texto-suave">Pendientes: {pendientes.length}</p>
        </div>
        <Link
          to={`/mazos?mazo=${mazo.id}`}
          className="objetivo-min inline-flex items-center rounded-md border border-borde px-4 font-semibold hover:bg-superficie"
        >
          Salir
        </Link>
      </div>

      {/* Resultado de la respuesta anterior: texto + icono, nunca solo color */}
      <p role="status" className="flex min-h-6 items-center gap-2 font-semibold">
        {ultima?.tipo === 'acierto' && (
          <span className="flex items-center gap-1 text-exito">
            <Icon name="check" />
            Acierto. Aciertos seguidos: {ultima.aciertos} de {ACIERTOS_PARA_APRENDER}.
          </span>
        )}
        {ultima?.tipo === 'fallo' && (
          <span className="flex items-center gap-1 text-error">
            <Icon name="error" />
            No acertaste. El contador vuelve a 0.
          </span>
        )}
        {ultima?.tipo === 'aprendida' && (
          <span className="flex items-center gap-1 text-exito">
            <Icon name="checkcirculo" />
            ¡Aprendida!
          </span>
        )}
      </p>

      {/* key: cada tarjeta nueva entra con transición y arranca sin voltear (RF-44); no se retrasa la respuesta */}
      <div key={actual.id} className="anim-entrada">
        <Flashcard
          ref={tarjeta}
          palabra={actual}
          volteada={volteada}
          onVoltear={voltear}
          ladoImagen={ladoImagen}
          sinConexion={sync === 'sin-conexion'}
        />
      </div>

      {!volteada && <p className="text-center text-texto-suave">Toca o pulsa Espacio para ver la traducción</p>}

      <p className="flex items-center justify-center gap-2">
        <span aria-hidden="true" className="flex items-center gap-1">
          {Array.from({ length: ACIERTOS_PARA_APRENDER }, (_, i) => (
            <Icon key={i} name={i < racha ? 'checkcirculo' : 'circulo'} className="size-5" />
          ))}
        </span>
        <span>
          Aciertos seguidos: {racha} de {ACIERTOS_PARA_APRENDER}
        </span>
      </p>

      {volteada && (
        <div className="flex gap-3">
          <Button ref={botonAcerte} onClick={() => responder(true)} className="min-h-14 flex-1">
            <Icon name="check" />
            Acerté
          </Button>
          <Button variante="secundario" onClick={() => responder(false)} className="min-h-14 flex-1">
            <Icon name="error" />
            No acerté
          </Button>
        </div>
      )}

      {/* Contenido nuevo al voltear (tarjeta con aria-label: el detalle se anuncia aquí) */}
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
    </div>
  )
}
