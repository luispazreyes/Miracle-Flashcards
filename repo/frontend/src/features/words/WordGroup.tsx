// Grupo del panel (BR-22, BR-24): sección con encabezado, icono, etiqueta de texto y contador; nunca solo color.
import type { ReactNode } from 'react'
import { Icon, type IconName } from '../../components/Icon'
import type { GroupKind } from '../../domain'
import { words as t } from '../../lib/messages.es'

const meta: Record<Exclude<GroupKind, 'all'>, { icon: IconName; label: string; bg: string }> = {
  deck: { icon: 'checkCircle', label: t.groupDeck, bg: 'bg-grupo-mazo' },
  others: { icon: 'folder', label: t.groupOthers, bg: 'bg-grupo-otros' },
  none: { icon: 'dash', label: t.groupNone, bg: 'bg-grupo-sin' },
}

interface Props {
  kind: Exclude<GroupKind, 'all'>
  count: number
  id: string
  children: ReactNode
}

export function WordGroup({ kind, count, id, children }: Props) {
  const { icon, label, bg } = meta[kind]
  return (
    <section aria-labelledby={id} className={`flex flex-col gap-2 rounded-md p-2 ${bg}`}>
      <h3 id={id} className="flex items-center gap-2 font-semibold">
        <Icon name={icon} />
        <span>{label}</span>
        <span className="font-normal">({count})</span>
      </h3>
      {children}
    </section>
  )
}
