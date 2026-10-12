import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { currentUser } from '../../mocks'
import { axeViolations } from '../../test/axe'
import { Sidebar } from './Sidebar'

const items = [{ label: 'Proyectos', to: '/', icon: 'folder' as const }]

function setup() {
  return render(
    <MemoryRouter>
      <Sidebar items={items} user={currentUser} />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  it('marca el enlace activo con aria-current', () => {
    setup()
    expect(screen.getByRole('link', { name: 'Proyectos' })).toHaveAttribute('aria-current', 'page')
  })

  it('muestra el usuario', () => {
    setup()
    expect(screen.getByText(currentUser.email)).toBeInTheDocument()
  })

  it('el botón de menú alterna aria-expanded', async () => {
    setup()
    const btn = screen.getByRole('button', { name: 'Abrir menú' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(btn)
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('sin violaciones de axe', async () => {
    const { container } = setup()
    expect(await axeViolations(container)).toEqual([])
  })
})
