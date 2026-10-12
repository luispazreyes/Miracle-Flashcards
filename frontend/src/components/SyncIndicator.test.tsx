import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeViolations } from '../test/axe'
import { SyncIndicator } from './SyncIndicator'

describe('SyncIndicator (F-09)', () => {
  it.each([
    ['synced', 'Sincronizado'],
    ['offline', 'Sin conexión'],
    ['syncing', 'Sincronizando…'],
    ['unsynced', 'Sin sincronizar'],
  ] as const)('estado %s: texto %s y sin violaciones de axe', async (state, text) => {
    const { container } = render(<SyncIndicator state={state} pending={0} onRetry={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent(text)
    expect(await axeViolations(container)).toEqual([])
  })

  it('"Reintentar" solo aparece cuando no está sincronizado y llama a onRetry (RF-22)', async () => {
    const onRetry = vi.fn()
    const { rerender } = render(<SyncIndicator state="synced" pending={0} onRetry={onRetry} />)
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    rerender(<SyncIndicator state="unsynced" pending={3} onRetry={onRetry} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('(3)')
  })
})
