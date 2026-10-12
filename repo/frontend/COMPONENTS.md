# Catálogo de componentes (`frontend`)

> Regla: **consultar este archivo antes de crear cualquier componente** y no duplicar lo que ya existe. Al crear un componente reutilizable, añadir aquí su entrada: nombre, ruta relativa, props principales y cuándo usarlo.
> Referencias: `docs/specs.md` (fuente de verdad), `docs/frontend-plan.md`, tokens en `src/styles/tokens.css`. Textos de UI en `src/lib/messages.es.ts`.

## Átomos y utilidades de UI (`src/components/`)

### Button — `components/Button.tsx`

- Props: `variant` (`primary` | `secondary` | `danger` | `text`, def. `primary`), `loading`, y todas las de `<button>`.
- Usar para toda acción con texto. Para acciones solo con icono, ver `ActionMenu` / botones con `Icon` + `aria-label`.

### Icon — `components/Icon.tsx`

- Props: `name: IconName`, `className` (def. `size-5`). SVG decorativo.
- Nombres: `check`, `alert`, `info`, `error`, `mail`, `cloudOff`, `sync`, `checkCircle`, `circle`, `folder`, `dash`, `grip`, `search`, `more`, `plusCircle`, `close`, `install`. Añadir nuevos aquí en `paths`.

### Badge — `components/Badge.tsx`

- Props: `icon`, `tone` (`neutral` | `warning` | `success`), `children` (texto).
- Usar para estados cortos; siempre icono + texto (no depende solo del color).

### Alert — `components/Alert.tsx`

- Props: `kind` (`info` | `success` | `error` | `warning`), `role?` (`alert` solo para errores; `status` el resto), `children`, `alertRef?`.
- Usar para mensajes en línea dentro de formularios/páginas.

### TextField — `components/TextField.tsx`

- Props: `label`, `help?`, `error?`, `counter?`, `inputRef?`, resto de `<input>` (sin `id`, se genera).
- Usar para todo campo de texto de una línea.

### TextArea — `components/TextArea.tsx`

- Props: `label`, `inputRef?`, `className?`, resto de `<textarea>`.
- Usar para texto multilínea.

### RadioCards — `components/RadioCards.tsx`

- Props genéricas: `legend`, `name`, `options: { value, label, preview? }[]`, `value`, `onChange`, `help?`.
- Usar para elegir una opción con vista previa (p. ej. ajustes de apariencia).

### Tabs — `components/Tabs.tsx`

- Props: `label`, `tabs: { id, label }[]`, `active`, `onChange`, `prefix`, `className?`. Helpers `tabId(prefix,id)` y `panelId(prefix,id)`.
- Usar para alternar paneles (patrón tabs ARIA).

### ProgressBar — `components/ProgressBar.tsx`

- Props: `percent`, `label`, `text` (texto visible y valor accesible).
- Usar para progreso de aprendizaje.

### WordImage — `components/WordImage.tsx`

- Props: `src`, `alt?` (def. "Imagen de la palabra"), `className?` (fija el tamaño reservado).
- Usar siempre para mostrar la imagen de una palabra.

## Superposiciones y menús (`src/components/`)

### Dialog — `components/Dialog.tsx`

- Props: `open`, `onClose`, `title`, `children`, `alert?` (alertdialog para confirmaciones destructivas), `fullScreenOnMobile?`, `width?` (`md` | `lg`).
- Usar para formularios modales y confirmaciones. Gestiona foco y Esc.

### Popover — `components/Popover.tsx`

- Props: `anchor` (ref), `onClose(reason: 'esc' | 'outside')`, `children`, `width?`, `label?`, `dialog?`.
- Base de `ActionMenu` y `DeckCombobox`; usar para paneles anclados no modales.

### ActionMenu — `components/ActionMenu.tsx`

- Props: `label` (nombre accesible completo), `items: { text, onSelect, danger? }[]`.
- Menú "Más acciones" con flechas, Inicio/Fin y Esc.

### DeckCombobox — `components/DeckCombobox.tsx`

- Props: `decks`, `label`, `buttonText`, `searchLabel`, `onPick(deckId)`.
- Usar para elegir un mazo con búsqueda (p. ej. "Agregar a mazo").

### Toast — `components/Toast.tsx`

- `ToastProvider` (raíz) y hook `useToast()`.
- Usar para confirmaciones breves no bloqueantes.

## Estados y avisos globales (`src/components/`)

### StateViews — `components/StateViews.tsx`

- `LoadingState({ rows?, height? })`, `ErrorState({ text, onRetry })`, `EmptyState({ text, children? })`.
- Usar en todo listado/pantalla para los estados carga/error/vacío.

### SyncIndicator — `components/SyncIndicator.tsx`

- Props: `state` (`synced` | `offline` | `syncing` | `unsynced`), `pending`, `onRetry`.

### OfflineBanner — `components/OfflineBanner.tsx`

- Sin props. Aviso de modo sin conexión.

### InstallApp — `components/InstallApp.tsx`

- Props: `canInstall`, `onInstall`. Botón de instalación PWA (ver `app/useInstallPrompt.ts`).

### SkipLink — `components/SkipLink.tsx`

- Sin props. Enlace "saltar al contenido" (a11y).

### PageTitle — `components/PageTitle.tsx`

- Props: `children`, `className?`. `h1` de página.

## Componentes de dominio (`src/features/`)

Específicos de cada funcionalidad; reutilizar antes de crear equivalentes.

### Mazos — `features/decks/`

- `DecksPane` (`selectedId`, `onSelect`): panel de mazos conectado a repositorios.
- `DeckList` (`decks`, `counts`, `selectedId`, `onSelect`, `onStudy`, `onCreate`, `onRename`, `onDelete`) y `DeckItem` (`deck`, `wordCount`, `selected`, `leaving`, callbacks).
- `DeckForm` (`initial?`, `decks`, `excludeId?`, `submitLabel`, `onSubmit`, `onCancel`): crear/renombrar con detección de duplicados.
- `DeleteDeckDialog` (`deck`, `onCancel`, `onConfirm`): confirmación destructiva.

### Palabras — `features/words/`

- `WordsPanel` (`selectedDeckId`): listado agrupado, con arrastre a mazos.
- `WordRow` (`word`, `memberOf`, `allDecks`, `kind`, `removableFrom`, `leaving`, …) y `WordGroup` (`kind`, `count`, `id`, `children`).
- `WordFormDialog` (`open`, `word`, `words`, `onClose`, `onSaved`) e `ImageField` (+ hook `useImageCheck`).
- `DeleteWordDialog` / `RemoveFromDeckDialog` (`WordDialogs.tsx`): confirmaciones.

### Estudio — `features/study/`

- `Flashcard` (`word`, `flipped`, `imageSide`, `onFlip`, `buttonRef?`).
- `AnswerButtons`, `StreakIndicator` (`StudyParts.tsx`), `SessionEnd` (`reason`, `deckId`, `hits`, `misses`).

### Ajustes — `features/settings/`

- `ThemePicker`, `PalettePicker`, `ImageSidePicker` (`Pickers.tsx`, basados en `RadioCards`), `CardPreview` (`imageSide`), `LogoutButton`.

## Páginas y carcasa

- `app/AppShell.tsx`: carcasa (navegación, `SkipLink`, `OfflineBanner`, `SyncIndicator`).
- Páginas: `features/access/AccessPage`, `features/decks/DecksPage`, `features/study/StudyPage`, `features/progress/ProgressPage`, `features/settings/SettingsPage`. Rutas en `app/router.tsx`.

## Mantenimiento

- Sin valores hardcodeados: usar clases/tokens (`src/styles/tokens.css`); lo verifica `styles/no-hardcoded.test.ts`.
- Cada componente nuevo: prueba con `src/test/axe.ts` cuando sea visual.
