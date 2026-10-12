import { lazy, Suspense, useMemo } from 'react'
import { RouterProvider } from 'react-router/dom'
import { ToastProvider } from '../components/Toast'
import { AuthProvider, ServicesProvider } from './context'
import { createAppRouter } from './router'
import type { Services } from './services'

// La galería de componentes solo existe en desarrollo (import.meta.env.DEV) y no entra en el build.
const UiGallery = import.meta.env.DEV ? lazy(() => import('./dev/UiGallery')) : null

export function App({ services }: { services: Services }) {
  const router = useMemo(() => createAppRouter(services), [services])

  if (UiGallery && window.location.pathname === '/__ui') {
    return (
      <Suspense fallback={null}>
        <UiGallery />
      </Suspense>
    )
  }
  return (
    <ServicesProvider services={services}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </ServicesProvider>
  )
}
