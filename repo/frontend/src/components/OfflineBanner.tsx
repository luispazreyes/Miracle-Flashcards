// Banner de modo sin conexión (F-09, BR-39). Se muestra bajo la barra; no bloquea nada.
import { Icon } from './Icon'
import { common } from '../lib/messages.es'

export function OfflineBanner() {
  return (
    <div
      role="status"
      className="flex anim-entrada items-center gap-2 border-b border-borde bg-superficie px-4 py-2 text-sm font-semibold text-aviso"
    >
      <Icon name="cloudOff" />
      <span>{common.offlineBanner}</span>
    </div>
  )
}
