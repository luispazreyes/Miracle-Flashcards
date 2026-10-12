import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { App } from './app/App'
import { createServices } from './app/services'
import { applyAppearance, readStoredAppearance } from './lib/appearance'

// Refuerza lo que ya hizo el script de index.html (RF-42), p. ej. si el espejo cambió entre pestañas.
applyAppearance(readStoredAppearance())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App services={createServices()} />
  </StrictMode>,
)

// PWA (RF-28, BR-43): service worker solo en producción. P-F8: sin interfaz de actualización; la versión
// nueva queda esperando y se activa en el siguiente arranque, sin interrumpir una sesión de estudio.
if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}
