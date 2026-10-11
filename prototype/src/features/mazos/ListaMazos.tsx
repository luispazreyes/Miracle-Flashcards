// F-02 Gestión de mazos — RF-16, RF-19, RF-24, RF-35. Columna izquierda de /mazos.
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { EstadoError, EstadoVacio, Esqueleto } from '../../components/Estados'
import { Icon } from '../../components/Icon'
import { MenuAcciones } from '../../components/MenuAcciones'
import { TextField } from '../../components/TextField'
import { useToast } from '../../components/Toast'
import { esperarSalida } from '../../lib/motion'
import { MAX_NOMBRE_MAZO, plural } from '../../lib/texto'
import { useData, type Mazo } from '../../state/DataContext'

interface Props {
  seleccionado: string | null
  onSeleccionar: (id: string | null) => void
  /** Hay una palabra arrastrándose: los mazos son destinos de soltado. */
  arrastrando: boolean
  onSoltar: (mazoId: string, punto: { x: number; y: number }) => void
  /** Último depósito (RF-45): `n` cambia en cada uno para repetir la reacción del mazo. */
  deposito: { mazoId: string; n: number }
}

export function ListaMazos({ seleccionado, onSeleccionar, arrastrando, onSoltar, deposito }: Props) {
  const data = useData()
  const { avisar } = useToast()
  const navigate = useNavigate()
  const lista = useRef<HTMLUListElement>(null)
  const titulo = useRef<HTMLHeadingElement>(null)

  const [creando, setCreando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [errorNombre, setErrorNombre] = useState<string>()
  const [renombrando, setRenombrando] = useState<Mazo | null>(null)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [errorRenombre, setErrorRenombre] = useState<string>()
  const [borrando, setBorrando] = useState<Mazo | null>(null)
  const [saliendo, setSaliendo] = useState<string | null>(null) // fila que sale con transición (RF-44)
  const [sobre, setSobre] = useState<string | null>(null) // mazo bajo la palabra arrastrada (RF-45)

  function crear(e: FormEvent) {
    e.preventDefault()
    const r = data.crearMazo(nombre)
    if (!r.ok) return setErrorNombre(r.error)
    avisar(`Mazo «${nombre.trim()}» creado.`)
    setCreando(false)
    setNombre('')
    setErrorNombre(undefined)
    onSeleccionar(r.id)
  }

  function renombrar(e: FormEvent) {
    e.preventDefault()
    if (!renombrando) return
    const r = data.renombrarMazo(renombrando.id, nombreNuevo)
    if (!r.ok) return setErrorRenombre(r.error)
    avisar(`Mazo renombrado a «${nombreNuevo.trim()}».`)
    setRenombrando(null)
  }

  function borrar() {
    if (!borrando) return
    const { id, nombre } = borrando
    setSaliendo(id)
    esperarSalida(() => {
      data.borrarMazo(id)
      setSaliendo(null)
    })
    avisar(`Mazo «${nombre}» borrado.`)
    if (seleccionado === id) onSeleccionar(null)
    setBorrando(null)
    // El disparador ya no existe: el foco va al título de la lista.
    setTimeout(() => titulo.current?.focus(), 100)
  }

  // Flechas arriba/abajo recorren los mazos (F-02 Accesibilidad).
  function flechas(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const els = [...(lista.current?.querySelectorAll<HTMLElement>('[data-sel]') ?? [])]
    const i = els.indexOf(document.activeElement as HTMLElement)
    if (i < 0) return
    e.preventDefault()
    els[(i + (e.key === 'ArrowDown' ? 1 : -1) + els.length) % els.length]?.focus()
  }

  const claseSel = (activo: boolean) =>
    activo ? 'border-primario bg-grupo-mazo' : 'border-borde'

  return (
    <section aria-labelledby="titulo-mazos" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="titulo-mazos" ref={titulo} tabIndex={-1} className="text-lg font-semibold">
          Mazos
        </h2>
        {data.estadoCarga === 'ok' && !creando && (
          <Button variante="secundario" onClick={() => setCreando(true)}>
            <Icon name="mascircular" className="size-4" />
            Nuevo mazo
          </Button>
        )}
      </div>

      {creando && (
        <form onSubmit={crear} noValidate className="flex flex-col gap-3 rounded-md border border-borde p-3">
          <TextField
            etiqueta="Nombre del mazo"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              setErrorNombre(undefined)
            }}
            error={errorNombre}
            ayuda={`${nombre.length}/${MAX_NOMBRE_MAZO}`}
            autoFocus
            autoComplete="off"
          />
          <div className="flex gap-2">
            <Button type="submit">Crear mazo</Button>
            <Button
              type="button"
              variante="texto"
              onClick={() => {
                setCreando(false)
                setNombre('')
                setErrorNombre(undefined)
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {data.estadoCarga === 'cargando' && <Esqueleto filas={3} />}
      {data.estadoCarga === 'error' && (
        <EstadoError texto="No se pudieron cargar los mazos." onReintentar={data.reintentarCarga} />
      )}

      {data.estadoCarga === 'ok' && (
        <ul ref={lista} onKeyDown={flechas} className="flex flex-col gap-2">
          <li>
            <button
              type="button"
              data-sel
              aria-current={seleccionado === null ? 'true' : undefined}
              onClick={() => onSeleccionar(null)}
              className={`objetivo-min flex w-full items-center gap-2 rounded-md border-2 px-3 py-2 text-left font-semibold transition-colors ${claseSel(seleccionado === null)}`}
            >
              {seleccionado === null && <Icon name="checkcirculo" />}
              Todas las palabras
            </button>
          </li>
          {data.mazos.map((m) => {
            const n = data.palabrasDeMazo(m.id).length
            const activo = seleccionado === m.id
            return (
              <li
                key={m.id}
                data-mazo-id={m.id}
                onDragOver={(e) => {
                  if (!arrastrando) return
                  e.preventDefault()
                  setSobre(m.id)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSobre(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  setSobre(null)
                  onSoltar(m.id, { x: e.clientX, y: e.clientY })
                }}
                className={`${saliendo === m.id ? "anim-salida pointer-events-none" : "anim-entrada"} relative flex items-stretch rounded-md border-2 transition-[border-color,background-color,transform] ${
                  arrastrando && sobre === m.id
                    ? 'scale-[1.02] border-solid border-primario bg-grupo-mazo'
                    : arrastrando
                      ? 'border-dashed border-primario'
                      : claseSel(activo)
                } ${activo ? 'bg-grupo-mazo' : ''}`}
              >
                {deposito.mazoId === m.id && deposito.n > 0 && (
                  <span
                    key={deposito.n}
                    aria-hidden="true"
                    className="anim-pulso-anillo pointer-events-none absolute inset-0 rounded-md border-2 border-exito"
                  />
                )}
                <button
                  type="button"
                  data-sel
                  aria-current={activo ? 'true' : undefined}
                  onClick={() => onSeleccionar(m.id)}
                  className="objetivo-min flex min-w-0 flex-1 flex-col items-start justify-center px-3 py-2 text-left"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    {activo && <Icon name="checkcirculo" />}
                    <span className="break-words">{m.nombre}</span>
                  </span>
                  <span className="text-sm text-texto-suave">
                    {arrastrando && sobre === m.id ? (
                      <span className="flex items-center gap-1 font-semibold text-texto">
                        <Icon name="mascircular" className="size-4" />
                        Suelta aquí
                      </span>
                    ) : deposito.mazoId === m.id && deposito.n > 0 ? (
                      <span key={deposito.n} className="anim-pulso-contador">
                        {plural(n, 'palabra', 'palabras')}
                      </span>
                    ) : (
                      plural(n, 'palabra', 'palabras')
                    )}
                  </span>
                </button>
                <div className="flex items-center gap-1 pr-1">
                  <button
                    type="button"
                    aria-label={`Estudiar ${m.nombre}`}
                    aria-disabled={n === 0 || undefined}
                    aria-describedby={n === 0 ? `sin-palabras-${m.id}` : undefined}
                    onClick={() => n > 0 && navigate(`/estudio/${m.id}`)}
                    className={`objetivo-min rounded-md border border-borde px-3 text-sm font-semibold transition active:scale-[0.98] ${
                      n === 0 ? 'cursor-not-allowed opacity-60' : 'bg-primario text-sobre-primario hover:opacity-90'
                    }`}
                  >
                    Estudiar
                  </button>
                  {n === 0 && (
                    <span id={`sin-palabras-${m.id}`} className="sr-only">
                      Este mazo no tiene palabras
                    </span>
                  )}
                  <MenuAcciones
                    etiqueta={`Más acciones de «${m.nombre}»`}
                    items={[
                      {
                        texto: 'Renombrar',
                        onSelect: () => {
                          setRenombrando(m)
                          setNombreNuevo(m.nombre)
                          setErrorRenombre(undefined)
                        },
                      },
                      { texto: 'Borrar', peligro: true, onSelect: () => setBorrando(m) },
                    ]}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {data.estadoCarga === 'ok' && data.mazos.length === 0 && !creando && (
        <EstadoVacio texto="Aún no tienes mazos. Crea el primero.">
          <Button onClick={() => setCreando(true)}>Nuevo mazo</Button>
        </EstadoVacio>
      )}

      <Dialog abierto={!!renombrando} onCerrar={() => setRenombrando(null)} titulo="Renombrar mazo">
        <form onSubmit={renombrar} noValidate className="flex flex-col gap-4">
          <TextField
            etiqueta="Nombre del mazo"
            value={nombreNuevo}
            onChange={(e) => {
              setNombreNuevo(e.target.value)
              setErrorRenombre(undefined)
            }}
            error={errorRenombre}
            ayuda={`${nombreNuevo.length}/${MAX_NOMBRE_MAZO}`}
            autoComplete="off"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variante="secundario" onClick={() => setRenombrando(null)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar nombre</Button>
          </div>
        </form>
      </Dialog>

      <Dialog abierto={!!borrando} onCerrar={() => setBorrando(null)} titulo="Borrar mazo" alerta>
        <p className="mb-6">
          ¿Borrar «{borrando?.nombre}»? Sus palabras se conservan y quedarán sin mazo. Esta acción no se puede
          deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variante="secundario" data-autofocus onClick={() => setBorrando(null)}>
            Cancelar
          </Button>
          <Button variante="peligro" onClick={borrar}>
            Borrar mazo
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
