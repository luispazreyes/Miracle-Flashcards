// Indicador de sincronización (F-09, RF-22): siempre texto + icono, nunca solo color. "Sin sincronizar" ofrece
// "Reintentar". Los cambios de estado se anuncian con aria-live="polite".
import type { SyncState } from '../data/sync/engine'
import { Button } from './Button'
import { Icon, type IconName } from './Icon'

const config: Record<SyncState, { text: string; icon: IconName; color: string }> = {
  synced: { text: 'Sincronizado', icon: 'checkCircle', color: 'text-exito' },
  offline: { text: 'Sin conexión', icon: 'cloudOff', color: 'text-texto-suave' },
  syncing: { text: 'Sincronizando…', icon: 'sync', color: 'text-texto-suave' },
  unsynced: { text: 'Sin sincronizar', icon: 'alert', color: 'text-aviso' },
}

interface Props {
  state: SyncState
  pending: number
  onRetry: () => void
}

export function SyncIndicator({ state, pending, onRetry }: Props) {
  const { text, icon, color } = config[state]
  return (
    <div className="flex items-center gap-2">
      <p role="status" className={`text-sm font-semibold ${color}`}>
        {/* Cambia la clave, no el <p>: el aviso se anuncia y el contenido entra con un fundido (RF-44). */}
        <span key={state} className="flex anim-fundido items-center gap-1">
          <Icon name={icon} className={state === 'syncing' ? 'size-5 animate-spin' : 'size-5'} />
          <span>{text}</span>
          {pending > 0 && state !== 'synced' && (
            <span className="font-normal text-texto-suave">
              <span className="sr-only">, </span>({pending})
            </span>
          )}
        </span>
      </p>
      {state === 'unsynced' && (
        <Button variant="secondary" onClick={onRetry} className="py-1 text-sm">
          Reintentar
        </Button>
      )}
    </div>
  )
}
