import { Link } from 'react-router'
import type { Project, User } from '../../mocks'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'

interface Props {
  project: Project
  owner: User
}

export function ProjectCard({ project, owner }: Props) {
  const { id, name, description, status, deckCount, wordCount, learnedCount } = project
  const percent = wordCount === 0 ? 0 : Math.round((learnedCount / wordCount) * 100)
  const active = status === 'active'

  return (
    <Link
      to={`/proyectos/${id}`}
      className="flex h-full flex-col gap-3 rounded-lg border border-borde bg-superficie p-4 shadow-1 hover:bg-fondo"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{name}</h2>
        <Badge icon={active ? 'checkCircle' : 'archive'} tone={active ? 'success' : 'neutral'}>
          {active ? 'Activo' : 'Archivado'}
        </Badge>
      </div>

      <p className="text-texto-suave">{description}</p>

      <p className="text-sm text-texto-suave">
        {deckCount} {deckCount === 1 ? 'mazo' : 'mazos'} · {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}
      </p>

      <div className="mt-auto flex flex-col gap-1">
        <div
          role="progressbar"
          aria-label={`Progreso de ${name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${learnedCount} de ${wordCount} palabras aprendidas`}
          className="h-3 overflow-hidden rounded-pill border border-borde bg-fondo"
        >
          <div className="h-full bg-primario" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-sm text-texto-suave">
          {learnedCount}/{wordCount} aprendidas ({percent} %)
        </p>
      </div>

      <div className="flex items-center gap-2 border-t border-borde pt-3 text-sm text-texto-suave">
        <Avatar name={owner.name} src={owner.avatarUrl} size="sm" />
        <span>{owner.name}</span>
      </div>
    </Link>
  )
}
