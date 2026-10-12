// Router de datos (frontend-specs.md §6.1, D-10). Las URLs visibles van en español.
import {
  createBrowserRouter,
  createMemoryRouter,
  Link,
  redirect,
  useRouteError,
  type RouteObject,
} from 'react-router'
import { PageTitle } from '../components/PageTitle'
import { ErrorState } from '../components/StateViews'
import { AccessPage } from '../features/access/AccessPage'
import { DecksPage } from '../features/decks/DecksPage'
import { ProgressPage } from '../features/progress/ProgressPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { StudyPage } from '../features/study/StudyPage'
import { common, shell } from '../lib/messages.es'
import { AppShell } from './AppShell'
import type { Services } from './services'

function RouteError() {
  const error = useRouteError()
  if (import.meta.env.DEV) console.error(error)
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <PageTitle>{shell.routeErrorTitle}</PageTitle>
      <ErrorState text={common.genericError} onRetry={() => window.location.reload()} />
      <Link to="/mazos" className="font-semibold text-primario underline">
        {shell.backToDecks}
      </Link>
    </main>
  )
}

function RouteLoading() {
  return (
    <p role="status" aria-busy="true" className="p-4">
      {common.loading}
    </p>
  )
}

function NotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <PageTitle>{shell.notFoundTitle}</PageTitle>
      <p>{shell.notFoundText}</p>
      <Link to="/mazos" className="font-semibold text-primario underline">
        {shell.backToDecks}
      </Link>
    </main>
  )
}

export function appRoutes(services: Services): RouteObject[] {
  return [
    {
      path: '/acceso',
      // RF-41: con sesión local no se pasa por el acceso, tampoco sin conexión.
      loader: () => (services.auth.getSession() ? redirect('/mazos') : null),
      element: <AccessPage />,
      hydrateFallbackElement: <RouteLoading />,
      errorElement: <RouteError />,
    },
    {
      path: '/',
      // Guardia de sesión: solo mira la sesión local, nunca la red (BR-34).
      loader: () => (services.auth.getSession() ? null : redirect('/acceso')),
      element: <AppShell />,
      hydrateFallbackElement: <RouteLoading />,
      errorElement: <RouteError />,
      children: [
        { index: true, loader: () => redirect('/mazos') },
        { path: 'mazos', element: <DecksPage /> },
        {
          path: 'estudio/:deckId',
          // Si el mazo ya no existe, de vuelta a la lista (RF-35).
          loader: async ({ params }) => {
            const session = services.auth.getSession()
            if (!session) return redirect('/acceso')
            const deck = await services.getRuntime(session).repos.decks.get(params.deckId ?? '')
            return deck ? null : redirect('/mazos')
          },
          element: <StudyPage />,
        },
        { path: 'progreso', element: <ProgressPage /> },
        { path: 'ajustes', element: <SettingsPage /> },
      ],
    },
    { path: '*', element: <NotFound /> },
  ]
}

export const createAppRouter = (services: Services) => createBrowserRouter(appRoutes(services))
export const createTestRouter = (services: Services, initialEntries: string[]) =>
  createMemoryRouter(appRoutes(services), { initialEntries })
