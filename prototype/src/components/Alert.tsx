import type { ReactNode, Ref } from 'react'
import { Icon, type IconName } from './Icon'

type Tipo = 'info' | 'exito' | 'error' | 'aviso'

const config: Record<Tipo, { icono: IconName; color: string }> = {
  info: { icono: 'info', color: 'text-texto' },
  exito: { icono: 'check', color: 'text-exito' },
  error: { icono: 'error', color: 'text-error' },
  aviso: { icono: 'alerta', color: 'text-aviso' },
}

interface Props {
  tipo: Tipo
  /** "alert" solo para errores; "status" para el resto (§A.7). */
  role?: 'status' | 'alert'
  children: ReactNode
  alertRef?: Ref<HTMLDivElement>
}

export function Alert({ tipo, role = tipo === 'error' ? 'alert' : 'status', children, alertRef }: Props) {
  const { icono, color } = config[tipo]
  return (
    <div
      ref={alertRef}
      role={role}
      tabIndex={-1}
      className={`anim-entrada flex items-start gap-3 rounded-md border-2 border-current bg-superficie p-3 ${color}`}
    >
      <Icon name={icono} />
      <div className="text-texto">{children}</div>
    </div>
  )
}
