import { render, screen } from '@testing-library/react'
import { axeViolations } from '../../test/axe'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { Button } from './Button'
import { IconButton } from './IconButton'

describe('átomos compartidos', () => {
  it('Button: loading deshabilita y marca aria-busy', () => {
    render(<Button loading>Guardar</Button>)
    const btn = screen.getByRole('button', { name: 'Guardar' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })

  it('Button: por defecto es type=button', () => {
    render(<Button>Ok</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('IconButton: el nombre accesible es label', () => {
    render(<IconButton icon="menu" label="Abrir menú" />)
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument()
  })

  it('Avatar: iniciales con nombre accesible, o imagen con alt', () => {
    const { rerender } = render(<Avatar name="Luis Paz" />)
    expect(screen.getByRole('img', { name: 'Luis Paz' })).toHaveTextContent('LP')
    rerender(<Avatar name="Luis Paz" src="/a.png" />)
    expect(screen.getByAltText('Luis Paz')).toBeInTheDocument()
  })

  it('Badge: muestra texto', () => {
    render(<Badge icon="check" tone="success">Activo</Badge>)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('sin violaciones de axe', async () => {
    const { container } = render(
      <div>
        <Button variant="secondary">Cancelar</Button>
        <IconButton icon="close" label="Cerrar" />
        <Avatar name="Luis Paz" />
        <Badge icon="archive">Archivado</Badge>
      </div>,
    )
    expect(await axeViolations(container)).toEqual([])
  })
})
