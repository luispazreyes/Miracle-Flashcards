# Catálogo de componentes (`apps/web`)

> Referencia: RF-46 en `docs/specs.md`; tokens en `design.md`. Sin animaciones ni microinteracciones (se planifican aparte).

## Átomos (`src/components/ui/`)

### Button — `ui/Button.tsx`
- Props: `variant` (`primary` | `secondary` | `danger` | `text`, def. `primary`), `loading`, y todas las de `<button>`. `type` por defecto `button`.
- Estados: hover, foco (anillo global), deshabilitado (`opacity-60`). `loading` deshabilita y pone `aria-busy` (sin spinner animado).
- A11y: objetivo ≥ 44 px (`objetivo-min`).

### IconButton — `ui/IconButton.tsx`
- Props: `icon` (`IconName`), `label` (obligatoria, se usa como `aria-label`), resto de `<button>`.
- A11y: 44×44 px; el icono es decorativo.

### Avatar — `ui/Avatar.tsx`
- Props: `name` (nombre accesible), `src?`, `size` (`sm` | `md`).
- Sin `src` muestra iniciales (`role="img"` + `aria-label`); con `src`, `<img alt={name}>`.

### Badge — `ui/Badge.tsx`
- Props: `icon`, `tone` (`neutral` | `warning` | `success`), `children` (texto).
- A11y: icono + texto siempre; no depende solo del color.

### Icon — `ui/Icon.tsx` (soporte)
- Iconos SVG decorativos (`aria-hidden`): `check`, `checkCircle`, `folder`, `archive`, `menu`, `close`.

## Carcasa (`src/components/layout/`)

### Sidebar — `layout/Sidebar.tsx`
- Props: `items: { label, to, icon }[]`, `user: User` (mocks).
- Escritorio (≥ `md`): panel lateral de `--ancho-panel-mazos` con marca, `<nav aria-label="Principal">` y usuario. Móvil: barra superior con `IconButton` (`aria-expanded`, `aria-controls`) que muestra/oculta nav y usuario.
- Enlace activo: `NavLink` con `aria-current="page"` y fondo `primario` (no solo color: además `aria-current`).

## Moléculas (`src/components/projects/`)

### ProjectCard — `projects/ProjectCard.tsx`
- Props: `project: Project`, `owner: User` (mocks).
- Toda la tarjeta es un `<Link>` a `/proyectos/:id` (la ruta de detalle aún no existe). Contiene `h2` con el nombre, `Badge` de estado (Activo = success, Archivado = neutral), conteo de mazos/palabras, progreso y `Avatar` del propietario.
- A11y: progreso con `role="progressbar"` (`aria-valuenow`, `aria-valuetext`) más texto `learned/total (%)`; el estado nunca depende solo del color.

## Organismos (`src/components/projects/`)

### ProjectGrid — `projects/ProjectGrid.tsx`
- Props: `projects: Project[]`, `users: User[]` (para resolver el propietario), `loading?`, `error?`, `onRetry?`.
- Layout: `<ul>` en cuadrícula de 1 columna, 2 desde `md`, 3 desde `xl`.
- Estados: carga (`role="status"`), error (`role="alert"`, texto "Error:" + botón Reintentar), vacío (mensaje). Sin animaciones.

## Páginas (`src/pages/`)

### ProjectsPage — `pages/ProjectsPage.tsx` (ruta `/`)
- Compone `Sidebar` + `<main>` con `h1` "Proyectos" y `ProjectGrid` alimentado por `src/mocks` (`projects`, `currentUser`).
- Layout: columna en móvil, fila desde `md`; contenido limitado por `--ancho-contenido`.
