// AppShell (Fase 5): navegación, salto al contenido, indicador de sincronización y cierre de sesión (BR-35).
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeViolations } from '../test/axe'
import { makeTestServices, renderApp, signIn } from '../test/render'

async function setup(online = true) {
  const t = makeTestServices()
  const session = await signIn(t.services)
  t.net.online = online
  const utils = renderApp(t.services, '/mazos')
  await screen.findByRole('heading', { name: 'Mazos' })
  return { ...t, session, ...utils }
}

describe('AppShell', () => {
  it('muestra la navegación con la pantalla actual marcada (aria-current)', async () => {
    await setup()
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(nav).getByRole('link', { name: 'Mazos' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Progreso' })).not.toHaveAttribute('aria-current')
  })

  it('el enlace "Saltar al contenido" apunta al contenido principal', async () => {
    await setup()
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute(
      'href',
      '#contenido',
    )
    expect(document.getElementById('contenido')).toBeInTheDocument()
  })

  it('al navegar, el foco pasa al título de la pantalla (RF-44)', async () => {
    await setup()
    await userEvent.setup().click(screen.getByRole('link', { name: 'Ajustes' }))
    const title = await screen.findByRole('heading', { name: 'Ajustes' })
    await waitFor(() => expect(title).toHaveFocus())
  })

  it('el indicador de sincronización queda en "Sincronizado" con la cola vacía', async () => {
    await setup()
    await waitFor(() => expect(screen.getByText('Sincronizado')).toBeInTheDocument())
  })

  it('sin conexión muestra el banner y el indicador "Sin conexión" (BR-39)', async () => {
    await setup(false)
    expect(
      await screen.findByText('Sin conexión. Tus cambios se guardan en este dispositivo.'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('Sin conexión', { selector: 'span' })).toBeInTheDocument(),
    )
  })

  it('cierra sesión directamente cuando no hay nada sin sincronizar (BR-35)', async () => {
    const { services } = await setup()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(services.auth.getSession()).toBeNull()
  })

  it('EC-43: con cambios sin sincronizar pide confirmación y advierte la pérdida', async () => {
    const { services, session } = await setup(false)
    await services.getRuntime(session).repos.decks.create('Pendiente')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(
      within(dialog).getByText('Tienes cambios sin sincronizar. Si cierras sesión, se perderán.'),
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(services.auth.getSession()).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Cerrar sesión igualmente',
      }),
    )
    expect(await screen.findByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(services.auth.getSession()).toBeNull()
  })

  it('ruta desconocida: página no encontrada con salida a mazos', async () => {
    const { services } = makeTestServices()
    await signIn(services)
    renderApp(services, '/no-existe')
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
  })

  it('muestra "Instalar app" solo cuando el navegador lo permite (F-09) y lanza la instalación', async () => {
    await setup()
    expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Instalar app' }))
    expect(prompt).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument(),
    )
  })

  it('axe: sin violaciones en el shell', async () => {
    const { container } = await setup()
    expect(await axeViolations(container)).toEqual([])
  })
})
