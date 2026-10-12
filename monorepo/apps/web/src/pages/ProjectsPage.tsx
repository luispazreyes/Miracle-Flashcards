import { Sidebar, type SidebarItem } from '../components/layout/Sidebar'
import { ProjectGrid } from '../components/projects/ProjectGrid'
import { currentUser, projects } from '../mocks'

const navItems: SidebarItem[] = [{ label: 'Proyectos', to: '/', icon: 'folder' }]

export function ProjectsPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar items={navItems} user={currentUser} />
      <main className="mx-auto w-full max-w-(--ancho-contenido) flex-1 p-4 md:p-8">
        <h1 className="mb-6 text-xl font-semibold">Proyectos</h1>
        <ProjectGrid projects={projects} users={[currentUser]} />
      </main>
    </div>
  )
}
