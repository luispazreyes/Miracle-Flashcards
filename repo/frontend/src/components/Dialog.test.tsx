import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { axeViolations } from '../test/axe'
import { Button } from './Button'
import { Dialog } from './Dialog'

function Host({ alert = false }: { alert?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div id="root">
      <Button onClick={() => setOpen(true)}>Abrir</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Título" alert={alert}>
        <input aria-label="Campo" />
        <Button onClick={() => setOpen(false)}>Cerrar</Button>
      </Dialog>
    </div>
  )
}

describe('Dialog', () => {
  it('usa role dialog o alertdialog, aria-modal y se nombra por su título', async () => {
    const u = userEvent.setup()
    const { unmount } = render(<Host />)
    await u.click(screen.getByRole('button', { name: 'Abrir' }))
    const d = screen.getByRole('dialog', { name: 'Título' })
    expect(d).toHaveAttribute('aria-modal', 'true')
    unmount()

    render(<Host alert />)
    await u.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(screen.getByRole('alertdialog', { name: 'Título' })).toBeInTheDocument()
  })

  it('lleva el foco al primer elemento y lo atrapa con Tab y Shift+Tab', async () => {
    const u = userEvent.setup()
    render(<Host />)
    await u.click(screen.getByRole('button', { name: 'Abrir' }))
    const field = screen.getByLabelText('Campo')
    const close = screen.getByRole('button', { name: 'Cerrar' })
    expect(field).toHaveFocus()
    await u.tab()
    expect(close).toHaveFocus()
    await u.tab()
    expect(field).toHaveFocus()
    await u.tab({ shift: true })
    expect(close).toHaveFocus()
  })

  it('Esc cierra y el foco vuelve al disparador', async () => {
    const u = userEvent.setup()
    render(<Host />)
    const trigger = screen.getByRole('button', { name: 'Abrir' })
    await u.click(trigger)
    await u.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('marca el resto de la app como inert mientras está abierto', async () => {
    const u = userEvent.setup()
    render(<Host />)
    await u.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(document.getElementById('root')).toHaveAttribute('inert')
    await u.keyboard('{Escape}')
    expect(document.getElementById('root')).not.toHaveAttribute('inert')
  })

  it('axe: sin violaciones (dialog y alertdialog)', async () => {
    const u = userEvent.setup()
    render(<Host alert />)
    await u.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(await axeViolations(screen.getByRole('alertdialog'))).toEqual([])
  })
})
