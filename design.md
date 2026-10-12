# Miracle Flashcards — Sistema de diseño (`design.md`)

> Fecha: 2026-10-11. Manifiesto del sistema de diseño: solo valores y estados, sin código de componentes.
> **Fuentes:** no se encontraron archivos `.dc.html` ni proyectos de Claude Design accesibles; este manifiesto se consolidó desde el repo: `docs/design-tokens.md` (aprobado por el PO), `frontend/src/styles/tokens.css`, `frontend/src/styles/index.css` y `frontend/src/components/*.tsx`.
> **Precedencia:** `docs/specs.md` es la única fuente de verdad; después `docs/design-tokens.md`. Si este archivo discrepa, ganan ellos.
> Regla de CLAUDE.md: prohibido usar valores hardcodeados en componentes; todo sale de estos tokens.

---

## 1. Paleta por rol semántico

Tema por defecto: **Blanco**. Se cambia con `data-theme="white|blue|dark"`. Contraste WCAG 2.1 AA verificado (texto ≥ 4.5:1, UI ≥ 3:1).

### 1.1 Primarios

| Token | Blanco | Azul | Oscuro | Rol |
|---|---|---|---|---|
| `--color-primario` | `#1d4ed8` | `#1e40af` | `#93c5fd` | Acción principal, selección |
| `--color-sobre-primario` | `#ffffff` | `#ffffff` | `#0f172a` | Texto/icono sobre primario |
| `--color-foco` | `#1d4ed8` | `#1e40af` | `#93c5fd` | Anillo de foco |

### 1.2 Neutros

| Token | Blanco | Azul | Oscuro | Rol |
|---|---|---|---|---|
| `--color-fondo` | `#ffffff` | `#eaf2ff` | `#0f172a` | Fondo de página, campos |
| `--color-superficie` | `#f3f4f6` | `#ffffff` | `#1e293b` | Paneles, filas, diálogos, avisos, hover |
| `--color-texto` | `#111827` | `#0b1b33` | `#e5e7eb` | Texto principal |
| `--color-texto-suave` | `#4b5563` | `#44546f` | `#a8b3c5` | Texto secundario, ayudas |
| `--color-borde` | `#6b7280` | `#6b7280` | `#8190a8` | Bordes de controles (≥ 3:1) |

### 1.3 Estados

| Token | Blanco | Azul | Oscuro | Rol |
|---|---|---|---|---|
| `--color-error` | `#b91c1c` | `#b91c1c` | `#fca5a5` | Errores, borrado, peligro |
| `--color-exito` | `#166534` | `#166534` | `#86efac` | Acierto, sincronizado, depósito |
| `--color-aviso` | `#92400e` | `#92400e` | `#fcd34d` | Avisos, "sin verificar" |

Información (`info`) no tiene color propio: usa `--color-texto`. Los estados siempre llevan icono y texto, nunca solo color (WCAG 1.4.1).

### 1.4 Interactivos (derivados, sin token propio)

| Interacción | Resolución |
|---|---|
| Hover de botón primario / peligro | `opacity: 0.9` |
| Hover de botón secundario, texto, pestaña, fila, opción de radio | fondo `--color-superficie` (en radio y cierre de aviso: `--color-fondo`) |
| Seleccionado | borde y/o fondo `--color-primario`, texto `--color-sobre-primario` (pestañas); borde `--color-primario` (radio marcado) |
| Foco | outline `--foco-ancho` `--color-foco`, desfase `--foco-desfase` |
| Deshabilitado | `opacity: 0.6`, cursor `not-allowed`, sin escala |
| Overlay de diálogo | `--color-texto` al 50 % |

### 1.5 Dominio

| Token | Blanco / Azul | Oscuro | Icono + etiqueta |
|---|---|---|---|
| `--color-grupo-mazo` | `#dbeafe` | `#1e3a8a` | check en círculo · "En este mazo" |
| `--color-grupo-otros` | `#fef3c7` | `#6b2f0b` | carpeta · "En otros mazos" |
| `--color-grupo-sin` | `#ede9fe` | `#4c1d95` | círculo con guion · "Sin mazo" |
| `--color-tarjeta` | `#ffffff` | `#ffffff` | Fondo de la flashcard |
| `--color-sobre-tarjeta` | `#111827` | `#111827` | Texto de la flashcard |

### 1.6 Presets (RF-11; sin selector de color libre)

Preset de fondo (`data-background-palette`): conjunto completo de tokens de página; prevalece sobre el tema. `neutral` = el del tema.

| Preset | `--color-fondo` | Base |
|---|---|---|
| `neutral` | del tema | del tema |
| `mint` | `#e6f4ea` | clara |
| `sand` | `#fbf3e4` | clara |
| `lavender` | `#efeafb` | clara |
| `graphite` | `#1f2937` | oscura (`superficie` `#111827`) |

Preset de tarjeta (`data-card-palette`):

| Preset | `--color-tarjeta` | `--color-sobre-tarjeta` |
|---|---|---|
| `neutral` | `#ffffff` | `#111827` |
| `mint` | `#f0fdf4` | `#14532d` |
| `sand` | `#fffbeb` | `#451a03` |
| `lavender` | `#f5f3ff` | `#2e1065` |
| `graphite` | `#111827` | `#f9fafb` |

---

## 2. Tipografía

| Aspecto | Valor |
|---|---|
| Familia (`--fuente-base` / `--font-sans`) | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` |
| Pesos | `400` normal (cuerpo) · `600` semibold (etiquetas, botones, títulos) |
| Interlineado (`--interlineado`) | `1.5` (WCAG 1.4.12) |
| Unidad | `rem`; ampliable al 200 % sin pérdida |

| Token | Valor | Px | Uso |
|---|---|---|---|
| `--text-xs` | `0.75rem` | 12 | Ayudas mínimas |
| `--text-sm` | `0.875rem` | 14 | Texto secundario, insignias, errores de campo |
| `--text-base` | `1rem` | 16 | Cuerpo, botones, campos |
| `--text-lg` | `1.25rem` | 20 | Subtítulos, título de diálogo |
| `--text-xl` | `1.5rem` | 24 | Título de pantalla |
| `--text-palabra` | `clamp(1.75rem, 6vw, 3rem)` | 28–48 | Palabra en la flashcard |

---

## 3. Espaciado y dimensiones

Base 4 px: `--spacing: 0.25rem`. Las utilidades `p-*`, `m-*`, `gap-*` son múltiplos.

| Paso | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|---|
| rem | 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 2.5 | 3 |
| px | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 |

| Token | Valor | Uso |
|---|---|---|
| `--objetivo-min` | `2.75rem` (44 px) | Alto/ancho mínimo táctil, obligatorio |
| `--foco-ancho` / `--foco-desfase` | `3px` / `2px` | Anillo de foco |
| `--ancho-contenido` | `72rem` | Contenedor máximo |
| `--ancho-panel-mazos` | `18rem` | Panel de mazos |
| Breakpoint medio (`md`) | `48rem` (768 px) | Cambio móvil → escritorio |
| Breakpoint grande | `72rem` (1152 px) | Solo revisión de diseño |
| `--capa-base` / `-sticky` / `-menu` / `-dialogo` / `-aviso` | `0` / `10` / `20` / `30` / `40` | Orden z |

## 4. Radios y sombras

| Token | Valor | Semántica |
|---|---|---|
| `--radius-sm` | `0.25rem` | Detalles pequeños |
| `--radius-md` | `0.5rem` | Controles: botones, campos, pestañas, avisos, opciones |
| `--radius-lg` | `1rem` | Contenedores: diálogo, flashcard |
| `--radius-pill` | `999px` | Insignias, barra de avance, spinner |

| Token | Valor | Semántica |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgb(0 0 0 / 0.12)` | Elevación baja (reposo) |
| `--shadow-2` | `0 4px 12px rgb(0 0 0 / 0.16)` | Menús, popovers |
| `--shadow-3` | `0 12px 32px rgb(0 0 0 / 0.24)` | Diálogos, avisos, palabra arrastrada |

## 5. Motion (RF-44, RF-45)

| Token | Normal | `prefers-reduced-motion` | Uso |
|---|---|---|---|
| `--mov-rapido` | `120ms` | `0.01ms` | Hover, foco, pulsado, menús |
| `--mov-medio` | `240ms` | `0.01ms` | Diálogos, avisos, navegación, tema, barra de avance |
| `--mov-volteo` | `400ms` | `0.01ms` | Volteo de la flashcard |
| `--mov-deposito` | `300ms` | `0.01ms` | Depósito de palabra en mazo |
| `--mov-curva` | `cubic-bezier(0.2, 0, 0, 1)` | igual | Curva estándar |
| `--mov-distancia` | `0.5rem` | `0rem` | Recorrido de entradas/salidas |
| `--mov-escala-entrada` | `0.96` | `1` | Escala inicial de diálogos |
| `--mov-escala-elevada` | `1.03` | `1` | Palabra elevada al arrastrar |

Ningún componente fija milisegundos; las transiciones no bloquean la interacción ni son el único indicador de cambio.

---

## 6. Componentes y estados

Foco global (todos los interactivos): `outline: 3px solid --color-foco`, `outline-offset: 2px`; nunca se oculta. Todos respetan `--objetivo-min` (44 px) salvo indicación.

### Button
Base: `rounded-md`, borde 1 px, `px-4 py-2`, `text-base` semibold, gap 2, `transition` rápida.

| Estado | Primary | Secondary | Danger | Text |
|---|---|---|---|---|
| Default | fondo `primario`, texto `sobre-primario` | transparente, texto `texto`, borde `borde` | fondo `error`, texto `fondo` | transparente, texto `primario`, subrayado |
| Hover | `opacity 0.9` | fondo `superficie` | `opacity 0.9` | fondo `superficie` |
| Active | `scale 0.98` | `scale 0.98` | `scale 0.98` | `scale 0.98` |
| Disabled | `opacity 0.6`, `not-allowed`, sin escala (también `aria-disabled`) | ídem | ídem | ídem |
| Focus | anillo global | ídem | ídem | ídem |
| Loading | `aria-busy`, spinner circular 16 px (`border-current`, `pill`) | ídem | ídem | ídem |

### Input / TextArea (TextField)
Etiqueta visible semibold; campo `rounded-md`, borde 1 px `borde`, fondo `fondo`, texto `texto`, `px-3 py-2`, `text-base`; ayuda y contador `text-sm texto-suave`.

| Estado | Tratamiento |
|---|---|
| Default | borde `borde` |
| Hover | sin cambio propio definido |
| Active (escribiendo) | = focus |
| Disabled | atributo nativo; sin estilo propio definido |
| Focus | anillo global + borde `primario` |
| Error | borde 2 px `error`, `aria-invalid`; mensaje `text-sm` semibold `error` con icono, entra con `anim-entrada` |

### Badge
`rounded-pill`, borde 1 px, `px-2`, `text-sm` semibold, icono 16 px + texto obligatorios.

| Tono | Texto y borde |
|---|---|
| neutral | `texto` / `borde` |
| warning | `aviso` |
| success | `exito` |

Estados interactivos: no aplica (no es interactivo).

### Card
**Flashcard:** fondo `--color-tarjeta`, texto `--color-sobre-tarjeta`, `radius-lg`, palabra `--text-palabra`.
| Estado | Tratamiento |
|---|---|
| Default | cara frontal |
| Hover | sin cambio propio definido |
| Active / volteada | rotación 3D, `--mov-volteo`; sin rotación con movimiento reducido |
| Disabled | no definido |
| Focus | anillo global |
| Cambio de tarjeta | `anim-entrada` |

**Fila de palabra / ítem de mazo:** fondo `superficie` (grupos con `grupo-*`).
| Estado | Tratamiento |
|---|---|
| Hover | borde y fondo |
| Active / arrastrando | fila atenuada (hueco); copia elevada `shadow-3`, `scale 1.03` |
| Destino de soltado | borde punteado; mazo bajo la palabra: borde sólido, fondo, `scale 1.03`, texto "Suelta aquí" |
| Disabled | no definido |
| Focus | anillo global |

### Alert (en página) y Toast
`rounded-md`, borde 2 px `current`, fondo `superficie`, padding 3, icono + texto `texto`; toast añade `shadow-3` y botón cerrar. Color por tipo vía `current`:

| Tipo | Color | Icono | Rol ARIA |
|---|---|---|---|
| info | `texto` | info | `status` |
| success | `exito` | check | `status` |
| warning | `aviso` | alert | `status` |
| error | `error` | error | `alert` (no se cierra solo) |

Estados: Default = visible (`anim-entrada`); salida `anim-salida`; botón cerrar: hover fondo `fondo`, foco anillo global, 44 px. Informativos se cierran a los 6 s.

### Tabs
`rounded-md`, borde 2 px, `px-4`, semibold, `transition-colors`.

| Estado | Tratamiento |
|---|---|
| Default | borde `borde`, texto `texto` |
| Hover | fondo `superficie` |
| Active / seleccionada | borde y fondo `primario`, texto `sobre-primario`, `aria-selected` |
| Disabled | no definido |
| Focus | anillo global; roving tabindex, flechas/Inicio/Fin |

### RadioCards
Etiqueta-tarjeta `rounded-md`, borde 2 px `borde`, fondo `superficie`, radio nativo 20 px con `accent-primario`.

| Estado | Tratamiento |
|---|---|
| Default | borde `borde` |
| Hover | fondo `fondo` |
| Seleccionado | borde `primario` + radio marcado |
| Disabled | no definido |
| Focus | anillo global |

### Dialog
Overlay `--color-texto` 50 %, `--capa-dialogo`; caja `superficie`, `radius-lg`, `shadow-3`, padding 6, título `text-lg` semibold; ancho `max-w-md` (o `lg`); pantalla completa en móvil para formularios. Entrada `anim-fundido` + `anim-escala`; salida animada; Esc cierra, foco atrapado y devuelto al disparador. Botones internos: ver Button.

### ProgressBar
Pista `h-3`, `radius-pill`, borde 1 px `borde`, fondo `fondo`; relleno `primario`, ancho animado con `--mov-medio` y `--mov-curva`; texto `text-sm texto-suave` con el valor (nunca solo visual). Sin estados interactivos.

---

## 7. Bloque consolidado `:root` / `@theme` (Tailwind v4)

Tema Blanco por defecto. Nombres en español conservados como en `frontend/src/styles/tokens.css`.

```css
@theme static {
  /* Color — tema white por defecto */
  --color-fondo: #ffffff;
  --color-superficie: #f3f4f6;
  --color-texto: #111827;
  --color-texto-suave: #4b5563;
  --color-primario: #1d4ed8;
  --color-sobre-primario: #ffffff;
  --color-borde: #6b7280;
  --color-error: #b91c1c;
  --color-exito: #166534;
  --color-aviso: #92400e;
  --color-foco: #1d4ed8;
  --color-grupo-mazo: #dbeafe;
  --color-grupo-otros: #fef3c7;
  --color-grupo-sin: #ede9fe;
  --color-tarjeta: #ffffff;
  --color-sobre-tarjeta: #111827;

  /* Tipografía */
  --fuente-base: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-sans: var(--fuente-base);
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-palabra: clamp(1.75rem, 6vw, 3rem);
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --interlineado: 1.5;

  /* Espaciado (base 4 px) */
  --spacing: 0.25rem;

  /* Radios */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-pill: 999px;

  /* Sombras */
  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.12);
  --shadow-2: 0 4px 12px rgb(0 0 0 / 0.16);
  --shadow-3: 0 12px 32px rgb(0 0 0 / 0.24);

  /* Motion */
  --mov-rapido: 120ms;
  --mov-medio: 240ms;
  --mov-volteo: 400ms;
  --mov-deposito: 300ms;
  --mov-curva: cubic-bezier(0.2, 0, 0, 1);
  --default-transition-duration: var(--mov-rapido);
  --default-transition-timing-function: var(--mov-curva);
}

:root {
  /* Dimensiones y accesibilidad */
  --objetivo-min: 2.75rem;
  --foco-ancho: 3px;
  --foco-desfase: 2px;
  --ancho-contenido: 72rem;
  --ancho-panel-mazos: 18rem;

  /* Capas */
  --capa-base: 0;
  --capa-sticky: 10;
  --capa-menu: 20;
  --capa-dialogo: 30;
  --capa-aviso: 40;

  /* Motion auxiliar */
  --mov-distancia: 0.5rem;
  --mov-escala-entrada: 0.96;
  --mov-escala-elevada: 1.03;
}

/* Overrides de tema (fuera de @theme) */
[data-theme='blue'] {
  --color-fondo: #eaf2ff;
  --color-superficie: #ffffff;
  --color-texto: #0b1b33;
  --color-texto-suave: #44546f;
  --color-primario: #1e40af;
  --color-foco: #1e40af;
}

[data-theme='dark'] {
  color-scheme: dark;
  --color-fondo: #0f172a;
  --color-superficie: #1e293b;
  --color-texto: #e5e7eb;
  --color-texto-suave: #a8b3c5;
  --color-primario: #93c5fd;
  --color-sobre-primario: #0f172a;
  --color-borde: #8190a8;
  --color-error: #fca5a5;
  --color-exito: #86efac;
  --color-aviso: #fcd34d;
  --color-foco: #93c5fd;
  --color-grupo-mazo: #1e3a8a;
  --color-grupo-otros: #6b2f0b;
  --color-grupo-sin: #4c1d95;
}

/* Presets de fondo (después de los temas) */
[data-background-palette='mint'] { --color-fondo: #e6f4ea; }
[data-background-palette='sand'] { --color-fondo: #fbf3e4; }
[data-background-palette='lavender'] { --color-fondo: #efeafb; }
/* mint | sand | lavender además fijan la base clara de §1.6 (superficie #ffffff, texto #111827, etc.) */
[data-background-palette='graphite'] {
  color-scheme: dark;
  --color-fondo: #1f2937;
  --color-superficie: #111827;
  --color-texto: #e5e7eb;
  --color-texto-suave: #a8b3c5;
  --color-primario: #93c5fd;
  --color-sobre-primario: #0f172a;
  --color-borde: #8190a8;
  --color-error: #fca5a5;
  --color-exito: #86efac;
  --color-aviso: #fcd34d;
  --color-foco: #93c5fd;
  --color-grupo-mazo: #1e3a8a;
  --color-grupo-otros: #6b2f0b;
  --color-grupo-sin: #4c1d95;
}

/* Presets de tarjeta */
[data-card-palette='neutral']  { --color-tarjeta: #ffffff; --color-sobre-tarjeta: #111827; }
[data-card-palette='mint']     { --color-tarjeta: #f0fdf4; --color-sobre-tarjeta: #14532d; }
[data-card-palette='sand']     { --color-tarjeta: #fffbeb; --color-sobre-tarjeta: #451a03; }
[data-card-palette='lavender'] { --color-tarjeta: #f5f3ff; --color-sobre-tarjeta: #2e1065; }
[data-card-palette='graphite'] { --color-tarjeta: #111827; --color-sobre-tarjeta: #f9fafb; }

/* Movimiento reducido (debe ser el último bloque) */
@media (prefers-reduced-motion: reduce) {
  @theme static {
    --mov-rapido: 0.01ms;
    --mov-medio: 0.01ms;
    --mov-volteo: 0.01ms;
    --mov-deposito: 0.01ms;
  }
  :root {
    --mov-rapido: 0.01ms;
    --mov-medio: 0.01ms;
    --mov-volteo: 0.01ms;
    --mov-deposito: 0.01ms;
    --mov-distancia: 0rem;
    --mov-escala-entrada: 1;
    --mov-escala-elevada: 1;
  }
}
```
