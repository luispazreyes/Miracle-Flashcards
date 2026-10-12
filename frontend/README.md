# Miracle Flashcards — frontend

PWA offline-first (React + Vite + Dexie). Documentación: `../docs/frontend-specs.md` (especificación), `../docs/frontend-plan.md` (fases) y `../docs/frontend-test-evidence.md` (pruebas).

## Comandos

| Comando                                       | Qué hace                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm install`                                 | Instala dependencias (Node ≥ 24; en desarrollo se usa el de `.nvmrc`)                      |
| `npm run dev`                                 | Servidor de desarrollo; `/__ui` muestra la galería de componentes (solo en desarrollo)     |
| `npm run build` / `npm run preview`           | Build de producción (incluye el service worker) y su servidor local                        |
| `npm run typecheck` · `lint` · `format:check` | Comprobaciones estáticas                                                                   |
| `npm test` · `npm run test:coverage`          | Vitest (dominio, datos, componentes, contraste, axe, animaciones)                          |
| `npm run e2e`                                 | Playwright en Chromium contra el build (la primera vez: `npx playwright install chromium`) |

## Modo de servicios

`VITE_REMOTE_MODE=mock` (por defecto) simula el backend y el correo: en la pantalla de acceso aparece un enlace "Abrir el enlace de acceso". El modo `supabase` se conectará cuando exista el esquema SQL (ver `.env.example`).
