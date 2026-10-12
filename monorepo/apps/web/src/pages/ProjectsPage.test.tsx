import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { projects } from '../mocks'
import { axeViolations } from '../test/axe'
import { ProjectsPage } from './ProjectsPage'

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <ProjectsPage />
    </MemoryRouter>,
  )

describe('ProjectsPage', () => {
  it('muestra el título y un proyecto por mock', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Proyectos' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(projects.length)
  })

  it('sin violaciones de axe', async () => {
    const { container } = setup()
    expect(await axeViolations(container)).toEqual([])
  })
})
