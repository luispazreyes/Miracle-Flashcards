import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA, type VitePWAOptions } from 'vite-plugin-pwa'
import { IMAGE_CACHE_MAX_ENTRIES } from './src/domain/constants'

// PWA (frontend-specs.md §5.4, Fase 11). Los colores del manifiesto no pueden ser variables CSS: repiten
// --color-fondo y --color-primario del tema blanco (styles/tokens.css); src/pwa.test.ts lo verifica.
export const MANIFEST_BACKGROUND = '#ffffff'
export const MANIFEST_THEME = '#1d4ed8'

/** Opciones de la PWA (exportadas para verificarlas en src/pwa.test.ts). */
export const pwaOptions: Partial<VitePWAOptions> = {
  // P-F8: la versión nueva espera y se activa en el siguiente arranque; sin interfaz de actualización.
  registerType: 'prompt',
  includeAssets: ['icono-192.png', 'icono-512.png'],
  manifest: {
    name: 'Miracle Flashcards',
    short_name: 'Flashcards',
    description: 'Flashcards para estudiar inglés, también sin conexión.',
    lang: 'es',
    start_url: '/mazos',
    scope: '/',
    display: 'standalone',
    background_color: MANIFEST_BACKGROUND,
    theme_color: MANIFEST_THEME,
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  },
  workbox: {
    // La primera instalación toma el control de la pestaña abierta: la app funciona sin red desde la primera visita.
    // (skipWaiting sigue desactivado: una versión nueva espera al siguiente arranque, P-F8.)
    clientsClaim: true,
    // App shell precacheado: la app abre y se usa sin red.
    globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
    navigateFallback: '/index.html',
    // Rutas de autenticación del backend: nunca se resuelven con el shell.
    navigateFallbackDenylist: [/^\/auth\//],
    runtimeCaching: [
      {
        // RF-14, BR-43: imágenes ya vistas, de cualquier origen, sin conexión. Una nunca vista falla en
        // silencio y WordImage la omite.
        urlPattern: ({ request }) => request.destination === 'image',
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-v1',
          expiration: { maxEntries: IMAGE_CACHE_MAX_ENTRIES },
          // 0 = respuestas opacas (imágenes de otros orígenes sin CORS).
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
  // Con un service worker activo en desarrollo se ocultan los cambios: solo en el build.
  devOptions: { enabled: false },
}

const pwa = VitePWA(pwaOptions)

export default defineConfig({
  // En pruebas no se ejecuta el plugin de PWA.
  plugins: [react(), tailwindcss(), ...(process.env.VITEST ? [] : [pwa])],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 20_000,
  },
})
