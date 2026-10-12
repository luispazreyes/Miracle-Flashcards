// Utilidades de prueba de la app completa: servicios simulados en memoria y router en memoria.
import { render } from '@testing-library/react'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider, ServicesProvider } from '../app/context'
import { createTestRouter } from '../app/router'
import { createServices, type Services, type ServicesOptions } from '../app/services'
import { ToastProvider } from '../components/Toast'
import { MockServer } from '../data/remote/mock/server'
import { memoryStorage } from './devices'

export function makeTestServices(options: ServicesOptions = {}) {
  const storage = memoryStorage()
  const net = { online: true }
  const server = new MockServer(storage)
  const services = createServices({
    mode: 'mock',
    storage,
    server,
    isOnline: () => net.online,
    random: () => 0.5,
    checkImage: async () => true,
    ...options,
  })
  return { services, storage, net, server }
}

let counter = 0
/** Correo único por prueba: cada correo es una cuenta (y una base local) distinta. */
export const uniqueEmail = () =>
  `ana${++counter}-${Math.random().toString(36).slice(2)}@example.com`

/** Inicia sesión sin pasar por la pantalla (envío del enlace + consumo del token). */
export async function signIn(services: Services, email = uniqueEmail()) {
  await services.auth.requestMagicLink(email)
  return services.auth.consumeLink(services.auth.devInbox!(email)!)
}

export function renderApp(services: Services, route = '/mazos') {
  const router = createTestRouter(services, [route])
  const utils = render(
    <ServicesProvider services={services}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </ServicesProvider>,
  )
  return { ...utils, router }
}
