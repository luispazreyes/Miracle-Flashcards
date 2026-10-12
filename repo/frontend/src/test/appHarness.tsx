// Arnés para pruebas de pantallas con sesión: usuario iniciado, base local lista y acceso a repositorios.
import { screen } from '@testing-library/react'
import type { ServicesOptions } from '../app/services'
import { makeTestServices, renderApp, signIn } from './render'

export async function openApp(
  route: string,
  options: { online?: boolean; heading?: string; services?: ServicesOptions } = {},
) {
  const t = makeTestServices(options.services)
  const session = await signIn(t.services)
  t.net.online = options.online ?? true
  const runtime = t.services.getRuntime(session)
  const utils = { repos: runtime.repos, db: runtime.db, runtime }
  return {
    ...t,
    session,
    ...utils,
    /** Renderiza la ruta y espera a que cargue su título. */
    async render(routeOverride?: string) {
      const view = renderApp(t.services, routeOverride ?? route)
      if (options.heading && !routeOverride)
        await screen.findByRole('heading', { name: options.heading })
      return view
    },
  }
}
