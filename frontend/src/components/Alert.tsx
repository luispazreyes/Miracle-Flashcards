import type { ReactNode, Ref } from 'react'
import { Icon, type IconName } from './Icon'

type Kind = 'info' | 'success' | 'error' | 'warning'

const config: Record<Kind, { icon: IconName; color: string }> = {
  info: { icon: 'info', color: 'text-texto' },
  success: { icon: 'check', color: 'text-exito' },
  error: { icon: 'error', color: 'text-error' },
  warning: { icon: 'alert', color: 'text-aviso' },
}

interface Props {
  kind: Kind
  /** "alert" solo para errores; "status" para el resto (prototype-spec §A.7). */
  role?: 'status' | 'alert'
  children: ReactNode
  alertRef?: Ref<HTMLDivElement>
}

export function Alert({
  kind,
  role = kind === 'error' ? 'alert' : 'status',
  children,
  alertRef,
}: Props) {
  const { icon, color } = config[kind]
  return (
    <div
      ref={alertRef}
      role={role}
      tabIndex={-1}
      className={`flex anim-entrada items-start gap-3 rounded-md border-2 border-current bg-superficie p-3 ${color}`}
    >
      <Icon name={icon} />
      <div className="text-texto">{children}</div>
    </div>
  )
}
