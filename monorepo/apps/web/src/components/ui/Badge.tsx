// Insignia de estado: siempre icono + texto, nunca solo color (WCAG 1.4.1).
import { Icon, type IconName } from './Icon'

export type BadgeTone = 'neutral' | 'warning' | 'success'

const tones: Record<BadgeTone, string> = {
  neutral: 'text-texto border-borde',
  warning: 'text-aviso border-aviso',
  success: 'text-exito border-exito',
}

interface Props {
  icon: IconName
  tone?: BadgeTone
  children: string
}

export function Badge({ icon, tone = 'neutral', children }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill border px-2 text-sm font-semibold ${tones[tone]}`}
    >
      <Icon name={icon} className="size-4" />
      {children}
    </span>
  )
}
