// Estructura de las pantallas con sesión (F-09): barra superior, navegación, indicador de sincronización,
// salto al contenido, banner sin conexión y avisos del motor de sincronización.
import { useEffect, useRef } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { Button } from '../components/Button'
import { InstallApp } from '../components/InstallApp'
import { OfflineBanner } from '../components/OfflineBanner'
import { SkipLink } from '../components/SkipLink'
import { SyncIndicator } from '../components/SyncIndicator'
import { useToast } from '../components/Toast'
import { useOnline } from './useOnline'
import { shell } from '../lib/messages.es'
import { RuntimeProvider, useAuth, useRuntime, useSync } from './context'
import { useApplyPreferences } from './preferences'
import { useInstallPrompt } from './useInstallPrompt'
import { useLogout } from './useLogout'

export function AppShell() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/acceso" replace />
  return (
    <RuntimeProvider session={session}>
      <ShellLayout />
    </RuntimeProvider>
  )
}

const navLink = ({ isActive }: { isActive: boolean }) =>
  `flex objetivo-min items-center rounded-md border-2 px-3 font-semibold transition-colors ${
    isActive
      ? 'border-primario bg-primario text-sobre-primario'
      : 'border-transparent text-texto hover:bg-fondo'
  }`

function ShellLayout() {
  const online = useOnline()
  const sync = useSync()
  const runtime = useRuntime()
  const { notify } = useToast()
  const { requestLogout, dialog } = useLogout()
  useApplyPreferences()
  const install = useInstallPrompt()
  const { pathname } = useLocation()
  const first = useRef(true)

  // Avisos del motor: eliminaciones en otro dispositivo (EC-41) e imágenes retiradas (EC-16).
  useEffect(
    () =>
      runtime.onNotice((n) => {
        if (n.kind === 'remote-deleted')
          notify(
            n.entity === 'word' ? shell.remoteDeletedWord(n.name) : shell.remoteDeletedDeck(n.name),
            'warning',
          )
        else notify(shell.imageRemoved(n.name), 'warning')
      }),
    [runtime, notify],
  )

  // RF-44: al navegar, el foco pasa al título de inmediato (no en la carga inicial).
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    document.getElementById('titulo-pagina')?.focus()
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="sticky top-0 z-10 border-b border-borde bg-superficie">
        <div className="mx-auto flex w-full max-w-(--ancho-contenido) flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <p className="text-lg font-semibold">Miracle Flashcards</p>
          <nav aria-label={shell.mainNav} className="flex flex-wrap gap-1">
            <NavLink to="/mazos" className={navLink}>
              {shell.decks}
            </NavLink>
            <NavLink to="/progreso" className={navLink}>
              {shell.progress}
            </NavLink>
            <NavLink to="/ajustes" className={navLink}>
              {shell.settings}
            </NavLink>
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <InstallApp canInstall={install.canInstall} onInstall={() => void install.install()} />
            <SyncIndicator state={sync.state} pending={sync.pending} onRetry={sync.retry} />
            <Button variant="text" onClick={() => void requestLogout()}>
              {shell.logout}
            </Button>
          </div>
        </div>
        {!online && <OfflineBanner />}
      </header>
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-(--ancho-contenido) flex-1 px-4 py-4 outline-none"
      >
        <div key={pathname} className="anim-fundido">
          <Outlet />
        </div>
      </main>
      {dialog}
    </div>
  )
}
