// /mazos — F-02 (mazos) + F-03 (palabras) + F-04 (formulario). Dos paneles ≥ 768 px; pestañas en móvil.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, idPanel, idTab } from '../../components/Tabs'
import { useToast } from '../../components/Toast'
import { useTitulo } from '../../lib/texto'
import { useData, type Palabra } from '../../state/DataContext'
import { PanelPalabras } from '../palabras/PanelPalabras'
import { ListaMazos } from './ListaMazos'

/** true a partir de --bp-m (768 px). */
function useEscritorio() {
  const consulta = '(min-width: 48rem)'
  const [v, setV] = useState(() => window.matchMedia?.(consulta).matches ?? true)
  useEffect(() => {
    const m = window.matchMedia?.(consulta)
    if (!m) return
    const f = () => setV(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return v
}

export function MazosPage() {
  useTitulo('Mazos')
  const data = useData()
  const { avisar } = useToast()
  const [params, setParams] = useSearchParams()
  const [pestana, setPestana] = useState<'mazos' | 'palabras'>('mazos')
  const [arrastrando, setArrastrando] = useState<Palabra | null>(null)
  const [anuncio, setAnuncio] = useState('')
  const esEscritorio = useEscritorio()

  const idMazo = params.get('mazo')
  const seleccionado = data.mazos.some((m) => m.id === idMazo) ? idMazo : null

  function seleccionar(id: string | null) {
    setParams(id ? { mazo: id } : {}, { replace: true })
    const nombre = data.mazos.find((m) => m.id === id)?.nombre
    setAnuncio(nombre ? `Mazo «${nombre}» seleccionado.` : 'Todas las palabras.')
    if (!esEscritorio) setPestana('palabras')
  }

  function soltar(mazoId: string) {
    if (!arrastrando) return
    const mazo = data.mazos.find((m) => m.id === mazoId)
    if (!mazo) return
    if (data.agregarAMazo(arrastrando.id, mazoId) === 'duplicado') {
      avisar(`«${arrastrando.ingles}» ya está en este mazo.`, 'error')
    } else {
      avisar(`«${arrastrando.ingles}» agregada a «${mazo.nombre}».`)
    }
    setArrastrando(null)
  }

  const verMazos = esEscritorio || pestana === 'mazos'
  const verPalabras = esEscritorio || pestana === 'palabras'

  return (
    <div className="flex flex-col gap-4">
      <h1 tabIndex={-1} className="text-xl font-semibold">
        Mis mazos y palabras
      </h1>

      {!esEscritorio && (
        <Tabs
          etiqueta="Secciones"
          prefijo="mazos"
          activa={pestana}
          onCambiar={(id) => setPestana(id as 'mazos' | 'palabras')}
          pestanas={[
            { id: 'mazos', etiqueta: 'Mazos' },
            { id: 'palabras', etiqueta: 'Palabras' },
          ]}
        />
      )}

      <div className="md:grid md:grid-cols-[var(--ancho-panel-mazos)_1fr] md:items-start md:gap-6">
        <div
          id={idPanel('mazos', 'mazos')}
          hidden={!verMazos}
          role={esEscritorio ? undefined : 'tabpanel'}
          aria-labelledby={esEscritorio ? undefined : idTab('mazos', 'mazos')}
          className="md:sticky md:top-28 md:max-h-[calc(100dvh-8rem)] md:overflow-y-auto md:pr-1"
        >
          <ListaMazos
            seleccionado={seleccionado}
            onSeleccionar={seleccionar}
            arrastrando={!!arrastrando}
            onSoltar={soltar}
          />
        </div>
        <div
          id={idPanel('mazos', 'palabras')}
          hidden={!verPalabras}
          role={esEscritorio ? undefined : 'tabpanel'}
          aria-labelledby={esEscritorio ? undefined : idTab('mazos', 'palabras')}
        >
          <PanelPalabras
            mazoId={seleccionado}
            esEscritorio={esEscritorio}
            onArrastreInicio={setArrastrando}
            onArrastreFin={() => setArrastrando(null)}
            anunciar={setAnuncio}
          />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
    </div>
  )
}
