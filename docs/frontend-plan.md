# Miracle Flashcards — Plan de implementación del frontend (`docs/frontend-plan.md`)

> Fecha: 2026-10-11. Estado: **aprobado por el usuario el 2026-10-11**. Se ejecuta una fase a la vez.
> Fuentes: `docs/frontend-specs.md` (stack, modelo, arquitectura, reglas BR-nn), `docs/specs.md` (fuente de verdad), `docs/test_plan.md`, `docs/prototype-spec.md`, `docs/design-tokens.md`. Si hay contradicción, gana `specs.md`.
> Destino del código: `frontend/` (D-01). `prototype/` es solo referencia y no se modifica.

## 1. Reglas de trabajo

1. **Una fase a la vez.** No se empieza la siguiente sin feedback e instrucción explícita del usuario (como en el prototipo).
2. **Dominio primero, con pruebas.** Las reglas BR-nn se implementan como funciones puras en `src/domain` y se prueban antes de conectarlas a la UI.
3. **Sin valores visuales hardcodeados**: todo sale de `tokens.css`; una prueba lo verifica desde la Fase 1.
4. **Cierre de fase** (CLAUDE.md, `prototype-spec.md` §B.2): `typecheck`, `lint`, `test` (incluye axe y contraste) en verde; recorrido solo con teclado; 320/768/1152 px y zoom 200 %; `prefers-reduced-motion`; 3 temas. Cada fase lista además sus criterios propios.
5. **Commits pequeños** que citan la sección de `specs.md` o la BR que implementan (p. ej. `feat(domain): cola en pasadas (RF-31, BR-05)`).
6. **Dependencias**: solo las de `frontend-specs.md` §2, con versión exacta. Cualquier otra se registra primero allí.
7. **UI en español, código en inglés.** Textos de UI centralizados en `src/lib/messages.es.ts`.
8. **Mock primero.** Toda la app funciona con `VITE_REMOTE_MODE=mock`; Supabase queda fuera de este plan (§5).

## 2. Mapa de fases

| Fase | Entregable | RF / BR principales | Depende de |
|---|---|---|---|
| 0 | Andamiaje del proyecto, tooling y CI | NFR, D-04, D-08, D-09, D-12, D-13 | — |
| 1 | Tokens, tema sin parpadeo y componentes base | RF-10, RF-11, RF-42, RF-44; BR-36, BR-37 | 0 |
| 2 | Capa de dominio (funciones puras + Zod) | BR-01 a BR-26 (lógica), RF-31, RF-36, RF-39 | 0 |
| 3 | Datos locales: Dexie, repositorios y outbox | RF-21, RF-28, RF-30, RF-40; BR-08, BR-14, BR-15, BR-20, BR-40 | 2 |
| 4 | Remoto mock y motor de sincronización | RF-22, RF-29; BR-41, BR-42 | 3 |
| 5 | Acceso, sesión y shell de la app | RF-09, RF-37, RF-41; BR-31 a BR-35, BR-39 | 1, 3, 4 |
| 6 | Mazos (columna izquierda de `/mazos`) | RF-16, RF-19, RF-24, RF-35; BR-19 a BR-21 | 5 |
| 7 | Panel de palabras y formulario de palabra | RF-03, RF-08, RF-15, RF-17, RF-18 (menú), RF-20, RF-23, RF-32, RF-33, RF-34, RF-36, RF-39, RF-40, RF-43; BR-11 a BR-18, BR-22 a BR-26 | 6 |
| 8 | Sesión de estudio y fin de sesión | RF-01 a RF-07, RF-12, RF-13, RF-25, RF-31, RF-35, RF-38; BR-01 a BR-10 | 6, 7 |
| 9 | Progreso y reactivación | RF-26, RF-27, RF-30; BR-09, BR-38 | 8 |
| 10 | Ajustes y apariencia | RF-10 a RF-12, RF-41, RF-42; BR-35 a BR-37 | 5 |
| 11 | PWA, caché de imágenes y estado offline completo | RF-14, RF-28; BR-17, BR-18, BR-39, BR-43 | 7, 8 |
| 12 | Arrastre y depósito animado | RF-18, RF-45; BR-27 a BR-30 | 7, 11 |
| 13 | Animaciones transversales (RF-44) y pulido | RF-44; HU-16 | 12 |
| 14 | E2E, accesibilidad global, despliegue | NFR, P-F3, P-F5 | todas |

Las fases 9 y 10 son independientes entre sí y pueden intercambiar orden si el usuario lo pide.

## 3. Detalle por fase

### Fase 0 — Andamiaje
> **Estado (2026-10-11): hecha, pendiente de revisión.** `npm install` resolvió sin conflictos de peers con las versiones fijadas; `typecheck`, `lint`, `format:check`, `test` y `build` pasan; los imports prohibidos (`dexie` en `components`, `react` en `domain`) fallan en ESLint. El CI no se ha ejecutado aún (requiere push). Eliminé el paso `npm ci` del criterio local: se usó `npm install` para generar `package-lock.json`.
**Tareas**
- Crear `frontend/` con `package.json` (versiones exactas de §2 de `frontend-specs.md`), `.nvmrc` = `26.10.0`, `engines`, `tsconfig.json` estricto (`strict`, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`), `vite.config.ts` (react, tailwind, vitest con jsdom, **sin** PWA todavía), `eslint.config.js` (plana, con `no-restricted-imports` de §7), `.prettierrc`.
- Husky + lint-staged (`pre-commit`: ESLint, Prettier, `tsc --noEmit`).
- Scripts npm de §9.3, compatibles con PowerShell.
- `.github/workflows/ci.yml` con `npm ci → typecheck → lint → format:check → test → build` (E2E se añade en la Fase 14).
- Carpetas vacías con `README` mínimo solo si hace falta; `src/test/setup.ts` (jest-dom, `fake-indexeddb/auto`).
- Verificar con `npm ci` que las fijaciones de versión (TypeScript 6.0.3, ESLint 9.39.5, react-router 8.4.0, vite-plugin-pwa 2.0.0) resuelven sin conflictos de peers; **si alguna falla, se detiene la fase y se consulta** (riesgo §10.3 de la especificación).

**Criterios de aceptación**
- `npm ci`, `typecheck`, `lint`, `test` y `build` pasan con una pantalla vacía y una prueba trivial.
- Un `import` prohibido (p. ej. `dexie` desde `components`) hace fallar ESLint.
- CI en verde en un PR de prueba.

### Fase 1 — Tokens, tema y componentes base
> **Estado (2026-10-11): hecha, pendiente de revisión visual del usuario.** `typecheck`, `lint`, `format:check`, `test` (115 pruebas) y `build` pasan. Galería en desarrollo: `npm run dev` y abrir `/__ui`. Decisiones de la fase en §7 de este documento.
**Tareas**
- Portar `prototype/src/styles/tokens.css`, `presets.ts` y `tokens.test.ts` a `frontend/src/styles/` con nombres en inglés (`data-theme="blue|white|dark"`, presets `neutral|mint|sand|lavender|graphite`), usando como contrato `docs/design-tokens.md` (no copiar a ciegas los valores del prototipo; revisar contra el documento).
- `@theme` de Tailwind que solo referencia variables CSS; prueba que rechaza valores arbitrarios (`[#…]`, `[…px]`) y colores hardcodeados en `src/components` y `src/features`.
- Script inline en `index.html` que aplica tema y presets desde `mf:prefs` o `prefers-color-scheme` antes del primer pintado (BR-36).
- Utilidades `anim-*` y `src/lib/motion.ts` (versión base: esperar salidas, reduced-motion).
- Componentes base de `frontend-specs.md` §6.3: `Button`, `TextField`, `Dialog`, `Popover`/`ActionMenu`, `Tabs`, `Toast`/`ToastProvider`, `Alert`, `StateViews`, `Icon`, `SkipLink`. `DeckCombobox` se hace en la Fase 7 (necesita datos).
- Página de revisión interna `/__ui` (solo en `import.meta.env.DEV`) con todos los componentes y estados, para revisar sin datos. No forma parte del producto.

**Criterios de aceptación**
- Contraste AA de todas las combinaciones tema × preset (prueba automática).
- axe sin violaciones en cada componente y estado, en los tres temas.
- Objetivos ≥ 44 px, foco visible, `Dialog` con foco atrapado y retorno de foco (pruebas con Testing Library).
- Con `prefers-reduced-motion: reduce` las duraciones valen ~0.
- **Revisión visual del usuario** antes de continuar.

### Fase 2 — Dominio
> **Estado (2026-10-11): hecha.** `src/domain` con `normalize`, `schemas`, `validation`, `study`, `grouping`, `search`, `progress`, `duplicates`, `ops`; textos en `src/lib/messages.es.ts`. 55 pruebas, incluida la de propiedad de la cola (200 sesiones). Las validaciones devuelven códigos y la UI los traduce, porque `domain` no importa `lib`.
**Tareas** (`src/domain`, funciones puras, sin React ni Dexie, 100 % unitarias)
- `normalize`: palabra (recortar, colapsar espacios, minúsculas, **sin** plegar acentos) y texto de mazo/búsqueda (además sin acentos) (BR-12, BR-19, BR-25, BR-26).
- `schemas` Zod: `Word`, `Deck`, `DeckWord`, `ProgressEvent`, `Preference`, DTO remotos; formularios (BR-11, BR-19, BR-31, BR-17 para el esquema de la URL).
- `study`: reglas de contador y estado (BR-03, BR-04, BR-09) y **cola en pasadas** (BR-05), con prueba de propiedad: con ≥ 2 pendientes nunca se repite la misma tarjeta seguida; las falladas vuelven en la pasada siguiente; con 1 pendiente se repite. El barajado recibe un generador aleatorio inyectable para pruebas deterministas.
- `grouping` (BR-22, BR-23), `search` (BR-25), `progress` (contadores, BR-38), `duplicates` (BR-12, BR-13).
- `src/lib/messages.es.ts` con los textos de `prototype-spec.md` §B.4 y los de cada sección F-nn.

**Criterios de aceptación**
- Cada BR de 8.1 a 8.4 que sea lógica pura tiene al menos una prueba que cita su ID y los EC/TC asociados.
- Sin dependencias de `react`, `dexie` ni DOM en `domain` (lo verifica ESLint).

### Fase 3 — Datos locales
> **Estado (2026-10-11): hecha.** Dexie por usuario, repositorios transaccionales con outbox, 28 pruebas (atomicidad forzando fallos, BR-13/14/15/20/09). Se añadió `studySet` para la sesión de estudio.
**Tareas**
- `data/db`: Dexie, base `miracle-flashcards-{userId}`, versión 1 con las tablas e índices de §4.4; guardia que impide abrir sin `userId`.
- Repositorios (§5.2): cada escritura es **una transacción** que modifica datos **y** añade su `OutboxOp` (§4.3). Operaciones: crear/editar/borrar palabra, crear/renombrar/borrar mazo, agregar/quitar palabra de mazo (BR-13, BR-14), registrar resultado (guarda evento y recalcula contador/estado en la misma transacción, BR-08), reactivar (BR-09), preferencias.
- Hooks de lectura por feature con `useLiveQuery` (se crean al llegar cada feature, no ahora); aquí solo consultas de repositorio.
- Borrado físico en local con su operación en el outbox (BR-15, BR-20).

**Criterios de aceptación** (Vitest + `fake-indexeddb`)
- Ninguna escritura deja datos sin operación en el outbox ni viceversa (probado forzando un fallo a mitad de transacción).
- Borrar palabra/mazo, quitar de mazo y reactivar cumplen exactamente BR-14, BR-15, BR-20, BR-09 (EC-22, EC-23, EC-33, EC-34).
- Duplicado en el mismo mazo bloqueado a nivel de repositorio (BR-13), no solo en UI.

### Fase 4 — Remoto mock y sincronización
> **Estado (2026-10-11): hecha.** `contract.ts`, `MockServer` (idempotencia, parches por campo, recálculo desde eventos, lápidas), `MockSyncRemote` con controles, `SyncEngine`, `SyncIndicator`. El `SyncProvider` quedó dentro de `app/context.tsx` (Fase 5). Se corrigió una carrera: el estado pendiente se lee dentro de la transacción de `applyChanges`.
**Tareas**
- `data/remote/contract.ts` con los tipos Zod de `push`/`pull` (§5.1) — este archivo pasa a ser el requisito para la fase SQL.
- `MockSyncRemote`: persistente en `localStorage`, con **servidor simulado** que asigna marcas de tiempo, aplica idempotencia por `opId`, conflicto por campo, recálculo de progreso desde eventos y borrado prevalente; con controles de prueba (latencia, fallos, segundo dispositivo).
- Motor de sync (`data/sync`): disparadores (`online`, arranque, tras escritura, "Reintentar"), envío en orden de `seq`, espera exponencial 2/4/8/16/32 s con máximo 5 reintentos (P-F2), estados `synced | offline | syncing | unsynced`, aplicación del estado devuelto y aviso de eliminaciones remotas.
- `SyncProvider` + `SyncIndicator` básico (el banner y "Instalar app" llegan en la Fase 11).

**Criterios de aceptación** (EC-28, EC-29, EC-37 a EC-41)
- Reintentar tras una interrupción a mitad no duplica palabras ni suma contadores dos veces.
- Dos dispositivos simulados: ediciones de campos distintos se combinan; el progreso de ambos se combina; el borrado prevalece y el otro dispositivo es avisado.
- Tras 5 fallos queda "Sin sincronizar" y nada local se pierde; "Reintentar" reanuda.

### Fase 5 — Acceso, sesión y shell
> **Estado (2026-10-11): hecha.** `AuthService` + mock (enlace con vigencia, un uso, invalidación, 60 s), `AccessPage`, `AppShell`, router de datos con guardia local, `ServicesProvider`/`AuthProvider`/`RuntimeProvider`. El enlace simulado se abre desde un aviso "modo simulado" de la propia pantalla.
**Tareas**
- `AuthService` + `MockAuthService` (enlace simulado: token con vigencia 1 h, un solo uso, invalidación al emitir otro, 60 s de enfriamiento) y `AuthProvider` (BR-31 a BR-34).
- Router de datos (`createBrowserRouter`, §6.1): `/acceso`, layout `/` con guardia de sesión local (sin red, BR-34), rutas vacías para el resto con `errorElement`.
- F-01 `AccessPage` con todos sus estados (inicial, validando, enviando, enviado con cuenta regresiva anunciada cada 10 s, enlace inválido, sin conexión en primer acceso, error de envío).
- `AppShell`: barra superior, navegación (pestañas en < 768 px), indicador de sync, `SkipLink`, región viva, cierre de sesión con confirmación si hay outbox (BR-35).
- `ServicesProvider` selecciona implementaciones por `VITE_REMOTE_MODE`.

**Criterios de aceptación**
- EC-01, EC-03, EC-42, EC-43, EC-50 cubiertos por pruebas de componente.
- Con sesión local y sin conexión, abrir `/mazos` no pasa por `/acceso`.
- **Revisión del usuario** (primera pantalla real, como en el prototipo).

### Fase 6 — Mazos
> **Estado (2026-10-11): hecha.** `DeckList`, `DeckItem`, `DeckForm`, `DeleteDeckDialog`; selección en la URL (`?deck=`); salida animada con `useAnimatedList`.
**Tareas:** `DeckList`, `DeckItem` con "Estudiar", `DeckForm` (nombre en línea con contador `n/60`, validación BR-19), `DeleteDeckDialog` (BR-20), ítem "Todas las palabras", selección y `aria-current`, estados vacío/carga/error, esqueletos, animaciones de aparición y salida (RF-44).
**Criterios:** HU-07, EC-20, EC-21, EC-22, EC-48; "Estudiar" deshabilitado con razón accesible en mazo vacío (BR-21); navegación por flechas en la lista.

### Fase 7 — Panel de palabras y formulario
> **Estado (2026-10-11): hecha.** `WordsPanel`, grupos, búsqueda, `DeckCombobox`, `WordFormDialog` con `ImageField` y modo sin verificar, diálogos de borrado y de quitar del mazo.
**Tareas**
- `WordsPanel` (título dinámico, búsqueda BR-25, "Nueva palabra"), `WordGroup`/`WordRow` (grupos con etiqueta e icono, BR-22 a BR-24), `DeckCombobox` "Agregar a mazo" (BR-26), diálogos de borrar palabra y quitar de mazo.
- `WordFormDialog` (diálogo en escritorio, pantalla completa en móvil): validación Zod, aviso de inglés duplicado no bloqueante (BR-12), `ImageField` con vista previa, validación en línea y modo offline "sin verificar" (BR-17, P-F7 = 10 s), edición con parche por campo (BR-16).
- La operación `image.verify` se encola; su ejecución al reconectar se completa en la Fase 11.
- Aquí **no** hay arrastre: la alternativa por menú ya cubre RF-20 (el arrastre llega en la Fase 12).

**Criterios:** HU-06, HU-08 (vía menú), HU-09, HU-10, HU-15; EC-13 a EC-19, EC-23 a EC-27, EC-44, EC-45, EC-51, EC-52; sin conexión se puede crear, editar y asignar (EC-30).

### Fase 8 — Sesión de estudio
> **Estado (2026-10-11): hecha.** `useStudySession`, `Flashcard` (volteo con rejilla, sin scroll interno), `AnswerButtons`, `StreakIndicator`, `SessionEnd`. Las palabras que desaparecen durante la sesión se omiten sin error (NEC-14).
**Tareas:** `StudyPage` y su máquina de estados (cargando, frente, reverso, fin) con la cola de la Fase 2; `Flashcard` (botón, ambas caras en el DOM, nombre accesible que cambia, `lang="en"`, volteo con `--mov-volteo`), `AnswerButtons` solo tras voltear (BR-02), `StreakIndicator`, imagen por `imageSide` (BR-10), ejemplo y nota; `SessionEnd` F-06 con resumen y acciones (BR-07); salida sin confirmación (BR-06). Respuestas rápidas sin bloquear (EC-53).
**Criterios:** HU-02 a HU-05, EC-04 a EC-12, EC-46; la tarjeta se estudia sin imagen cuando falla; todo funciona sin conexión; foco y anuncios según `prototype-spec.md` F-05.

### Fase 9 — Progreso y reactivación
> **Estado (2026-10-11): hecha.** `ProgressPage` con selector, contadores, `ProgressBar`, pestañas y "Reactivar".
**Tareas:** `ProgressPage` con selector de mazo (`?deck=`), contadores, pestañas Pendientes/Aprendidas, `ProgressBar` con valor textual, reactivar con aviso anunciado (BR-09, BR-38), estados vacío/carga/error.
**Criterios:** HU-11, EC-32 a EC-34, EC-47; enlace desde F-06 funciona.

### Fase 10 — Ajustes
> **Estado (2026-10-11): hecha.** `SettingsPage` con selectores de tema, paletas y lado de imagen, vista previa en vivo, preferencias en Dexie + `mf:prefs` + cola. Se añadió `[data-theme='white']` en `tokens.css` para pintar su muestra (una prueba exige que repita la base).
**Tareas:** `ThemePicker`, `PalettePicker` (fondo y tarjeta), `ImageSidePicker` (valor inicial `back`, P-F1), `CardPreview` en vivo, `LogoutButton`; persistencia en Dexie + `mf:prefs` + cola de sync (BR-36); aplicación inmediata sin mover el foco.
**Criterios:** HU-13, HU-14, EC-35, EC-36, EC-49; el tema se aplica antes del primer pintado también en recarga offline.

### Fase 11 — PWA y offline completo
> **Estado (2026-10-11): hecha.** `vite-plugin-pwa` (manifiesto, precaché, `images-v1` con tope de 200, `navigateFallback`, `prompt` sin interfaz, `clientsClaim`), `InstallApp`, registro solo en producción. Verificado en el build y en Chromium (Fase 14).
**Tareas:** configurar `vite-plugin-pwa` (§5.4): manifest e iconos, precaché del shell, `CacheFirst` `images-v1` con tope de 200 entradas (P-F6), `navigateFallback`, actualización `prompt` sin UI (P-F8); `WordImage` con omisión silenciosa; ejecución de `image.verify` al reconectar con retirada y aviso si falla (BR-17); `OfflineBanner`, `InstallApp`; estados completos de F-09.
**Criterios:** HU-12, EC-16, EC-30, EC-31; con el SW activo y sin red, la app arranca, se estudia y las imágenes ya vistas se muestran. Verificación manual con DevTools además de la prueba E2E de la Fase 14.

### Fase 12 — Arrastre y depósito
> **Estado (2026-10-11): hecha.** `lib/drag/pointerDrag.ts`, `DragProvider`, ficha, resaltado "Suelta aquí", `flyChip`, pulsos. Probada con ratón y con dedo en Chromium; la fluidez visual queda para revisión manual.
**Tareas:** `src/lib/drag` (Pointer Events, captura, umbral, `elementsFromPoint` sobre `data-deck-id`, `Escape`, `touch-action` en el asa), `DragLayer`, resaltado del mazo destino con borde y texto "Suelta aquí", `flyChip` (Web Animations API) para depósito y retorno, pulso del mazo y de la fila para el menú (BR-27 a BR-30); anuncios `aria-live`; en < 768 px solo menú.
**Criterios:** HU-17, EC-56 a EC-59; con movimiento reducido el cambio es instantáneo y se anuncia; duplicado devuelve la palabra y avisa; arrastres consecutivos sin pérdidas. **La animación no es verificable en jsdom**: se valida a mano en navegador real y en Playwright (Fase 14).

### Fase 13 — Animaciones transversales y pulido
> **Estado (2026-10-11): hecha.** Auditoría fila por fila del catálogo (`motion-catalog.test.ts`); se añadieron foco de campos, hover de filas, escala del mazo destino, ficha elevada y fundido del indicador de sincronización.
**Tareas:** revisar el catálogo de `design-tokens.md` §7 componente por componente (estados hover/foco/pulsado/deshabilitado, entrada y salida, navegación, cambio de tema, barra de sync y de avance); eliminar duraciones o curvas fijas; confirmar que salidas no retrasan la interacción.
**Criterios:** HU-16, EC-53 a EC-55; cada fila del catálogo tiene una verificación (prueba o revisión anotada).

### Fase 14 — E2E, accesibilidad global y despliegue
> **Estado (2026-10-11): hecha, con pendientes manuales.** 29 pruebas Playwright (flujo, sin red, caché de imágenes, instalable, arrastre con ratón y dedo, teclado, movimiento reducido, 320/768/1152 px, axe con contraste real por pantalla × tema × preset), `vercel.json`, CI con E2E y cobertura. Pendiente: lector de pantalla, CI en GitHub y vista previa en Vercel (ver `docs/frontend-test-evidence.md` §3). P-F5: Vercel compila con Node 24, 22 o 20 (no 26); `engines.node` pasa a `>=24.0.0` y `.nvmrc` sigue en 26.10.0.
**Tareas:** `playwright.config.ts` (Chromium, P-F3); escenarios E2E: acceso con mock, crear mazo y palabra, estudiar hasta aprender, offline → reconexión → sync, caché de imágenes, instalación PWA, arrastre con ratón y táctil, teclado completo, reduced-motion, 320/768/1152 px, zoom 200 %; `@axe-core/playwright` por pantalla × tema × preset; añadir `e2e` al CI; `vercel.json` (rewrite SPA, `no-cache` para `sw.js` y manifest); comprobar soporte de Node 26 en Vercel (P-F5); revisión con lector de pantalla (NVDA o VoiceOver).
**Criterios:** `docs/test_plan.md` — todo caso P0 y P1 automatizado o con evidencia manual anotada; CI en verde; despliegue de vista previa en Vercel funcionando.

## 4. Trazabilidad plan → especificación

| Cobertura | Fases |
|---|---|
| RF-01 a RF-07, RF-13, RF-25, RF-31, RF-35, RF-38 | 2, 8 |
| RF-08, RF-17, RF-32, RF-39 | 2, 7 |
| RF-03, RF-14, RF-15 | 2, 7, 11 |
| RF-09, RF-37, RF-41 | 5, 10 |
| RF-10, RF-11, RF-12, RF-42 | 1, 10 |
| RF-16, RF-19, RF-24 | 3, 6 |
| RF-18, RF-45 | 7 (menú), 12 |
| RF-20, RF-23, RF-33, RF-34, RF-36, RF-40, RF-43 | 2, 3, 7 |
| RF-21, RF-22, RF-28, RF-29 | 3, 4, 11 |
| RF-26, RF-27, RF-30 | 3, 9 |
| RF-44 | 1, 6 a 13 (cada fase anima lo suyo; la 13 audita) |

Al cerrar el plan, cada RF-01 a RF-45 debe aparecer al menos una vez en esta tabla; la comprobación final está en la Fase 14.

## 5. Fuera de este plan

- Esquema SQL, RLS, funciones RPC y la implementación `SupabaseSyncRemote` / `SupabaseAuthService`: fase posterior, a partir de `data/remote/contract.ts` (D-07). Cuando existan, se añade una fase "Conectar Supabase" con pruebas de contrato contra ambas implementaciones.
- Cualquier funcionalidad no listada en `specs.md`.

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Versiones recientes sin compatibilidad conocida (TypeScript 6, Vite 8, Vitest 5, react-router 8, vite-plugin-pwa 2) | Fase 0 valida `npm ci` y suite mínima; si falla, se detiene y se consulta antes de cambiar una versión |
| Sincronización y conflictos (mayor riesgo, ADR-001) | Mock con servidor simulado y segundo dispositivo desde la Fase 4; las pruebas de conflicto se escriben antes que la UI de sync |
| Cola en pasadas con casos límite | Prueba de propiedad en la Fase 2 con aleatoriedad inyectable |
| Animación de arrastre no cubierta por jsdom | Verificación manual y Playwright; criterio explícito en Fases 12 y 14 |
| Respuestas opacas de imágenes en cuota de almacenamiento | Tope de 200 entradas (P-F6) y prueba manual de cuota |
| Deriva respecto al prototipo | El prototipo es referencia visual; el contrato es `frontend-specs.md` y `design-tokens.md`, no su código |

## 7. Registro de decisiones del plan

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10-11 | Dominio y datos antes que pantallas (Fases 2 a 4) | Las reglas BR-nn y la sincronización son el mayor riesgo y no dependen de la UI |
| 2026-10-11 | El menú "Agregar a mazo" llega en la Fase 7 y el arrastre en la 12 | La alternativa sin arrastre es obligatoria (WCAG 2.5.1) y reduce el riesgo del arrastre |
| 2026-10-11 | PWA completa en la Fase 11, no en la 0 | Un service worker activo durante el desarrollo oculta cambios y complica la depuración |
| 2026-10-11 | Una fase a la vez con revisión del usuario | Mismo método que el prototipo (`prototype/PLAN.md`) |
| 2026-10-11 | Fase 1: se conservan los **nombres de tokens y utilidades en español** de `design-tokens.md` (`--color-fondo`, `bg-primario`, `objetivo-min`, `anim-entrada`…). Los atributos de tema y preset y los identificadores de código van en inglés (`data-theme="white\|blue\|dark"`, `data-background-palette`, `data-card-palette`; presets `neutral\|mint\|sand\|lavender\|graphite`). | `design-tokens.md` está aprobado con esos nombres; renombrarlos no se pidió. D-05 se aplica a código y datos. |
| 2026-10-11 | Fase 1: los colores de temas y presets viven **solo en CSS** (`tokens.css`); el script anti-parpadeo y la app únicamente ponen atributos en `<html>`. `presets.ts` del prototipo desaparece: queda `domain/appearance.ts` con identificadores y nombres de UI. | Evita duplicar valores entre CSS y JS y permite pintar muestras con solo el atributo; el contraste se verifica leyendo el CSS. |
| 2026-10-11 | Fase 1: `animate-spin` y `animate-pulse` de Tailwind se mantienen (cargando y esqueleto) y no están sujetos a tokens de motion; con movimiento reducido la regla global los reduce a ~0. | Son indicadores de carga continuos; no hay token de duración equivalente en `design-tokens.md`. |
| 2026-10-11 | Se ejecutaron las Fases 2 a 14 seguidas por instrucción del usuario ("quiero que realices todas las fases"). | Cambia la regla 1 de §1 (una fase a la vez con revisión) solo para esta ejecución; la revisión visual de todas las fases queda pendiente y se anota en `docs/frontend-test-evidence.md` §3. |
| 2026-10-11 | Lecturas reactivas con `useLiveQuery` envuelto en `useLive` (`src/data/hooks`), que captura el error de lectura para el estado de error. Esa carpeta puede importar `dexie-react-hooks`. | Los estados de carga, vacío y error son obligatorios y `useLiveQuery` por sí solo relanza el error. |
| 2026-10-11 | `engines.node` pasa a `>=24.0.0` (el desarrollo sigue en 26.10.0). | Vercel no ofrece Node 26 para compilar (P-F5); las dependencias exigen como mínimo Node 22.22. |
| 2026-10-11 | Sin conexión, un duplicado o aviso no bloqueante usa un aviso de tipo "warning" (icono de alerta, texto en `--color-aviso`). | Los avisos verdes de éxito daban una señal equivocada para un rechazo. |
