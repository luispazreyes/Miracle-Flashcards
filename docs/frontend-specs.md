# Miracle Flashcards — Especificación del frontend (`docs/frontend-specs.md`)

> Fecha: 2026-10-11. Estado: **aprobado por el usuario el 2026-10-11** (incluye los parámetros propuestos P-F1 a P-F8). Trabajo derivado de §10.4 aplicado en `er_diagram.md`, el ADR y `specs.md`.
> Fuentes: `docs/specs.md` (única fuente de verdad), `docs/backlog.md`, `docs/prototype-spec.md`, `docs/design-tokens.md`, `docs/test_plan.md`, `architecture/architecture.md`, `architecture/er_diagram.md`, `docs/adr/001-database-selection.md` y el prototipo `prototype/`. No existe `design.md`; su papel lo cumplen `design-tokens.md` y `prototype-spec.md`.
> Si este documento contradice `specs.md`, gana `specs.md`.
> **Leyenda:** `RF-nn` = requerimiento de `specs.md`. `D-nn` = decisión de esta fase (tomada por el usuario el 2026-10-11, ver §10). `P-Fnn` = pendiente abierto de esta fase (ver §10). Los textos de UI van en español; los identificadores de código, tablas y campos van en inglés (D-05).

---

## 1. Alcance y principios

El frontend es una **PWA offline-first** en `frontend/` (carpeta nueva, D-01). El prototipo `prototype/` se conserva como referencia visual y de comportamiento; no se edita ni se promueve.

- Implementa RF-01 a RF-45 de `specs.md`. Lo no listado en `specs.md` queda fuera (CLAUDE.md).
- Toda lectura y escritura de la UI va contra **IndexedDB (Dexie)**; la red solo interviene en la sincronización y en el acceso (RF-28, arquitectura §1).
- El backend aún no existe (el SQL/RLS/RPC es una fase posterior). El frontend habla con él solo a través de interfaces (`SyncRemote`, `AuthService`) con una **implementación mock** completa; Supabase se conecta cuando exista el SQL (D-07).
- Estándares de CLAUDE.md aplicables a todo: WCAG 2.1 AA, tokens sin valores hardcodeados, objetivos táctiles ≥ 44×44 px, estados vacío/carga/error, `prefers-reduced-motion`.

### 1.1 Trazabilidad RF → módulo

| RF | Módulo principal (`frontend/src/…`) |
|---|---|
| RF-01 a RF-07, RF-12, RF-13, RF-25, RF-31, RF-35, RF-38 | `features/study`, `domain/study` |
| RF-08, RF-17, RF-32, RF-39 | `features/words` (formulario), `domain/word` |
| RF-03, RF-14, RF-15 | `features/words` (`WordImage`, validación), `lib/imageCheck`, service worker (`vite.config.ts`) |
| RF-09, RF-37, RF-41 | `features/access`, `data/auth` |
| RF-10, RF-11, RF-12, RF-42 | `features/settings`, `app/PreferencesProvider`, `styles/` |
| RF-16, RF-19, RF-24, RF-35 | `features/decks`, `domain/deck` |
| RF-18, RF-20, RF-23, RF-33, RF-34, RF-36, RF-40, RF-43, RF-45 | `features/words` (panel), `lib/drag`, `domain/grouping`, `domain/search` |
| RF-21, RF-22, RF-28, RF-29 | `data/db`, `data/sync`, `data/remote` |
| RF-26, RF-27, RF-30 | `features/progress`, `domain/progress` |
| RF-44, RF-45 | `lib/motion`, `styles/` (tokens `--mov-*`), todos los componentes |

La cobertura completa RF → regla se verifica en §8 (cada regla cita sus RF).

---

## 2. Stack y versiones

Versiones **exactas** (sin `^` ni `~`), verificadas con `npm view` el 2026-10-11 y fijadas con `package-lock.json` (D-04). Gestor: **npm**.

### 2.1 Entorno

| Elemento | Valor |
|---|---|
| Node.js | **26.10.0** (la instalada localmente, D-13) → `frontend/.nvmrc` = `26.10.0`; `engines.node` = `>=24.0.0` (Vercel compila con Node 24, 22 o 20; ver P-F5) |
| npm | 11.19.1 (`engines.npm` = `>=11.19.1`) |
| Navegadores objetivo | Los de uso actual con soporte de Service Worker e IndexedDB (Chromium, Firefox, Safari); las pruebas E2E se ejecutan en Chromium (P-F3) |
| Sistema de desarrollo | Windows 11 (los scripts npm deben funcionar en PowerShell y Git Bash; sin comandos solo-POSIX) |

### 2.2 Núcleo

| Paquete | Versión | Uso |
|---|---|---|
| `react` / `react-dom` | 19.3.0 | UI |
| `react-router` | 8.4.0 | Enrutado en modo data router (`createBrowserRouter`, loaders); se importa de `react-router` (D-10). Requiere Node ≥ 22.22 |
| `typescript` | **6.0.3** | Compilador. Es la versión máxima compatible con `typescript-eslint` 8.71.1 (`<6.1.0`) (D-08) |
| `vite` | 8.3.4 | Bundler y servidor de desarrollo |
| `@vitejs/plugin-react` | 6.1.2 | Plugin React (requiere Vite ^8) |
| `tailwindcss` / `@tailwindcss/vite` | 4.3.3 | Utilidades CSS que consumen las variables de tokens (D-02) |
| `dexie` | 4.4.6 | IndexedDB (D-03) |
| `dexie-react-hooks` | 4.4.0 | `useLiveQuery` para lecturas reactivas |
| `@supabase/supabase-js` | 2.117.3 | Cliente de Auth y API (se usa solo en la implementación Supabase de las interfaces) |
| `zod` | 4.6.5 | Validación de formularios y de respuestas del servidor |
| `vite-plugin-pwa` | 2.0.0 | Manifest, service worker (Workbox). Peer: `workbox-build` y `workbox-window` 7.4.1 |
| `workbox-build` / `workbox-window` | 7.4.1 | Requeridos como peer de `vite-plugin-pwa` |

### 2.3 Calidad y pruebas

| Paquete | Versión | Uso |
|---|---|---|
| `eslint` | **9.39.5** | Máxima versión soportada a la vez por `eslint-plugin-jsx-a11y` (≤ 9) y `typescript-eslint` (D-09) |
| `@eslint/js` | 9.39.5 | Reglas base (misma línea que `eslint`) |
| `typescript-eslint` | 8.71.1 | Reglas TS |
| `eslint-plugin-jsx-a11y` | 6.10.2 | Accesibilidad estática (WCAG) |
| `eslint-plugin-react-hooks` | 7.1.1 | Reglas de hooks |
| `eslint-plugin-react` | 7.37.5 | Reglas React |
| `eslint-config-prettier` | 10.1.8 | Desactiva reglas que chocan con Prettier |
| `globals` | 17.13.0 | Globales para la config plana |
| `prettier` | 3.9.10 | Formato |
| `prettier-plugin-tailwindcss` | 0.8.1 | Orden de clases |
| `husky` | 9.1.7 | Hooks de Git |
| `lint-staged` | 17.6.0 | Ejecuta lint y formato solo sobre lo preparado (requiere Node ≥ 22.22.1) |
| `vitest` | 5.0.3 | Pruebas unitarias y de componentes |
| `@vitest/coverage-v8` | 5.0.3 | Cobertura (misma versión que `vitest`) |
| `jsdom` | 30.1.2 | Entorno DOM de Vitest |
| `@testing-library/react` | 16.3.3 | Pruebas de componentes |
| `@testing-library/user-event` | 14.6.7 | Interacción |
| `@testing-library/jest-dom` | 7.0.1 | Matchers |
| `axe-core` | 4.14.0 | Accesibilidad en Vitest |
| `fake-indexeddb` | 6.2.5 | IndexedDB simulada en Vitest |
| `@playwright/test` | 1.64.0 | E2E (offline, PWA, arrastre, navegador real) |
| `@axe-core/playwright` | 4.13.0 | axe en navegador real |
| `@types/node` | 26.6.5 | Tipos de Node |
| `@types/react` / `@types/react-dom` | 19.3.0 | Tipos de React |

### 2.4 Excluido explícitamente

Redux, Zustand, TanStack Query, dnd-kit/react-dnd/react-beautiful-dnd (D-06: el arrastre es propio), librerías de formularios (React Hook Form, Formik: se usa Zod + estado local), librerías de i18n, librerías de animación (Framer Motion, GSAP: las animaciones usan CSS + Web Animations API), librerías de UI/componentes (MUI, Radix, etc.: los componentes base son propios), analítica de terceros (CLAUDE.md), `idb`, `localForage`, `uuid` (se usa `crypto.randomUUID()`), Firebase.

---

## 3. Dependencias: reglas de uso

| Regla | Detalle |
|---|---|
| Solo lo listado | Añadir una dependencia exige registrarla antes en §2 (con versión exacta, motivo y RF). |
| Supabase aislado | `@supabase/supabase-js` se importa **solo** desde `src/data/remote/supabase/*` y `src/data/auth/supabase/*`. El resto del código depende de las interfaces. |
| Dexie aislado | Solo `src/data/db/*` y los repositorios importan `dexie`. Los componentes usan hooks (`useLiveQuery` vía hooks de feature) y repositorios, nunca `db` directamente. |
| Zod en las fronteras | Se valida en formularios (entrada del usuario) y en toda respuesta de `SyncRemote`/`AuthService` antes de tocar Dexie. |
| Tailwind sin valores arbitrarios | Prohibido `[#fff]`, `[12px]`, `duration-[…]`. El tema de Tailwind (`@theme`) solo referencia variables de `tokens.css`. Verificado por prueba (§9). |

**Variables de entorno** (prefijo `VITE_`, nunca secretos; la clave `anon` de Supabase es pública por diseño y la seguridad se basa en RLS):

| Variable | Valores | Uso |
|---|---|---|
| `VITE_REMOTE_MODE` | `mock` \| `supabase` | Elige la implementación de `SyncRemote` y `AuthService`. En desarrollo y CI: `mock` |
| `VITE_SUPABASE_URL` | URL del proyecto | Solo con `supabase` |
| `VITE_SUPABASE_ANON_KEY` | Clave pública | Solo con `supabase` |

---

## 4. Modelo de datos

Derivado de `architecture/er_diagram.md`, traducido al inglés (D-05, D-11). El ER se actualizará con estos nombres tras aprobar este documento. Los identificadores son UUID v4 generados en el cliente con `crypto.randomUUID()` (necesario para crear sin conexión y para la idempotencia, RF-22).

### 4.1 Equivalencias ER → código

| ER (español) | Código (inglés) | | ER (español) | Código (inglés) |
|---|---|---|---|---|
| USUARIO | `User` | | `ingles` / `ingles_normalizado` | `english` / `normalizedEnglish` |
| PREFERENCIA | `Preference` | | `espanol` | `spanish` |
| MAZO | `Deck` | | `imagen_url` / `imagen_verificada` | `imageUrl` / `imageVerified` |
| PALABRA | `Word` | | `ejemplo` / `nota` | `example` / `note` |
| MAZO_PALABRA | `DeckWord` | | `aciertos_consecutivos` | `consecutiveHits` |
| EVENTO_PROGRESO | `ProgressEvent` | | `estado`: `pendiente`/`aprendida` | `status`: `pending`/`learned` |
| `nombre` / `nombre_normalizado` | `name` / `normalizedName` | | `tema`: `azul`/`blanco`/`oscuro` | `theme`: `blue`/`white`/`dark` |
| `paleta_fondo` / `paleta_tarjeta` | `backgroundPalette` / `cardPalette` | | `lado_imagen`: `frente`/`reverso`/`ambos` | `imageSide`: `front`/`back`/`both` |
| `orden_local` | `localOrder` | | `acierto` | `hit` |
| `*_act_en` | `*UpdatedAt` | | `eliminado_en` | `deletedAt` |
| `registrado_en_cliente` / `recibido_en` | `recordedAtClient` / `receivedAt` | | `creado_en` / `actualizado_en` | `createdAt` / `updatedAt` |

Presets de paleta (RF-11, `design-tokens.md` §3): `neutral`, `mint`, `sand`, `lavender`, `graphite` (en español en la UI: Neutro, Menta, Arena, Lavanda, Grafito).

### 4.2 Entidades de dominio (tipos)

| Entidad | Campos | Reglas de integridad |
|---|---|---|
| `User` | `id`, `email`, `createdAt` | `email` único (RF-09) |
| `Preference` | `userId` (PK), `theme: 'blue'\|'white'\|'dark'`, `backgroundPalette`, `cardPalette`, `imageSide: 'front'\|'back'\|'both'`, `updatedAt` | Una por cuenta; sin registro rige el sistema (RF-42). Valores de paleta solo de los presets (RF-11) |
| `Deck` | `id`, `userId`, `name`, `normalizedName`, `updatedAt` | `name` recortado, no vacío, ≤ 60; `(userId, normalizedName)` único entre mazos vivos (RF-16) |
| `Word` | `id`, `userId`, `english`, `normalizedEnglish`, `spanish`, `imageUrl?`, `imageVerified`, `example?`, `note?`, `englishUpdatedAt`, `spanishUpdatedAt`, `imageUpdatedAt`, `exampleUpdatedAt`, `noteUpdatedAt` | `english` y `spanish` no vacíos tras recortar (RF-39). `normalizedEnglish` **no** es único (RF-36). `imageUrl` solo http(s) (RF-15) |
| `DeckWord` | `deckId`, `wordId`, `consecutiveHits`, `status: 'pending'\|'learned'` | PK `(deckId, wordId)`; no hay dos palabras con el mismo `normalizedEnglish` en un mazo (RF-36) |
| `ProgressEvent` | `id`, `deckId`, `wordId`, `hit`, `localOrder`, `recordedAtClient`, `receivedAt?` | Solo inserción. `receivedAt` lo asigna el servidor (RF-29); `recordedAtClient` es informativa |

Los `*UpdatedAt` de `Word` y `updatedAt` de `Deck`/`Preference` **los asigna el servidor** (RF-29). Localmente guardan el último valor recibido; las ediciones pendientes viajan como parche por campo (§5.3). `deletedAt` existe **solo en el DTO remoto** (lápida de RF-29): en local el borrado es físico y su intención queda en la cola de salida hasta sincronizar.

### 4.3 Entidades solo locales

| Entidad | Campos | Uso |
|---|---|---|
| `OutboxOp` | `seq` (autonumérico, orden), `opId` (UUID, idempotencia), `type`, `payload`, `createdAt`, `attempts`, `status: 'pending'\|'inflight'\|'failed'` | Cola de operaciones pendientes (RF-21, RF-22) |
| `MetaEntry` | `key`, `value` | `session` (usuario y estado de sesión, RF-41), `lastPullCursor`, `localOrderCounter`, `syncState`, `imagesToVerify` |
| `PrefsMirror` | (no está en Dexie) clave `localStorage` `mf:prefs` | Espejo mínimo de `Preference` para aplicar el tema **antes del primer pintado** (RF-42) |

Tipos de `OutboxOp.type`: `word.create`, `word.update` (parche por campo), `word.delete`, `deck.create`, `deck.rename`, `deck.delete`, `deckWord.add`, `deckWord.remove`, `progress.record`, `progress.reactivate`, `preference.update`, `image.verify`.

### 4.4 Esquema Dexie (versión 1)

Base de datos `miracle-flashcards`. Todas las tablas se filtran por `userId` en consultas (una base local por usuario autenticado: nombre `miracle-flashcards-{userId}`, para no mezclar cuentas en el mismo dispositivo).

| Tabla | Esquema Dexie | Índices para |
|---|---|---|
| `words` | `id, userId, normalizedEnglish` | Duplicados (RF-36), listado |
| `decks` | `id, userId, normalizedName` | Unicidad (RF-16, comprobada en el repositorio) |
| `deckWords` | `[deckId+wordId], deckId, wordId, [deckId+status]` | Pertenencia (RF-23), grupos del panel (RF-33/34), pendientes (RF-31) |
| `progressEvents` | `id, [deckId+wordId], localOrder` | Eliminación por par (RF-40), envío en orden |
| `outbox` | `++seq, opId, status, type` | Cola ordenada |
| `preferences` | `userId` | Una fila por cuenta |
| `meta` | `key` | Estado de sincronización y sesión |

Reglas de migración: cada cambio de esquema incrementa la versión de Dexie con `upgrade()`; nunca se edita una versión publicada.

### 4.5 Esquemas Zod (frontera)

Un esquema Zod por entidad y por DTO remoto (`src/domain/schemas`), con los mismos límites que §4.2 (`name` 1–60 tras recortar; `english`/`spanish` no vacíos tras recortar; `imageUrl` URL con protocolo `http:` o `https:`; `theme`, `imageSide`, paletas como enumeraciones). Los mensajes de error son los textos de `prototype-spec.md` §B.4, centralizados en `src/lib/messages.es.ts` (sin librería i18n).

---

## 5. Capa de datos y sincronización

### 5.1 Interfaces (frontera con el backend)

| Interfaz | Responsabilidad | Implementaciones |
|---|---|---|
| `AuthService` | `requestMagicLink(email)`, `getSession()`, `onAuthChange(cb)`, `signOut()`, procesamiento del enlace (código/token de la URL) | `MockAuthService` (en `data/auth/mock`), `SupabaseAuthService` (en `data/auth/supabase`) |
| `SyncRemote` | `push(ops[])` → resultado por `opId` (aplicada, ya aplicada, descartada por borrado) + estado definitivo; `pull(cursor)` → cambios, eliminaciones y preferencias desde el cursor | `MockSyncRemote` (en memoria + `localStorage`, soporta simular latencia, fallos y un segundo "dispositivo" para pruebas de conflicto), `SupabaseSyncRemote` (cuando exista el SQL) |

El contrato exacto (formas de petición/respuesta) se define con tipos Zod en `src/data/remote/contract.ts` y pasa a ser **requisito para la fase SQL**. Contenido mínimo:

- `push` es idempotente por `opId`: reenviar una operación ya aplicada devuelve `alreadyApplied`, sin duplicar efectos (RF-22, EC-37).
- Las ediciones de `Word` viajan como parche con **solo los campos modificados**; el servidor asigna `*UpdatedAt` por campo y gana el más reciente por campo (RF-29, EC-39).
- `progress.record` envía eventos en orden (`localOrder`); el servidor recalcula contador y estado combinando dispositivos y devuelve el estado definitivo por `(deckId, wordId)` (RF-29, EC-40).
- Si el servidor tiene un borrado de la palabra/mazo, descarta la operación concurrente y lo informa en la respuesta; el borrado prevalece (RF-29, EC-41).
- `pull` devuelve cambios de otros dispositivos y las eliminaciones para aplicarlas en local.

### 5.2 Repositorios

`src/data/repositories`: `WordRepository`, `DeckRepository`, `DeckWordRepository`, `ProgressRepository`, `PreferenceRepository`, `OutboxRepository`. Cada operación de escritura es **una transacción Dexie** que (a) modifica las tablas de datos y (b) añade su `OutboxOp`, de modo que nunca queda un cambio local sin su operación (RF-21, RF-22). Las reglas de negocio de §8 viven en `src/domain` (funciones puras) y los repositorios las invocan; los componentes no contienen reglas.

### 5.3 Motor de sincronización (`src/data/sync`)

| Aspecto | Especificación |
|---|---|
| Disparadores | Evento `online`, arranque de la app con sesión, tras cada escritura (si hay conexión) y botón "Reintentar" (RF-22) |
| Orden | Las operaciones se envían en orden de `seq`; las de progreso en orden de `localOrder` (RF-29) |
| Reintentos | Ante fallo, espera creciente y **máximo 5 reintentos automáticos** (RF-22). Tras agotarlos permanece "Sin sincronizar" hasta reintento manual o recuperación de conexión. Los cambios locales **nunca se descartan** |
| Estados expuestos (`SyncContext`) | `synced`, `offline`, `syncing`, `unsynced` + número de operaciones pendientes; alimentan el indicador de F-09 (texto + icono, `aria-live` polite) |
| Conflictos | Los resuelve el servidor (RF-29). El cliente aplica el estado devuelto por `push`/`pull`, sustituye lo local y, si una entidad fue eliminada en otro dispositivo, avisa con un toast (EC-41) |
| Cierre de sesión | Si `outbox` tiene operaciones no sincronizadas pide confirmación advirtiendo la pérdida de datos (RF-41, EC-43); al confirmar se borra la base local de esa cuenta |
| Imágenes sin verificar | Operación `image.verify`: al recuperar la conexión se comprueba la URL; si falla se retira `imageUrl` de la palabra y se avisa (RF-15, EC-16) |

### 5.4 PWA y caché de imágenes (`vite-plugin-pwa`)

| Aspecto | Especificación |
|---|---|
| Estrategia | `generateSW` con precaché del app shell; manifest e iconos tomados de `prototype/public` (`icono-192.png`, `icono-512.png`) |
| Imágenes (RF-14) | Regla de ejecución `CacheFirst` para peticiones de imagen a cualquier origen, `cacheableResponse` con estados 0 y 200 (respuestas opacas), nombre de caché `images-v1`. Una imagen nunca vista y sin conexión falla en silencio y `WordImage` la omite (EC-31) |
| Actualización | `registerType: 'prompt'` **sin UI de actualización**: la nueva versión se activa en el siguiente arranque (no interrumpe una sesión de estudio; no se añade funcionalidad no listada) |
| Navegación | `navigateFallback` a `index.html` (SPA); excluye rutas de autenticación de Supabase |
| Instalar app | Botón "Instalar app" con `beforeinstallprompt` (F-09) |

---

## 6. Arquitectura de componentes

### 6.1 Rutas (data router, D-10)

`createBrowserRouter` en `src/app/router.tsx`. Las URLs visibles son las de `prototype-spec.md` (en español).

| Ruta | Pantalla | Loader |
|---|---|---|
| `/acceso` | F-01 `AccessPage` | Si hay sesión local, redirige a `/mazos` (RF-41); procesa el enlace de acceso de la URL |
| `/` | Layout `AppShell` (barra, sincronización, navegación) | **Guardia de sesión**: sin sesión → `/acceso`. Con sesión no requiere red (RF-41) |
| `/mazos` | F-02 + F-03 + F-04 `DecksPage` | Instantánea inicial de mazos, palabras y pertenencias desde Dexie |
| `/estudio/:deckId` | F-05 → F-06 `StudyPage` | Verifica que el mazo exista (si no, `/mazos`); calcula si hay pendientes (RF-38) |
| `/progreso` | F-07 `ProgressPage` | Instantánea inicial; admite `?deck=:deckId` (desde F-06 "Reactivar palabras") |
| `/ajustes` | F-08 `SettingsPage` | Preferencias desde Dexie |

Los loaders sirven para guardias, redirecciones e instantánea inicial (sin parpadeos de carga); las **actualizaciones en vivo** vienen de `useLiveQuery` en cada feature. Cada ruta define `errorElement` (estado de error). La navegación entre pantallas anima con `--mov-medio` y el foco pasa al título de inmediato (RF-44).

### 6.2 Proveedores (Context + hooks, D-06)

| Proveedor | Contenido |
|---|---|
| `ServicesProvider` | `db`, repositorios, `AuthService`, `SyncRemote` (seleccionados por `VITE_REMOTE_MODE`) |
| `AuthProvider` | Usuario y estado de sesión; `signIn` (cuenta regresiva de 60 s), `signOut` con confirmación (RF-37, RF-41) |
| `PreferencesProvider` | `Preference` vigente; aplica `data-theme`, presets y `imageSide`; actualiza el espejo `mf:prefs` (RF-42) |
| `SyncProvider` | Estado de F-09, contador de pendientes, `retry()` |
| `ToastProvider` | Cola de avisos (`role="status"`/`"alert"`) y región viva global |

El estado del servidor/datos **no** se duplica en Context: se lee de Dexie con `useLiveQuery`. El estado efímero de UI (diálogos, búsqueda, sesión de estudio) es local al componente o a su feature (`useReducer`).

### 6.3 Componentes base (`src/components`) — nombres en inglés, textos en español

Tomados de los componentes del prototipo y de `prototype-spec.md` §A.7.

| Componente | Responsabilidad | RF / criterio |
|---|---|---|
| `Button` | Variantes primario, secundario, peligro, texto; estados con transición; cargando con `aria-busy` | RF-44, objetivo ≥ 44 px |
| `TextField` | Etiqueta visible, ayuda, error con `aria-describedby`, contador | WCAG 3.3.x |
| `Dialog` | `dialog`/`alertdialog`, foco atrapado, Esc, devuelve el foco; animación de entrada y salida | RF-19, RF-44 |
| `Popover`, `ActionMenu` | Menú "Más acciones"; entrada animada, cierre instantáneo | RF-44 |
| `DeckCombobox` | Combobox ARIA con búsqueda predictiva (subcadena, sin mayúsculas ni acentos) | RF-20 |
| `Tabs` | Patrón `tablist` | F-07, móvil |
| `Toast` | Avisos animados, anunciados | RF-44 |
| `Alert`, `StateViews` (`EmptyState`, `LoadingState`, `ErrorState`) | Estados obligatorios de cada lista y pantalla | CLAUDE.md |
| `Icon` | Iconos con texto alternativo o `aria-hidden` | No depender solo del color |
| `SkipLink` | "Saltar al contenido" | WCAG 2.4.1 |
| `SyncIndicator`, `InstallApp`, `OfflineBanner` | F-09 | RF-22, RF-28 |
| `WordImage` | Imagen con marcador de tamaño reservado; omite sin error si no carga | RF-14 |
| `AppShell` | Barra superior, navegación, indicador de sync, `<Outlet>` | F-09 |

### 6.4 Componentes por feature (`src/features/*`)

| Feature | Componentes | RF |
|---|---|---|
| `access` | `AccessPage`, `MagicLinkForm`, `InvalidLinkNotice` | RF-09, RF-37 |
| `decks` | `DeckList`, `DeckItem` (con "Estudiar"), `DeckForm` (nombre en línea `n/60`), `DeleteDeckDialog` | RF-16, RF-19, RF-24, RF-35 |
| `words` | `WordsPanel` (título, búsqueda, "Nueva palabra"), `WordGroup`, `WordRow` (asa de arrastre, "Agregar a mazo", "Más acciones"), `WordFormDialog`, `ImageField` (validación y vista previa), `DeleteWordDialog`, `RemoveFromDeckDialog`, `DragLayer` (ficha que sigue al puntero) | RF-17 a RF-20, RF-23, RF-33, RF-34, RF-36, RF-39, RF-40, RF-43, RF-45 |
| `study` | `StudyPage`, `Flashcard` (botón; ambas caras en el DOM; nombre accesible cambia), `AnswerButtons`, `StreakIndicator`, `SessionEnd` (F-06) | RF-01 a RF-07, RF-12, RF-31, RF-35, RF-38 |
| `progress` | `ProgressPage`, `DeckSelect`, `ProgressCounters`, `ProgressBar`, `WordProgressRow` (con "Reactivar") | RF-26, RF-27, RF-30 |
| `settings` | `SettingsPage`, `ThemePicker`, `PalettePicker` (fondo/tarjeta), `ImageSidePicker`, `CardPreview`, `LogoutButton` | RF-10 a RF-12, RF-41, RF-42 |

### 6.5 Capa de dominio (`src/domain`, funciones puras, sin React ni Dexie)

`normalize` (palabra: recortar, colapsar espacios, minúsculas; mazo/búsqueda: además sin acentos), `deckName` (validación), `word` (validación y duplicados), `study` (cola en pasadas y reglas de contador, §8), `grouping` (grupos del panel), `search` (filtro), `progress` (contadores), `schemas` (Zod). Son el objetivo principal de las pruebas unitarias.

### 6.6 Arrastre propio (`src/lib/drag`, D-06)

Pointer Events (`pointerdown/move/up/cancel`), captura del puntero, umbral de inicio, detección de mazo bajo el puntero con `elementsFromPoint` sobre elementos `data-deck-id`, cancelación con `Escape`, y `touch-action` controlado en el asa. La fila origen queda atenuada y una copia elevada sigue al puntero (`DragLayer`). Soltar sobre un mazo válido → `DeckWordRepository.add`; fuera, cancelación o duplicado (RF-36) → la ficha vuelve animada (RF-45). En < 768 px (pestañas separadas) el arrastre se sustituye por el menú "Agregar a mazo", que existe siempre como alternativa sin arrastre (WCAG 2.5.1).

### 6.7 Animaciones y tokens (RF-44, RF-45)

- Tokens `--mov-*` y el catálogo componente → animación de `docs/design-tokens.md` §6–§7 (definitivos); utilidades `anim-*` en `src/styles/animations.css`; helpers en `src/lib/motion.ts` (esperar salidas, `flyChip` con Web Animations API para el depósito).
- Con `prefers-reduced-motion: reduce` las duraciones valen ~0 y el cambio es instantáneo; el aviso de texto accesible siempre se emite. Ningún estado depende solo de la animación (EC-54, EC-58). Las animaciones no bloquean la interacción (EC-53, EC-59).
- `src/styles/tokens.css` define variables por tema (`[data-theme="blue"|"white"|"dark"]`) y presets; Tailwind las consume vía `@theme`. Un script inline en `index.html` aplica tema y presets desde `mf:prefs` o `prefers-color-scheme` antes del primer pintado (RF-42).

---

## 7. Estructura de carpetas

```
frontend/
├─ .github/workflows/ci.yml
├─ .husky/pre-commit
├─ .nvmrc                      # 26.10.0
├─ eslint.config.js            # config plana (ESLint 9)
├─ .prettierrc
├─ index.html                  # script anti-parpadeo de tema (RF-42)
├─ package.json / package-lock.json
├─ playwright.config.ts
├─ tsconfig.json
├─ vercel.json                 # rewrite SPA a index.html; cabeceras (sw sin caché)
├─ vite.config.ts              # react, tailwind, vite-plugin-pwa, vitest
├─ public/                     # iconos PWA (icono-192.png, icono-512.png)
├─ e2e/                        # Playwright: offline, PWA, arrastre, axe, enlace mágico (mock)
└─ src/
   ├─ main.tsx
   ├─ app/                     # router.tsx, providers, AppShell, guardias
   ├─ features/
   │  ├─ access/   decks/   words/   study/   progress/   settings/
   ├─ domain/                  # normalize, deckName, word, study, grouping, search, progress, schemas
   ├─ data/
   │  ├─ db/                   # Dexie, esquema y migraciones
   │  ├─ repositories/
   │  ├─ sync/                 # motor, backoff, outbox
   │  ├─ remote/               # contract.ts, SyncRemote, mock/, supabase/
   │  └─ auth/                 # AuthService, mock/, supabase/
   ├─ components/              # Button, TextField, Dialog, ActionMenu, Toast, …
   ├─ lib/                     # drag/, motion.ts, imageCheck.ts, messages.es.ts, id.ts
   ├─ styles/                  # tokens.css, animations.css, presets.ts, index.css
   └─ test/                    # setup, fábricas de datos, utilidades de prueba
```

Reglas de dependencia (verificadas con `no-restricted-imports` de ESLint): `domain` no importa de nada del proyecto salvo `domain`; `data` importa de `domain`; `features` y `components` importan de `domain`, `data` (repositorios e interfaces) y `lib`; `components` no importa de `features`; solo `data/*/supabase` importa `@supabase/supabase-js`; solo `data/db` y repositorios importan `dexie`. Los archivos de prueba conviven con su código (`*.test.ts(x)`); los E2E van en `e2e/`.

---

## 8. Reglas de negocio

Todas viven en `src/domain` salvo indicación; cada una cita sus RF. Constantes: `LEARNED_THRESHOLD = 3`, `DECK_NAME_MAX = 60`, `MAGIC_LINK_COOLDOWN_S = 60`, `SYNC_MAX_RETRIES = 5`.

### 8.1 Estudio

| ID | Regla | RF |
|---|---|---|
| BR-01 | La tarjeta muestra el inglés al frente; al activarla se voltea y muestra el español, con ejemplo y nota si existen. Solo dirección inglés → español | RF-01, RF-02, RF-25, RF-32 |
| BR-02 | Acierto/fallo solo se habilita tras voltear; antes no se registra nada | RF-04, EC-06 |
| BR-03 | Acierto: `consecutiveHits += 1`. Fallo: `consecutiveHits = 0`; la palabra sigue pendiente | RF-05, RF-06 |
| BR-04 | Con `consecutiveHits = 3` el estado pasa a `learned` y sale de las pendientes **de ese mazo**; el progreso es independiente por mazo | RF-07, RF-30 |
| BR-05 | Cola: se baraja la lista de pendientes en una **pasada**; cada tarjeta aparece una vez por pasada. Al terminar la pasada se recalculan las pendientes (falladas y aciertos < 3) y se baraja de nuevo. Con ≥ 2 pendientes, la primera de la nueva pasada nunca es igual a la última mostrada. Con 1 pendiente se repite hasta aprender o salir | RF-13, RF-31, EC-12, EC-46 |
| BR-06 | La sesión no tiene límite de tamaño: continúa hasta agotar pendientes o salir. Salir no pide confirmación (el progreso ya está guardado en cada respuesta) | RF-35 |
| BR-07 | No se inicia una sesión vacía: mazo sin palabras → mensaje "no tiene palabras"; mazo sin pendientes → F-06 sin resumen. Al agotarse durante la sesión → F-06 con resumen (aciertos y fallos de la sesión, en memoria) y acciones "Reactivar palabras" y "Volver a mazos" | RF-38, EC-09 a EC-11 |
| BR-08 | Cada respuesta se guarda al instante (evento + contador/estado en una transacción) sin esperar a la red | RF-21, RF-28 |
| BR-09 | Reactivar: `status = pending`, `consecutiveHits = 0`, solo en el mazo elegido | RF-27, EC-33, EC-34 |
| BR-10 | Imagen según `imageSide` (`front`/`back`/`both`). Sin imagen o no disponible: la tarjeta se muestra con normalidad | RF-12, RF-14, EC-04, EC-05 |

### 8.2 Palabras

| ID | Regla | RF |
|---|---|---|
| BR-11 | Obligatorios: `english` y `spanish` no vacíos tras recortar; si falta uno no se crea y se nombra el campo. Imagen, ejemplo y nota opcionales | RF-39, EC-13 |
| BR-12 | **Mismo término** = igual `normalizedEnglish` (recortar, colapsar espacios, minúsculas; **sin** plegar acentos). Al **crear** una palabra cuyo inglés ya existe: aviso no bloqueante "Ya existe una palabra con ese inglés. Puedes continuar." | RF-36, EC-45 |
| BR-13 | Al **agregar a un mazo** una palabra cuyo `normalizedEnglish` ya está en ese mazo: se bloquea y se avisa "«{palabra}» ya está en este mazo." (por arrastre o por menú, mismo aviso). En otro mazo distinto sí se permite | RF-36, RF-23, EC-17, EC-18, EC-44 |
| BR-14 | Quitar de un mazo: confirmación breve; elimina `DeckWord` y sus `ProgressEvent` de ese par; la palabra se conserva; si se reagrega, `consecutiveHits = 0` | RF-40 |
| BR-15 | Borrar palabra: diálogo que indica en cuántos mazos está; borrado definitivo de la palabra, sus `DeckWord` y eventos | RF-19, RF-23, EC-23 |
| BR-16 | Editar palabra: la operación viaja como parche solo de los campos cambiados | RF-19, RF-29 |
| BR-17 | Imagen: la URL debe ser `http:`/`https:` y cargar como imagen (`Image.onload`). Con `navigator.onLine === false` se guarda con `imageVerified = false`, insignia "Imagen sin verificar" y aviso, y se valida al recuperar conexión; si falla se retira y se avisa. Sin conexión no se rechaza por "no carga". Solo se guarda el enlace | RF-03, RF-15, EC-14 a EC-16 |
| BR-18 | Sin conexión, la imagen nunca vista se omite sin error y se carga al volver la red | RF-14, EC-31 |

### 8.3 Mazos

| ID | Regla | RF |
|---|---|---|
| BR-19 | Nombre: recortado, obligatorio, ≤ 60, único entre mazos del usuario comparando sin mayúsculas ni acentos (`normalizedName` con plegado de acentos). Si no cumple, no se guarda y se indica el motivo | RF-16, EC-48 |
| BR-20 | Borrar un mazo: confirmación; borrado definitivo del mazo, sus `DeckWord` y eventos; **las palabras se conservan** y quedan "Sin mazo" | RF-19, RF-24, EC-21, EC-22 |
| BR-21 | "Estudiar" deshabilitado con razón accesible en un mazo sin palabras; en un mazo sin pendientes lleva a F-06 | RF-35, RF-38 |

### 8.4 Panel de palabras y búsqueda

| ID | Regla | RF |
|---|---|---|
| BR-22 | Con un mazo seleccionado, tres grupos en este orden: 1º las del mazo (resaltadas, "En este mazo"), 2º solo en otros mazos ("En otros mazos"), 3º sin mazo ("Sin mazo"). Una palabra en el mazo seleccionado y en otros va solo en el 1º. Los grupos vacíos no se muestran | RF-33, EC-24, EC-25 |
| BR-23 | Sin mazo seleccionado ("Todas las palabras"): lista única; las sin mazo se resaltan y van al final | RF-34, EC-26 |
| BR-24 | Cada grupo lleva etiqueta e icono además del color | NFR, HU-09 |
| BR-25 | Búsqueda: subcadena en inglés o español, sin mayúsculas ni acentos, recortando espacios del texto; respeta orden y grupos (los grupos sin coincidencias no se muestran); sin coincidencias muestra "Sin resultados para «{texto}»"; al vaciar se restaura. Funciona sin conexión | RF-43, EC-51, EC-52 |
| BR-26 | Combobox "Agregar a mazo": búsqueda por subcadena sin mayúsculas ni acentos; sin coincidencias "Sin resultados para «{texto}»" y no asigna nada | RF-20, EC-19, EC-48 |

### 8.5 Arrastre y depósito

| ID | Regla | RF |
|---|---|---|
| BR-27 | Arrastrar: la fila se eleva y sigue al puntero; el mazo bajo la palabra se resalta (borde y texto "Suelta aquí", no solo color); soltar sobre un mazo válido lo agrega y anima el depósito (la ficha entra y el mazo pulsa) | RF-18, RF-45, EC-59 |
| BR-28 | Soltar fuera, cancelar (Esc o interrupción) o duplicado: la palabra vuelve animada a su sitio, no cambia de mazo; en duplicado se muestra el aviso de BR-13 | RF-45, RF-36, EC-56 |
| BR-29 | Agregar con el menú muestra una versión breve del depósito (pulso del mazo y de la fila). Con movimiento reducido el cambio es instantáneo y se anuncia por aviso accesible | RF-20, RF-45, EC-58 |
| BR-30 | Funciona sin conexión; el cambio queda en la cola de salida | RF-28, EC-57 |

### 8.6 Acceso, sesión y apariencia

| ID | Regla | RF |
|---|---|---|
| BR-31 | Email con formato inválido: no se envía y se muestra "Escribe un correo válido." | RF-09, EC-01 |
| BR-32 | Tras pedir un enlace, el botón queda deshabilitado 60 s con cuenta regresiva anunciada cada 10 s por `aria-live="polite"`; luego pasa a "Reenviar enlace". La vigencia (1 h), el uso único y la invalidación del enlace anterior los garantiza Supabase Auth; el cliente solo muestra el mensaje de aviso | RF-37, EC-50 |
| BR-33 | Enlace caducado, usado, reemplazado o alterado: no inicia sesión, mensaje "Este enlace ya no es válido." y botón "Solicitar enlace nuevo" | RF-37, EC-03 |
| BR-34 | Solo el primer acceso requiere red ("Necesitas conexión para iniciar sesión por primera vez."). Con sesión existente, la app abre `/mazos` sin conexión | RF-41, EC-42 |
| BR-35 | Cerrar sesión con operaciones sin sincronizar: diálogo "Tienes cambios sin sincronizar. Si cierras sesión, se perderán." ("Cancelar" / "Cerrar sesión igualmente"); sin pendientes cierra directamente | RF-41, EC-43 |
| BR-36 | Preferencias (`theme`, paletas, `imageSide`): se aplican al instante, se guardan en Dexie y en `mf:prefs`, y se sincronizan; en conflicto gana el cambio más reciente según el servidor. Antes de iniciar sesión se usa `prefers-color-scheme`; en el primer login sin preferencias: claro → `white`, oscuro → `dark` | RF-10, RF-11, RF-42 |
| BR-37 | Paletas solo entre presets predefinidos (sin color libre); cada preset define su propio texto y pasa la prueba de contraste AA | RF-11, EC-35 |
| BR-38 | Progreso por mazo con selector; una palabra en dos mazos cuenta en cada uno; las palabras sin mazo no tienen progreso | RF-26, EC-47 |

### 8.7 Sincronización y offline

| ID | Regla | RF |
|---|---|---|
| BR-39 | Estudiar, agregar y editar funcionan sin conexión; nunca se bloquea la UI por falta de red. Banner "Sin conexión. Tus cambios se guardan en este dispositivo." | RF-21, RF-28, EC-30 |
| BR-40 | Cada escritura local encola su `OutboxOp` en la misma transacción; las operaciones son idempotentes por `opId` | RF-22, EC-37 |
| BR-41 | Fallo de sync: no se descarta nada; reintento automático con espera creciente (máx. 5); indicador "Sin sincronizar" y botón "Reintentar" | RF-22, EC-29 |
| BR-42 | Conflictos (servidor): marca de tiempo del servidor; campos de texto por campo; progreso como eventos recalculados; el borrado prevalece. El cliente aplica el resultado y avisa de eliminaciones remotas. Sin UI de resolución manual | RF-29, EC-28, EC-38 a EC-41 |
| BR-43 | Las imágenes ya vistas se sirven desde caché del service worker sin conexión | RF-14 |

---

## 9. Calidad, pruebas y CI

### 9.1 Pruebas

| Nivel | Herramienta | Alcance |
|---|---|---|
| Unitarias de dominio | Vitest | `src/domain` completo (normalización, cola en pasadas, contador, agrupación, búsqueda, validaciones), incluidas propiedades como "nunca la misma tarjeta seguida con ≥ 2 pendientes" |
| Datos | Vitest + `fake-indexeddb` | Repositorios (transacción de datos + outbox), motor de sync contra `MockSyncRemote` (idempotencia, reintentos, 5 máx., conflictos con segundo dispositivo simulado) |
| Componentes | Vitest + Testing Library + `user-event` | Comportamiento de cada feature y todos sus estados (vacío, carga, error) |
| Accesibilidad | `axe-core` en Vitest y `@axe-core/playwright` | axe sin violaciones por pantalla, estado, tema y preset (blanco/azul/oscuro × presets) |
| Tokens | Vitest | Contraste AA de cada tema y preset (`tokens.test.ts`, portado del prototipo) y ausencia de valores arbitrarios/hardcodeados en componentes |
| E2E | Playwright (Chromium) | Offline y reconexión, instalación PWA y service worker, imágenes en caché, arrastre con ratón/táctil, teclado completo, `prefers-reduced-motion`, 320/768/1152 px, zoom 200 %, enlace mágico con el mock |
| Cobertura | `@vitest/coverage-v8` | Informe en CI; umbral por definir (P-F4) |

El `docs/test_plan.md` (TC-nn) es la referencia de casos; cada caso se implementa en el nivel que corresponda y cita su TC.

### 9.2 Verificación previa al cierre de cada fase (CLAUDE.md)

axe + recorrido solo con teclado + lector de pantalla (NVDA o VoiceOver) + 320/768/1152 px y zoom 200 % + `prefers-reduced-motion: reduce` (`prototype-spec.md` §B.2).

### 9.3 Herramientas

- **ESLint 9 (config plana)** con `typescript-eslint`, `jsx-a11y`, `react-hooks`, `react`, `eslint-config-prettier`, y `no-restricted-imports` para las reglas de dependencia de §7. **Prettier** con `prettier-plugin-tailwindcss`.
- **Husky + lint-staged**: `pre-commit` ejecuta ESLint (con `--fix`) y Prettier sobre los archivos preparados y `tsc --noEmit`.
- **Scripts npm** (compatibles con PowerShell): `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:coverage`, `e2e`.

### 9.4 CI (GitHub Actions) y despliegue (Vercel)

| Etapa | Contenido |
|---|---|
| `ci.yml` en push y PR | `npm ci` → `typecheck` → `lint` → `format:check` → `test` (incluye contraste de tokens y axe) → `build` → `e2e` (Playwright con `VITE_REMOTE_MODE=mock`) |
| Despliegue | Vercel enlazado al repositorio, vistas previas por PR; `vercel.json` con reescritura SPA a `/index.html` y cabecera `Cache-Control: no-cache` para `sw.js` y el manifest. Versión de Node del proyecto en Vercel acorde con `.nvmrc` (P-F5) |

---

## 10. Registro de decisiones y pendientes

### 10.1 Decisiones de esta fase (usuario, 2026-10-11)

| ID | Decisión |
|---|---|
| D-01 | Frontend nuevo en `frontend/`; `prototype/` queda como referencia |
| D-02 | Tailwind v4 + variables CSS de tokens. *Matiza CLAUDE.md ("CSS con Design Tokens"): los tokens siguen siendo variables CSS y Tailwind solo las consume.* Se registrará en `docs/` al aprobar |
| D-03 | Dexie para IndexedDB; `@supabase/supabase-js`; `vite-plugin-pwa` (Workbox) |
| D-04 | Versiones exactas, npm, `package-lock.json` |
| D-05 | Inglés en código y BD; UI y documentación en español |
| D-06 | Estado con Context + hooks sobre Dexie; arrastre con Pointer Events propios |
| D-07 | Contrato con el backend: interfaces `SyncRemote`/`AuthService` + mock; Supabase se conecta cuando exista el SQL |
| D-08 | TypeScript **6.0.3** (máxima compatible con typescript-eslint 8.71.1, que exige `<6.1.0`). *El prototipo usa 7.0.2; no se hereda* |
| D-09 | ESLint **9.39.5** (máxima soportada por `eslint-plugin-jsx-a11y` 6.10.2 y `typescript-eslint`) |
| D-10 | `react-router` 8.4.0 en modo data router (loaders) |
| D-11 | Tras aprobar este documento, `architecture/er_diagram.md` y el ADR se actualizan a nomenclatura en inglés |
| D-12 | Estructura por feature + capas; CI en GitHub Actions; despliegue en Vercel; tooling: ESLint + Prettier, Zod, Playwright, Husky |
| D-13 | Node 26.10.0 (la instalada localmente) |

### 10.2 Parámetros de implementación que `specs.md` no fija (propuestos; requieren confirmación)

| ID | Parámetro | Valor propuesto | Motivo |
|---|---|---|---|
| P-F1 | Lado de la imagen por defecto (RF-12 no define valor inicial) | `back` (reverso) | Es lo que aprobó el prototipo (`prototype/PLAN.md`); debe registrarse en `specs.md` |
| P-F2 | Espera entre reintentos de sync (RF-22 solo exige "creciente", máx. 5) | 2 s, 4 s, 8 s, 16 s, 32 s | Exponencial simple; ajustable sin cambiar la regla |
| P-F3 | Navegadores de E2E | Solo Chromium | Cubre PWA/offline; Firefox y WebKit quedan fuera por coste |
| P-F4 | Umbral de cobertura | Sin umbral bloqueante en la primera entrega; informe en CI | `specs.md` no lo exige |
| P-F5 | Node en Vercel | **Verificado 2026-10-11:** Vercel compila con Node 24 (por defecto), 22 y 20, no con 26. `engines.node` = `>=24.0.0`; en Vercel se usa 24.x | Documentación de Vercel; el desarrollo local sigue en 26.10.0 |
| P-F6 | Caché de imágenes: tope de entradas y caducidad | Sin tope definido; se propone un máximo de 200 entradas | Las respuestas opacas consumen cuota de almacenamiento; `specs.md` no fija límites |
| P-F7 | Tiempo de espera al validar una URL de imagen (RF-15) | 10 s; pasado el tiempo se trata como "no carga" (en línea) | `specs.md` no lo define |
| P-F8 | Actualización del service worker | `prompt` sin UI: se activa en el siguiente arranque | Una UI de actualización sería funcionalidad no listada |

### 10.3 Riesgos conocidos

- La capa offline y de sincronización es el mayor riesgo técnico (ADR-001): se mitiga con el mock de dos dispositivos y pruebas de conflicto desde el inicio.
- Respuestas opacas de imágenes de otros orígenes: no se pueden validar en el service worker y cuentan mucho en la cuota (P-F6).
- Dependencias de última generación (TypeScript, Vite 8, Vitest 5, react-router 8, vite-plugin-pwa 2): las fijaciones de §2 se revisan con un `npm ci` y la suite completa antes de aprobar la fase de implementación.
- La animación de depósito (`flyChip`) usa la API de animaciones, no cubierta por jsdom: se verifica en Playwright.

### 10.4 Trabajo derivado al aprobar este documento

1. Actualizar `architecture/er_diagram.md` y `docs/adr/001-database-selection.md` a inglés (D-11).
2. Registrar D-02 (Tailwind) y, si se aprueba P-F1, el valor por defecto de `imageSide` en `docs/specs.md` y en su registro de decisiones.
3. Definir el contrato RPC/tablas para la fase SQL a partir de §5.1.
