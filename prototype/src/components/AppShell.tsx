// Shell con sesión: barra superior (marca, navegación, sincronización) + banner offline (F-09).
import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useSync } from '../state/SyncContext'
import { Alert } from './Alert'
import { IndicadorSync } from './IndicadorSync'
import { InstalarApp } from './InstalarApp'

const enlaces = [
  { a: '/mazos', texto: 'Mazos' },
  { a: '/progreso', texto: 'Progreso' },
  { a: '/ajustes', texto: 'Ajustes' },
]

export function AppShell() {
  const { estado } = useSync()
  const { pathname } = useLocation()
  const primera = useRef(true)

  // SPA: tras navegar, el foco va al título de la pantalla nueva (2.4.3).
  useEffect(() => {
    if (primera.current) {
      primera.current = false
      return
    }
    document.querySelector<HTMLElement>('#contenido h1')?.focus()
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-borde bg-superficie">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
          <p className="text-lg font-semibold">Miracle Flashcards</p>
          <nav aria-label="Principal" className="order-last w-full md:order-none md:w-auto">
            <ul className="flex gap-1">
              {enlaces.map((e) => (
                <li key={e.a} className="flex-1 md:flex-none">
                  <NavLink
                    to={e.a}
                    className={({ isActive }) =>
                      `objetivo-min flex items-center justify-center rounded-md px-4 font-semibold transition-colors ${
                        isActive
                          ? 'bg-primario text-sobre-primario'
                          : 'text-texto hover:bg-fondo'
                      }`
                    }
                  >
                    {e.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <InstalarApp />
            <IndicadorSync />
          </div>
        </div>
      </header>

      {estado === 'sin-conexion' && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-3">
          <Alert tipo="info">Sin conexión. Tus cambios se guardan en este dispositivo.</Alert>
        </div>
      )}

      <main key={pathname} id="contenido" className="anim-fundido mx-auto w-full max-w-6xl flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
