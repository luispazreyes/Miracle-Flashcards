import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { currentUser, projects } from '../../mocks'
import { axeViolations } from '../../test/axe'
import { ProjectCard } from './ProjectCard'

const setup = (i = 0) =>
  render(
    <MemoryRouter>
      <ProjectCard project={projects[i]!} owner={currentUser} />
    </MemoryRouter>,
  )

describe('ProjectCard', () => {
  it('es un enlace al proyecto con su nombre', () => {
    setup()
    expect(screen.getByRole('link', { name: /Inglés de viaje/ })).toHaveAttribute('href', '/proyectos/p-1')
  })

  it('expone el progreso de forma accesible', () => {
    setup()
    expect(screen.getByRole('progressbar', { name: 'Progreso de Inglés de viaje' })).toHaveAttribute(
      'aria-valuenow',
      '65',
    )
    expect(screen.getByText('78/120 aprendidas (65 %)')).toBeInTheDocument()
  })

  it('el estado archivado lleva texto', () => {
    setup(3)
    expect(screen.getByText('Archivado')).toBeInTheDocument()
  })

  it('sin violaciones de axe', async () => {
    const { container } = setup()
    expect(await axeViolations(container)).toEqual([])
  })
})
