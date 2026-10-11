// F-03 Panel de palabras — RF-17, RF-18, RF-20, RF-23, RF-33, RF-34, RF-40, RF-43.
import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { EstadoError, EstadoVacio, Esqueleto } from '../../components/Estados'
import { Icon, type IconName } from '../../components/Icon'
import type { ItemMenu } from '../../components/MenuAcciones'
import { TextField } from '../../components/TextField'
import { useToast } from '../../components/Toast'
import { esperarSalida } from '../../lib/motion'
import { normalizar, plural } from '../../lib/texto'
import { useData, type Palabra } from '../../state/DataContext'
import { FilaPalabra } from './FilaPalabra'
import { FormularioPalabra } from './FormularioPalabra'

interface Props {
  mazoId: string | null
  esEscritorio: boolean
  onArrastreInicio: (palabra: Palabra) => void
  onArrastreFin: () => void
  /** Se agregó una palabra a un mazo con el menú (RF-20): la página anima el depósito en el mazo (RF-45). */
  onDepositado: (mazoId: string) => void
  /** Avisos asistivos (aria-live) de la página. */
  anunciar: (texto: string) => void
}

type Grupo = 'mazo' | 'otros' | 'sin'
const GRUPOS: Record<Grupo, { titulo: string; icono: IconName; fondo: string }> = {
  mazo: { titulo: 'En este mazo', icono: 'checkcirculo', fondo: 'bg-grupo-mazo' },
  otros: { titulo: 'En otros mazos', icono: 'carpeta', fondo: 'bg-grupo-otros' },
  sin: { titulo: 'Sin mazo', icono: 'guion', fondo: 'bg-grupo-sin' },
}

export function PanelPalabras({ mazoId, esEscritorio, onArrastreInicio, onArrastreFin, onDepositado, anunciar }: Props) {
  const data = useData()
  const { avisar } = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState<{ abierto: boolean; palabra?: Palabra }>({ abierto: false })
  const [aBorrar, setABorrar] = useState<Palabra | null>(null)
  const [aQuitar, setAQuitar] = useState<Palabra | null>(null)
  // Fila que está saliendo con transición (RF-44) antes de aplicar el cambio de datos.
  const [saliendo, setSaliendo] = useState<string | null>(null)
  // Fila que pulsa al agregarla con el menú (RF-45): `n` cambia en cada depósito para repetir el pulso.
  const [pulsoFila, setPulsoFila] = useState<{ id: string; n: number }>({ id: '', n: 0 })
  const conSalida = (id: string, cambio: () => void) => {
    setSaliendo(id)
    esperarSalida(() => {
      cambio()
      setSaliendo(null)
    })
  }

  const mazo = data.mazos.find((m) => m.id === mazoId)
  const titulo = mazo ? `Palabras de «${mazo.nombre}»` : 'Todas las palabras'

  const visibles = useMemo(() => {
    const q = normalizar(busqueda)
    return [...data.palabras]
      .filter((p) => !q || normalizar(p.ingles).includes(q) || normalizar(p.espanol).includes(q))
      .sort((a, b) => a.ingles.localeCompare(b.ingles))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.palabras, busqueda])

  const mazosDe = (p: Palabra) => data.mazosDePalabra(p.id)
  const grupoDe = (p: Palabra): Grupo => {
    const ms = mazosDe(p)
    if (ms.length === 0) return 'sin'
    return mazo && ms.some((m) => m.id === mazo.id) ? 'mazo' : 'otros'
  }

  function agregar(p: Palabra, destino: { id: string; nombre: string }) {
    if (data.agregarAMazo(p.id, destino.id) === 'duplicado') {
      avisar(`«${p.ingles}» ya está en este mazo.`, 'error')
      anunciar(`«${p.ingles}» ya está en «${destino.nombre}».`)
    } else {
      avisar(`«${p.ingles}» agregada a «${destino.nombre}».`)
      setPulsoFila((a) => ({ id: p.id, n: a.n + 1 }))
      onDepositado(destino.id)
    }
  }

  function accionesDe(p: Palabra): ItemMenu[] {
    const items: ItemMenu[] = [
      { texto: 'Editar', onSelect: () => setFormulario({ abierto: true, palabra: p }) },
    ]
    if (mazo && mazosDe(p).some((m) => m.id === mazo.id)) {
      items.push({ texto: 'Quitar de este mazo', onSelect: () => setAQuitar(p) })
    }
    items.push({ texto: 'Borrar', peligro: true, onSelect: () => setABorrar(p) })
    return items
  }

  const fila = (p: Palabra, resaltarSinMazo = false) => (
    <FilaPalabra
      key={p.id}
      palabra={p}
      mazosDePalabra={mazosDe(p)}
      todosLosMazos={data.mazos}
      resaltarSinMazo={resaltarSinMazo}
      arrastrable={esEscritorio}
      onArrastreInicio={() => {
        onArrastreInicio(p)
        anunciar(`Arrastrando «${p.ingles}». Suéltala sobre un mazo.`)
      }}
      onArrastreFin={onArrastreFin}
      onAgregar={(destino) => agregar(p, destino)}
      acciones={accionesDe(p)}
      saliendo={saliendo === p.id}
      pulso={pulsoFila.id === p.id ? pulsoFila.n : 0}
    />
  )

  function enfocarFila(id: string) {
    setTimeout(() => document.querySelector<HTMLElement>(`[data-palabra-id="${id}"]`)?.focus(), 100)
  }

  const hayPalabras = data.palabras.length > 0

  return (
    <section aria-labelledby="titulo-palabras" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-palabras" className="text-lg font-semibold">
          {titulo}
        </h2>
        {data.estadoCarga === 'ok' && (
          <Button onClick={() => setFormulario({ abierto: true })}>
            <Icon name="mascircular" className="size-4" />
            Nueva palabra
          </Button>
        )}
      </div>

      {data.estadoCarga === 'cargando' && <Esqueleto filas={5} alto="h-16" />}
      {data.estadoCarga === 'error' && (
        <EstadoError texto="No se pudieron cargar las palabras." onReintentar={data.reintentarCarga} />
      )}

      {data.estadoCarga === 'ok' && !hayPalabras && (
        <EstadoVacio texto="Todavía no hay palabras. Crea la primera.">
          <Button onClick={() => setFormulario({ abierto: true })}>Nueva palabra</Button>
        </EstadoVacio>
      )}

      {data.estadoCarga === 'ok' && hayPalabras && (
        <>
          <TextField
            etiqueta="Buscar palabras"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            ayuda="Busca por inglés o español."
            autoComplete="off"
          />
          {visibles.length === 0 ? (
            <p role="status" className="rounded-md border border-dashed border-borde p-4">
              Sin resultados para «{busqueda}».
            </p>
          ) : mazo ? (
            // Con mazo seleccionado: grupos en orden fijo (RF-33). Los grupos vacíos no se muestran.
            (['mazo', 'otros', 'sin'] as Grupo[]).map((g) => {
              const ps = visibles.filter((p) => grupoDe(p) === g)
              if (ps.length === 0) return null
              const { titulo: t, icono, fondo } = GRUPOS[g]
              return (
                <section key={g} aria-labelledby={`grupo-${g}`} className={`rounded-md p-3 ${fondo}`}>
                  <h3 id={`grupo-${g}`} className="mb-2 flex items-center gap-2 font-semibold">
                    <Icon name={icono} />
                    {t} <span className="font-normal">({ps.length})</span>
                  </h3>
                  <ul className="flex flex-col gap-2">{ps.map((p) => fila(p))}</ul>
                </section>
              )
            })
          ) : (
            // Sin mazo seleccionado: lista única; las "Sin mazo" resaltan y van al final (RF-34).
            <ul aria-label={`Todas las palabras, ${plural(visibles.length, 'resultado', 'resultados')}`} className="flex flex-col gap-2">
              {[...visibles.filter((p) => grupoDe(p) !== 'sin'), ...visibles.filter((p) => grupoDe(p) === 'sin')].map((p) =>
                fila(p, true),
              )}
            </ul>
          )}
        </>
      )}

      <FormularioPalabra
        abierto={formulario.abierto}
        palabra={formulario.palabra}
        onCerrar={() => setFormulario({ abierto: false })}
        onGuardada={enfocarFila}
      />

      <Dialog abierto={!!aBorrar} onCerrar={() => setABorrar(null)} titulo="Borrar palabra" alerta>
        <p className="mb-6">
          ¿Borrar «{aBorrar?.ingles}»? Está en {aBorrar ? mazosDe(aBorrar).length : 0} mazos y se eliminará de todos
          junto con su progreso. No se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variante="secundario" data-autofocus onClick={() => setABorrar(null)}>
            Cancelar
          </Button>
          <Button
            variante="peligro"
            onClick={() => {
              if (!aBorrar) return
              const { id, ingles } = aBorrar
              conSalida(id, () => data.borrarPalabra(id))
              avisar(`«${ingles}» borrada.`)
              setABorrar(null)
              setTimeout(() => document.getElementById("titulo-palabras")?.focus(), 100)
            }}
          >
            Borrar palabra
          </Button>
        </div>
      </Dialog>

      <Dialog abierto={!!aQuitar} onCerrar={() => setAQuitar(null)} titulo="Quitar de este mazo" alerta>
        <p className="mb-6">
          ¿Quitar «{aQuitar?.ingles}» de «{mazo?.nombre}»? La palabra no se borra, pero se elimina su progreso en este
          mazo.
        </p>
        <div className="flex justify-end gap-2">
          <Button variante="secundario" data-autofocus onClick={() => setAQuitar(null)}>
            Cancelar
          </Button>
          <Button
            variante="peligro"
            onClick={() => {
              if (!aQuitar || !mazo) return
              const { id, ingles } = aQuitar
              conSalida(id, () => data.quitarDeMazo(id, mazo.id))
              avisar(`«${ingles}» quitada de «${mazo.nombre}».`)
              setAQuitar(null)
            }}
          >
            Quitar del mazo
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
