// Solo prototipo: permite revisar estados, tema y sesión sin backend. No forma parte del producto.
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { useData, type ModoDatos } from '../state/DataContext'
import { usePrefs, type Tema } from '../state/PrefsContext'
import { useSync, type EstadoSync } from '../state/SyncContext'

export const ESTADOS_ACCESO = [
  { valor: 'inicial', etiqueta: 'Inicial' },
  { valor: 'enviando', etiqueta: 'Enviando' },
  { valor: 'enviado', etiqueta: 'Enviado (cuenta regresiva)' },
  { valor: 'enlace-invalido', etiqueta: 'Enlace caducado / usado' },
  { valor: 'sin-conexion', etiqueta: 'Sin conexión (primer acceso)' },
  { valor: 'error-envio', etiqueta: 'Error de envío' },
]

const ESTADOS_SYNC: { valor: EstadoSync; etiqueta: string }[] = [
  { valor: 'sincronizado', etiqueta: 'Sincronizado' },
  { valor: 'sin-conexion', etiqueta: 'Sin conexión' },
  { valor: 'sincronizando', etiqueta: 'Sincronizando' },
  { valor: 'sin-sincronizar', etiqueta: 'Sin sincronizar' },
]

const MODOS_DATOS: { valor: ModoDatos; etiqueta: string }[] = [
  { valor: 'ejemplo', etiqueta: 'Datos de ejemplo' },
  { valor: 'vacio', etiqueta: 'Vacío (sin mazos ni palabras)' },
  { valor: 'cargando', etiqueta: 'Cargando' },
  { valor: 'error', etiqueta: 'Error de carga' },
]

const campo = 'objetivo-min rounded-md border border-borde bg-fondo px-2 text-texto'
const etiqueta = 'flex flex-col gap-1 font-semibold'

export function PanelPrototipo() {
  const { haySesion, iniciarSesion, cerrarSesion } = useAuth()
  const { estado: sync, forzar, simularFallo } = useSync()
  const data = useData()
  const prefs = usePrefs()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  return (
    <details className="fixed bottom-2 right-2 z-40 max-w-[calc(100vw-1rem)] rounded-md border border-borde bg-superficie text-sm shadow-2">
      <summary className="objetivo-min flex cursor-pointer items-center px-3 font-semibold">
        Panel del prototipo
      </summary>
      <div className="flex max-h-[70dvh] flex-col gap-3 overflow-y-auto p-3">
        <p className="text-texto-suave">Solo para revisión; no es parte del producto.</p>
        {pathname === '/acceso' && (
          <label className={etiqueta}>
            Estado de Acceso
            <select
              className={campo}
              value={params.get('estado') ?? 'inicial'}
              onChange={(e) => setParams(e.target.value === 'inicial' ? {} : { estado: e.target.value })}
            >
              {ESTADOS_ACCESO.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.etiqueta}
                </option>
              ))}
            </select>
          </label>
        )}
        {haySesion && (
          <>
            <label className={etiqueta}>
              Datos
              <select className={campo} value={data.modo} onChange={(e) => data.setModo(e.target.value as ModoDatos)}>
                {MODOS_DATOS.map((e) => (
                  <option key={e.valor} value={e.valor}>
                    {e.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <label className={etiqueta}>
              Sincronización
              <select className={campo} value={sync} onChange={(e) => forzar(e.target.value as EstadoSync)}>
                {ESTADOS_SYNC.map((e) => (
                  <option key={e.valor} value={e.valor}>
                    {e.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={`${campo} font-semibold`} onClick={simularFallo}>
              Simular fallo de sincronización (5 reintentos)
            </button>
            <label className="flex objetivo-min items-center gap-2 font-semibold">
              <input
                type="checkbox"
                className="size-5"
                checked={data.simularFalloGuardado}
                onChange={(e) => data.setSimularFalloGuardado(e.target.checked)}
              />
              Simular fallo al guardar palabra
            </label>
          </>
        )}
        <label className={etiqueta}>
          Tema
          <select className={campo} value={prefs.tema} onChange={(e) => prefs.cambiar('tema', e.target.value as Tema)}>
            <option value="blanco">Blanco</option>
            <option value="azul">Azul</option>
            <option value="oscuro">Oscuro</option>
          </select>
        </label>
        <button
          type="button"
          className={`${campo} font-semibold`}
          onClick={() => {
            if (haySesion) {
              cerrarSesion()
              navigate('/acceso')
            } else {
              iniciarSesion() // simula abrir el enlace mágico
              navigate('/mazos')
            }
          }}
        >
          {haySesion ? 'Simular: cerrar sesión' : 'Simular: abrir enlace mágico'}
        </button>
      </div>
    </details>
  )
}
