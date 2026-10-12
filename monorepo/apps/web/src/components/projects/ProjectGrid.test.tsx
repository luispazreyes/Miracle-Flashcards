import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { currentUser, projects } from '../../mocks'
import { axeViolations } from '../../test/axe'
import { ProjectGrid } from './ProjectGrid'

const setup = (props: Partial<React.ComponentProps<typeof ProjectGrid>> = {}) =>
  render(
    <MemoryRouter>
      <ProjectGrid projects={projects} users={[currentUser]} {...props} />
    </MemoryRouter>,
  )

describe('ProjectGrid', () => {
  it('lista una tarjeta por proyecto', () => {
    setup()
    expect(screen.getAllByRole('listitem')).toHaveLength(projects.length)
  })

  it('estado de carga', () => {
    setup({ loading: true })
    expect(screen.getByRole('status')).toHaveTextContent('Cargando proyectos')
  })

  it('estado vacío', () => {
    setup({ projects: [] })
    expect(screen.getByText('Aún no tienes proyectos.')).toBeInTheDocument()
  })

  it('estado de error con reintento', async () => {
    const onRetry = vi.fn()
    setup({ error: 'No se pudo cargar.', onRetry })
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar.')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('sin violaciones de axe', async () => {
    const { container } = setup()
    expect(await axeViolations(container)).toEqual([])
  })
})
