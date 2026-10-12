import type { Project, User } from '../../mocks'
import { Button } from '../ui/Button'
import { ProjectCard } from './ProjectCard'

interface Props {
  projects: Project[]
  users: User[]
  loading?: boolean
  error?: string
  onRetry?: () => void
}

export function ProjectGrid({ projects, users, loading = false, error, onRetry }: Props) {
  if (loading) {
    return (
      <p role="status" className="text-texto-suave">
        Cargando proyectos…
      </p>
    )
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-md border-2 border-error bg-superficie p-3 text-texto">
        <p>
          <strong className="text-error">Error:</strong> {error}
        </p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    )
  }

  if (projects.length === 0) {
    return <p className="text-texto-suave">Aún no tienes proyectos.</p>
  }

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const owner = users.find((u) => u.id === project.ownerId)
        return (
          <li key={project.id}>
            {owner ? <ProjectCard project={project} owner={owner} /> : null}
          </li>
        )
      })}
    </ul>
  )
}
