// F-07 Progreso y reactivación — RF-26, RF-27, RF-30.
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { EstadoError, EstadoVacio, Esqueleto } from '../../components/Estados'
import { Icon } from '../../components/Icon'
import { Tabs, idPanel, idTab } from '../../components/Tabs'
import { useToast } from '../../components/Toast'
import { esperarSalida } from '../../lib/motion'
import { ACIERTOS_PARA_APRENDER, useTitulo } from '../../lib/texto'
import { useData } from '../../state/DataContext'

export function ProgresoPage() {
  useTitulo('Progreso')
  const data = useData()
  const { avisar } = useToast()
  const [params, setParams] = useSearchParams()
  const [pestana, setPestana] = useState<'pendientes' | 'aprendidas'>('pendientes')
  const [saliendo, setSaliendo] = useState<string | null>(null) // fila que sale con transición (RF-44)

  const mazo = data.mazos.find((m) => m.id === params.get('mazo')) ?? data.mazos[0]
  const filas = mazo ? data.progreso.filter((p) => p.mazoId === mazo.id) : []
  const nombreDe = (id: string) => data.palabras.find((p) => p.id === id)?.ingles ?? ''
  const espanolDe = (id: string) => data.palabras.find((p) => p.id === id)?.espanol ?? ''
  const ordenadas = (aprendida: boolean) =>
    filas.filter((f) => f.aprendida === aprendida).sort((a, b) => nombreDe(a.palabraId).localeCompare(nombreDe(b.palabraId)))
  const pendientes = ordenadas(false)
  const aprendidas = ordenadas(true)
  const total = filas.length
  const porcentaje = total === 0 ? 0 : Math.round((aprendidas.length / total) * 100)

  const lista = pestana === 'pendientes' ? pendientes : aprendidas

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 tabIndex={-1} className="text-xl font-semibold">
        Progreso
      </h1>

      {data.estadoCarga === 'cargando' && <Esqueleto filas={4} />}
      {data.estadoCarga === 'error' && (
        <EstadoError texto="No se pudo cargar el progreso." onReintentar={data.reintentarCarga} />
      )}

      {data.estadoCarga === 'ok' && data.mazos.length === 0 && (
        <EstadoVacio texto="Crea un mazo para ver tu progreso.">
          <Link
            to="/mazos"
            className="objetivo-min inline-flex items-center rounded-md bg-primario px-4 font-semibold text-sobre-primario"
          >
            Ir a mazos
          </Link>
        </EstadoVacio>
      )}

      {data.estadoCarga === 'ok' && mazo && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="selector-mazo" className="font-semibold">
              Mazo
            </label>
            <select
              id="selector-mazo"
              value={mazo.id}
              onChange={(e) => setParams({ mazo: e.target.value }, { replace: true })}
              className="objetivo-min rounded-md border border-borde bg-fondo px-3 text-base text-texto"
            >
              {data.mazos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {total === 0 ? (
            <EstadoVacio texto="Este mazo no tiene palabras." />
          ) : (
            <>
              <div className="flex flex-col gap-2 rounded-md bg-superficie p-4">
                <dl className="flex gap-8 text-lg font-semibold">
                  <div>
                    <dt className="text-base font-normal text-texto-suave">Pendientes</dt>
                    <dd>{pendientes.length}</dd>
                  </div>
                  <div>
                    <dt className="text-base font-normal text-texto-suave">Aprendidas</dt>
                    <dd>{aprendidas.length}</dd>
                  </div>
                </dl>
                <div
                  role="progressbar"
                  aria-label="Avance del mazo"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={porcentaje}
                  aria-valuetext={`${aprendidas.length} de ${total} palabras aprendidas (${porcentaje} %)`}
                  className="h-3 overflow-hidden rounded-pill border border-borde bg-fondo"
                >
                  <div
                    className="h-full bg-primario transition-[width] duration-[var(--mov-medio)] ease-[var(--mov-curva)]"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
                <p className="text-sm text-texto-suave">
                  {aprendidas.length} de {total} aprendidas ({porcentaje} %)
                </p>
              </div>

              <Tabs
                etiqueta="Estado de las palabras"
                prefijo="progreso"
                activa={pestana}
                onCambiar={(id) => setPestana(id as 'pendientes' | 'aprendidas')}
                pestanas={[
                  { id: 'pendientes', etiqueta: `Pendientes (${pendientes.length})` },
                  { id: 'aprendidas', etiqueta: `Aprendidas (${aprendidas.length})` },
                ]}
              />

              <div role="tabpanel" id={idPanel('progreso', pestana)} aria-labelledby={idTab('progreso', pestana)}>
                {lista.length === 0 ? (
                  <EstadoVacio
                    texto={pestana === 'aprendidas' ? 'Aún no has aprendido ninguna palabra.' : 'No quedan palabras pendientes.'}
                  />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {lista.map((f) => (
                      <li
                        key={f.palabraId}
                        className={`${saliendo === f.palabraId ? "anim-salida pointer-events-none" : "anim-entrada"} flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-md border border-borde bg-superficie p-2`}
                      >
                        <div>
                          <p className="font-semibold">
                            <span lang="en">{nombreDe(f.palabraId)}</span>
                          </p>
                          <p className="text-sm text-texto-suave">{espanolDe(f.palabraId)}</p>
                        </div>
                        {pestana === 'pendientes' ? (
                          <p className="flex items-center gap-1 text-sm">
                            <Icon name="circulo" className="size-4" />
                            Aciertos seguidos: {f.aciertos} de {ACIERTOS_PARA_APRENDER}
                          </p>
                        ) : (
                          <Button
                            variante="secundario"
                            aria-label={`Reactivar «${nombreDe(f.palabraId)}»`}
                            onClick={() => {
                              setSaliendo(f.palabraId)
                              esperarSalida(() => {
                                data.reactivar(mazo.id, f.palabraId)
                                setSaliendo(null)
                              })
                              avisar(`«${nombreDe(f.palabraId)}» vuelve a pendientes de «${mazo.nombre}».`)
                            }}
                          >
                            Reactivar
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
