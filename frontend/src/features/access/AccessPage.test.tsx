// F-01 (Fase 5): EC-01, EC-03, EC-42, EC-50 y estados de la pantalla.
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeViolations } from '../../test/axe'
import { makeTestServices, renderApp, signIn, uniqueEmail } from '../../test/render'

const emailBox = () => screen.getByLabelText(/correo electrónico/i)

/** Abre la pantalla y espera a que el router cargue el formulario. */
async function open(services: ReturnType<typeof makeTestServices>['services'], route = '/acceso') {
  const utils = renderApp(services, route)
  await screen.findByLabelText(/correo electrónico/i)
  return utils
}

describe('AccessPage', () => {
  it('sin sesión, /mazos lleva al acceso y el foco va al campo de correo', async () => {
    const { services } = makeTestServices()
    renderApp(services, '/mazos')
    expect(await screen.findByRole('heading', { name: 'Miracle Flashcards' })).toBeInTheDocument()
    await waitFor(() => expect(emailBox()).toHaveFocus())
  })

  it('EC-01: un correo inválido no se envía y se indica en línea', async () => {
    const { services } = makeTestServices()
    const spy = vi.spyOn(services.auth, 'requestMagicLink')
    await open(services)
    const user = userEvent.setup()
    await user.type(emailBox(), 'ana@')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de acceso' }))
    expect(await screen.findByText('Escribe un correo válido.')).toBeInTheDocument()
    expect(emailBox()).toHaveAttribute('aria-invalid', 'true')
    expect(emailBox()).toHaveFocus()
    expect(spy).not.toHaveBeenCalled()
  })

  it('al enviar muestra la confirmación, mueve el foco y bloquea el botón', async () => {
    const { services } = makeTestServices()
    await open(services)
    const user = userEvent.setup()
    await user.type(emailBox(), uniqueEmail())
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de acceso' }))
    const confirm = await screen.findByText(/Revisa tu correo/)
    await waitFor(() => expect(confirm.closest('[role="status"]')).toHaveFocus())
    expect(screen.getByRole('button', { name: /Reenviar enlace/ })).toBeDisabled()
  })

  it('EC-50: cuenta regresiva de 60 s anunciada cada 10 s y luego "Reenviar enlace"', async () => {
    const { services } = makeTestServices()
    await open(services)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // El contador se reprograma en cada render: se avanza de segundo en segundo.
    const advance = (ms: number) => {
      for (let t = 0; t < ms; t += 1000)
        act(() => {
          vi.advanceTimersByTime(1000)
        })
    }
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      await user.type(emailBox(), uniqueEmail())
      await user.click(screen.getByRole('button', { name: 'Enviar enlace de acceso' }))
      expect(await screen.findByText(/Podrás pedir otro enlace en 60 segundos/)).toBeInTheDocument()

      advance(5000)
      expect(screen.getByText(/en 60 segundos/)).toBeInTheDocument() // sin anunciar cada segundo
      advance(6000)
      expect(screen.getByText(/en 50 segundos/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Reenviar enlace/ })).toBeDisabled()

      advance(50_000)
      expect(screen.getByText('Ya puedes pedir otro enlace.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reenviar enlace' })).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('con el enlace recibido inicia sesión y abre /mazos', async () => {
    const { services } = makeTestServices()
    await open(services)
    const user = userEvent.setup()
    await user.type(emailBox(), uniqueEmail())
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de acceso' }))
    await user.click(await screen.findByRole('link', { name: 'Abrir el enlace de acceso' }))
    expect(await screen.findByRole('heading', { name: 'Mazos' })).toBeInTheDocument()
    expect(services.auth.getSession()).not.toBeNull()
  })

  it('EC-03: un enlace inválido no inicia sesión y ofrece solicitar uno nuevo', async () => {
    const { services } = makeTestServices()
    renderApp(services, '/acceso?token=alterado')
    expect(await screen.findByText('Este enlace ya no es válido.')).toBeInTheDocument()
    expect(services.auth.getSession()).toBeNull()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Solicitar enlace nuevo' }))
    expect(await screen.findByLabelText(/correo electrónico/i)).toBeInTheDocument()
  })

  it('primer acceso sin conexión: mensaje claro y nada se envía (EC-42)', async () => {
    const { services, net } = makeTestServices()
    net.online = false
    const spy = vi.spyOn(services.auth, 'requestMagicLink')
    await open(services)
    const user = userEvent.setup()
    await user.type(emailBox(), uniqueEmail())
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de acceso' }))
    expect(
      await screen.findByText('Necesitas conexión para iniciar sesión por primera vez.'),
    ).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalled()
  })

  it('error de envío: mensaje genérico y se puede reintentar', async () => {
    const { services } = makeTestServices()
    ;(services.auth as unknown as { failNextSend: boolean }).failNextSend = true
    await open(services)
    const user = userEvent.setup()
    await user.type(emailBox(), uniqueEmail())
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de acceso' }))
    expect(await screen.findByText(/No se pudo enviar el enlace/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de acceso' }))
    expect(await screen.findByText(/Revisa tu correo/)).toBeInTheDocument()
  })

  it('EC-42: con sesión local y sin conexión, /mazos y /acceso no pasan por el acceso', async () => {
    const { services, net } = makeTestServices()
    await signIn(services)
    net.online = false
    renderApp(services, '/acceso')
    expect(await screen.findByRole('heading', { name: 'Mazos' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/correo electrónico/i)).not.toBeInTheDocument()
  })

  it('axe: sin violaciones en el formulario y en el enlace inválido', async () => {
    const { services } = makeTestServices()
    const { container, unmount } = renderApp(services, '/acceso')
    await screen.findByLabelText(/correo electrónico/i)
    expect(await axeViolations(container)).toEqual([])
    unmount()
    const second = renderApp(services, '/acceso?token=x')
    await screen.findByText('Este enlace ya no es válido.')
    expect(await axeViolations(second.container)).toEqual([])
  })
})
