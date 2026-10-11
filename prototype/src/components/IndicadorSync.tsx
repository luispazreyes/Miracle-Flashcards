// F-09: indicador de sincronización. Siempre texto + icono, nunca solo color (RF-22, RF-28).
import { MAX_INTENTOS, useSync, type EstadoSync } from '../state/SyncContext'
import { Button } from './Button'
import { Icon, type IconName } from './Icon'

const config: Record<EstadoSync, { texto: string; icono: IconName; color: string; girar?: boolean }> = {
  sincronizado: { texto: 'Sincronizado', icono: 'check', color: 'text-exito' },
  'sin-conexion': { texto: 'Sin conexión', icono: 'nube', color: 'text-texto-suave' },
  sincronizando: { texto: 'Sincronizando…', icono: 'sincronizar', color: 'text-texto-suave', girar: true },
  'sin-sincronizar': { texto: 'Sin sincronizar', icono: 'alerta', color: 'text-aviso' },
}

export function IndicadorSync() {
  const { estado, intento, reintentar } = useSync()
  const { texto, icono, color, girar } = config[estado]

  return (
    <div className="flex items-center gap-2">
      {/* Región viva: el cambio de estado se anuncia sin interrumpir (aria-live polite) */}
      <p role="status" className={`text-sm font-semibold transition-colors ${color}`}>
        {/* key: al cambiar de estado el icono y el texto entran con fundido; la región viva no se recrea */}
        <span key={estado} className="anim-fundido flex items-center gap-1">
          <Icon name={icono} className={`size-4 ${girar ? "animate-spin" : ""}`} />
          <span>
            {texto}
            {estado === "sincronizando" && intento > 1 && ` intento ${intento} de ${MAX_INTENTOS}`}
          </span>
        </span>
      </p>
      {estado === 'sin-sincronizar' && (
        <Button variante="secundario" onClick={reintentar} className="text-sm">
          Reintentar
        </Button>
      )}
    </div>
  )
}
