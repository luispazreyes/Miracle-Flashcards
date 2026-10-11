import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SyncProvider, useSync, type EstadoSync } from '../state/SyncContext'
import { AppShell } from './AppShell'

const Pantalla = ({ titulo }: { titulo: string }) => (
  <h1 tabIndex={-1}>{titulo}</h1>
)

function Forzar({ estado }: { estado: EstadoSync }) {
  const { forzar } = useSync()
  return <button onClick={() => forzar(estado)}>forzar</button>
}

function montar(estado: EstadoSync) {
  return render(
    <MemoryRouter initialEntries={['/mazos']}>
      <SyncProvider>
        <Forzar estado={estado} />
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/mazos" element={<Pantalla titulo="Mazos" />} />
            <Route path="/progreso" element={<Pantalla titulo="Progreso" />} />
          </Route>
        </Routes>
      </SyncProvider>
    </MemoryRouter>,
  )
}

describe('AppShell + indicador de sincronización', () => {
  it.each<EstadoSync>(['sincronizado', 'sin-conexion', 'sincronizando', 'sin-sincronizar'])(
    'sin violaciones axe en estado %s',
    async (estado) => {
      const { container } = montar(estado)
      await userEvent.click(screen.getByText('forzar'))
      const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
      expect(r.violations).toEqual([])
    },
  )

  it('sin conexión: muestra el banner y el texto del indicador', async () => {
    montar('sin-conexion')
    await userEvent.click(screen.getByText('forzar'))
    expect(screen.getAllByText(/Sin conexión/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Sin conexión. Tus cambios se guardan en este dispositivo.')).toBeInTheDocument()
  })

  it('sin sincronizar: ofrece "Reintentar" y vuelve a sincronizar', async () => {
    montar('sin-sincronizar')
    await userEvent.click(screen.getByText('forzar'))
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(screen.getByText('Sincronizando…')).toBeInTheDocument()
  })

  it('navegación: marca la página actual y mueve el foco al título', async () => {
    montar('sincronizado')
    expect(screen.getByRole('link', { name: 'Mazos' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('link', { name: 'Progreso' }))
    expect(screen.getByRole('heading', { name: 'Progreso' })).toHaveFocus()
  })
})
