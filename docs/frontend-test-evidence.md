# Miracle Flashcards — Evidencia de pruebas del frontend (`docs/frontend-test-evidence.md`)

> Fecha: 2026-10-11. Cierra la Fase 14 de `docs/frontend-plan.md`: cada caso P0 y P1 de `docs/test_plan.md` está automatizado (con el archivo que lo prueba) o tiene su evidencia manual pendiente anotada aquí. Si hay contradicción, gana `specs.md`.
> Comandos: `npm test` (Vitest, 405 pruebas), `npm run e2e` (Playwright, Chromium, 29 pruebas), `npm run test:coverage` (cobertura: 95 % de líneas y 86 % de ramas; informativa, P-F4).

## 1. Dónde está cada cosa

| Nivel | Archivos |
|---|---|
| Dominio | `src/domain/*.test.ts` |
| Datos y sincronización | `src/data/repositories/repositories.test.ts`, `src/data/sync/sync.test.ts`, `src/data/auth/mock/MockAuthService.test.ts` |
| Componentes y pantallas | `src/features/*/*.test.tsx`, `src/app/AppShell.test.tsx`, `src/components/*.test.tsx` |
| Tokens, contraste, animaciones | `src/styles/tokens.test.ts`, `no-hardcoded.test.ts`, `motion-catalog.test.ts`, `src/lib/motion.test.ts`, `src/pwa.test.ts` |
| Navegador real | `e2e/flow.spec.ts`, `offline.spec.ts`, `drag.spec.ts`, `a11y.spec.ts` |

## 2. Casos P0 y P1 por historia

| Caso (`test_plan.md`) | Prueba |
|---|---|
| HU-01 · TC-01.1 a 01.3, TC-EC01, EC03, EC50 | `AccessPage.test.tsx`, `MockAuthService.test.ts`, `e2e/flow.spec.ts` |
| HU-02 · TC-02.1 a 02.4, TC-S02 | `StudyPage.test.tsx` (frente/reverso, teclado, ejemplo y nota, imagen por lado) |
| HU-03, HU-04 · TC-03.x, TC-04.x, TC-EC06 a EC08 | `study.test.ts`, `repositories.test.ts`, `StudyPage.test.tsx` |
| HU-05 · TC-05.1 a 05.5, TC-EC09 a EC12, EC46 | `study.test.ts` (propiedad con 200 sesiones al azar), `StudyPage.test.tsx` |
| HU-06 · TC-06.1 a 06.3, TC-EC13 a EC16 | `validation.test.ts`, `WordFormDialog.test.tsx`, `repositories.test.ts`, `sync.test.ts` (imágenes sin verificar) |
| HU-07 · TC-07.x, TC-EC21, EC22 | `DecksPage.test.tsx`, `repositories.test.ts` |
| HU-08 · TC-08.1 a 08.5, TC-EC17, EC18, EC44 | `WordsPanel.test.tsx` (menú), `Drag.test.tsx` y `e2e/drag.spec.ts` (arrastre), `repositories.test.ts` |
| HU-09 · TC-09.1 a 09.3, TC-EC25, EC26 | `grouping.test.ts`, `WordsPanel.test.tsx`; el grupo lleva icono y texto (`WordGroup.tsx`) |
| HU-10 · TC-10.1 a 10.3, TC-EC23 | `WordFormDialog.test.tsx`, `WordsPanel.test.tsx` (borrar, cancelar con foco devuelto) |
| HU-11 · TC-11.x, TC-EC33, EC34, EC47 | `ProgressPage.test.tsx`, `repositories.test.ts` |
| HU-12 · TC-12.1 a 12.5, TC-EC28 a EC30, EC37 a EC42 | `sync.test.ts` (idempotencia, dos dispositivos, borrado prevalente, 5 reintentos), `e2e/offline.spec.ts` (sin red, reconexión, caché `images-v1`, instalable) |
| TC-EC31, EC-42 (sesión sin red) | `e2e/offline.spec.ts`, `AccessPage.test.tsx` |
| TC-EC43 (cerrar sesión con cola) | `AppShell.test.tsx` |
| TC-EC35 (matriz de contraste) | `tokens.test.ts` (cálculo) y `e2e/a11y.spec.ts` (axe con contraste real, 3 temas × 5 presets) |
| HU-13, HU-14, TC-EC49 | `SettingsPage.test.tsx`, `appearance.test.ts`, `e2e/flow.spec.ts` (tema sin parpadeo tras recargar) |
| HU-15 · TC-15.x, TC-EC51, EC52 | `grouping.test.ts` (búsqueda), `WordsPanel.test.tsx` |
| HU-16 · TC-16.1 a 16.6, TC-EC53 a EC55 | `motion-catalog.test.ts` (cada fila del catálogo), `Dialog.test.tsx`, `StudyPage.test.tsx` (respuestas rápidas), `e2e/a11y.spec.ts` (movimiento reducido) |
| HU-17 · TC-17.1 a 17.7, TC-EC56 a EC59 | `pointerDrag.test.ts`, `Drag.test.tsx`, `e2e/drag.spec.ts` (ratón y dedo), `motion.test.ts` (`flyChip`) |
| TC-S01 (disposición) | `e2e/a11y.spec.ts` (320, 768 y 1152 px) |
| TC-S03 (sin fechas) | El tipo `DeckWord` solo tiene `consecutiveHits` y `status` (`schemas.ts`); `study.test.ts` |
| TC-S05 (PWA instalable) | `pwa.test.ts`, `e2e/offline.spec.ts` |
| TC-S06 (carga, vacío, error) | Un caso por pantalla en cada `*.test.tsx` |

### Casos críticos de §4 (`NEC-nn`)

| NEC | Estado |
|---|---|
| 07 doble toque | Automatizado: `StudyPage.test.tsx` y `e2e/flow.spec.ts` |
| 06 reintento idempotente | Automatizado: `sync.test.ts` |
| 03, 04, 02, 05 conflictos y borrado | Automatizado: `sync.test.ts` |
| 01 reloj desfasado | Automatizado: `sync.test.ts` (el servidor asigna la hora) |
| 09, 13, 23 normalización | Automatizado: `normalize.test.ts`, `MockAuthService.test.ts`, `validation.test.ts` |
| 14 cambios durante la sesión | Automatizado: `StudyPage.test.tsx` |
| 15 recarga a mitad de sesión | Automatizado: `e2e/flow.spec.ts` |
| 17 contenido hostil | Automatizado: `StudyPage.test.tsx` (React no interpreta HTML) |
| 18, 19 teclado y táctil | Automatizado: `e2e/drag.spec.ts`, `StudyPage.test.tsx` |
| 20, 21, 22, 25, 27 | Automatizado: `study.test.ts`, `ProgressPage.test.tsx`, `repositories.test.ts`, `SettingsPage.test.tsx`, `MockAuthService.test.ts` |

## 3. Evidencia manual pendiente (no se puede hacer desde esta sesión)

| Qué | Por qué falta | Quién |
|---|---|---|
| Revisión con lector de pantalla (NVDA o VoiceOver): lectura de la tarjeta, de los grupos del panel y de los avisos | Requiere una persona con el lector | Usuario |
| Revisión visual de las pantallas en navegador (temas, presets, 320/768/1152 px, zoom 200 %) | Las pruebas comprueban estructura, contraste y desbordes, no el aspecto | Usuario |
| Animaciones de arrastre y depósito a simple vista | Playwright confirma el flujo y el estado, no la fluidez | Usuario |
| CI en verde en GitHub y despliegue de vista previa en Vercel | Requiere subir el repositorio y enlazar Vercel | Usuario |
| NEC-08: enlace mágico abierto en otro navegador o en la PWA instalada (iOS) | Depende del sistema operativo y de Supabase Auth real | Fase "Conectar Supabase" |
| NEC-11: aislamiento entre usuarios (RLS) | El backend aún no existe | Fase SQL |
| NEC-12, P-F6: cuota de IndexedDB y de la caché de imágenes | Requiere un navegador con la cuota llena | Usuario |
| Actualización del service worker entre versiones (P-F8) | Requiere dos despliegues sucesivos | Usuario |

## 4. Hallazgos reales que corrigieron las pruebas en navegador

- Las caras de la tarjeta tenían scroll interno no operable con teclado (`scrollable-region-focusable`): ahora comparten celda de una rejilla y la tarjeta crece.
- Los menús y el combobox no recibían foco al abrirse (panel con `visibility: hidden` hasta colocarse): ahora usan opacidad.
- Al agregar una palabra con el menú, la fila cambia de grupo y el foco se perdía: ahora vuelve al botón de la fila; tras borrar o quitar, al título del panel o a la lista de mazos.
- Al cambiar de tema o paleta, la base podía pisar un cambio más reciente del usuario (carrera): ahora manda lo que el usuario ve hasta que todo se confirma.
- El motor de sincronización aplicaba el estado del servidor con una lista de pendientes leída antes de la transacción (una palabra borrada podía reaparecer): ahora se lee dentro de la transacción.
