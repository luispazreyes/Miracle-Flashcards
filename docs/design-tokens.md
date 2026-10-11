# Miracle Flashcards — Design Tokens (`docs/design-tokens.md`)

> Fecha: 2026-10-10. **Estado: aprobado por el PO (2026-10-10).** Fuentes: `docs/specs.md` (única fuente de verdad; si este documento la contradice, gana `specs.md`), `docs/prototype-spec.md` §A y el prototipo implementado (`prototype/src/styles/tokens.css`, `presets.ts`, `index.css`).
> Este documento fija los **valores vigentes** de los tokens y el **catálogo componente → animación** (RF-44, RF-45). Donde `prototype-spec.md` §A tenga valores distintos, rigen los de aquí (ver §10).
> Regla de CLAUDE.md: **prohibido usar valores hardcodeados en componentes**. Color, tipografía, espaciado, radios, sombras y motion salen solo de estos tokens.

## 1. Convenciones

- Los tokens son variables CSS. Los de tema se definen en `@theme static` (tema Blanco por defecto) y se redefinen con `[data-tema='azul']` y `[data-tema='oscuro']`.
- Los presets de paleta (RF-11) se aplican en tiempo de ejecución como un conjunto completo de variables (`presets.ts`).
- Nombres en español, salvo los de Tailwind v4 (`--text-*`, `--radius-*`, `--shadow-*`, `--spacing`), que se conservan para que las utilidades funcionen.
- Un token nuevo o un cambio de valor se registra primero aquí (§10) y después en el código. Los pares de color nuevos pasan la verificación de contraste (`prototype/src/styles/tokens.test.ts`) antes de publicarse.
- Soporte de tema (RF-10, RF-42): claro (Blanco), Azul y Oscuro. Antes de iniciar sesión se usa la preferencia del sistema.

## 2. Color por tema (RF-10)

| Token | Blanco | Azul | Oscuro | Uso |
|---|---|---|---|---|
| `--color-fondo` | `#ffffff` | `#eaf2ff` | `#0f172a` | Fondo de página |
| `--color-superficie` | `#f3f4f6` | `#ffffff` | `#1e293b` | Paneles, filas, diálogos, avisos |
| `--color-texto` | `#111827` | `#0b1b33` | `#e5e7eb` | Texto principal |
| `--color-texto-suave` | `#4b5563` | `#44546f` | `#a8b3c5` | Texto secundario |
| `--color-primario` | `#1d4ed8` | `#1e40af` | `#93c5fd` | Acción principal |
| `--color-sobre-primario` | `#ffffff` | `#ffffff` | `#0f172a` | Texto sobre primario |
| `--color-borde` | `#6b7280` | `#6b7280` | `#8190a8` | Bordes de controles (UI ≥ 3:1) |
| `--color-error` | `#b91c1c` | `#b91c1c` | `#fca5a5` | Errores, borrado |
| `--color-exito` | `#166534` | `#166534` | `#86efac` | Acierto, sincronizado, depósito (RF-45) |
| `--color-aviso` | `#92400e` | `#92400e` | `#fcd34d` | Avisos, "sin verificar" |
| `--color-foco` | `#1d4ed8` | `#1e40af` | `#93c5fd` | Anillo de foco |
| `--color-tarjeta` | `#ffffff` | `#ffffff` | `#ffffff` | Fondo de la flashcard (lo sustituye el preset de tarjeta) |
| `--color-sobre-tarjeta` | `#111827` | `#111827` | `#111827` | Texto de la flashcard |

Contraste (WCAG 2.1 AA): texto ≥ 4.5:1 y UI/texto grande ≥ 3:1 sobre `--color-fondo` y `--color-superficie`. Lo verifica `tokens.test.ts` para los tres temas y los cinco presets.

### 2.1 Grupos del panel de palabras (RF-33, RF-34)

Nunca se distinguen solo por color: cada grupo lleva etiqueta de texto e icono (NFR de `specs.md`).

| Token | Blanco / Azul | Oscuro | Icono | Etiqueta |
|---|---|---|---|---|
| `--color-grupo-mazo` | `#dbeafe` | `#1e3a8a` | check en círculo | "En este mazo" |
| `--color-grupo-otros` | `#fef3c7` | `#6b2f0b` | carpeta | "En otros mazos" |
| `--color-grupo-sin` | `#ede9fe` | `#4c1d95` | círculo con guion | "Sin mazo" |

## 3. Presets de paleta (RF-11)

Solo presets predefinidos; **no hay selector de color libre**. Dos familias independientes, *fondo* y *tarjeta*.

- **Preset de fondo:** conjunto completo de tokens de página (fondo, superficie, texto, bordes, estados, grupos). Prevalece sobre el tema; `neutro` usa los tokens del tema elegido. Menta, Arena y Lavanda usan la base clara; Grafito, la base oscura.
- **Preset de tarjeta:** par `{fondo, texto}` que escribe `--color-tarjeta` y `--color-sobre-tarjeta`.

| Preset | Fondo (`--color-fondo`) | Tarjeta fondo / texto |
|---|---|---|
| `neutro` | el del tema | `#ffffff` / `#111827` |
| `menta` | `#e6f4ea` | `#f0fdf4` / `#14532d` |
| `arena` | `#fbf3e4` | `#fffbeb` / `#451a03` |
| `lavanda` | `#efeafb` | `#f5f3ff` / `#2e1065` |
| `grafito` | `#1f2937` | `#111827` / `#f9fafb` |

Base clara de los presets de fondo: superficie `#ffffff`, texto `#111827`, texto suave `#4b5563`, primario `#1d4ed8`, borde `#6b7280`, error `#b91c1c`, éxito `#166534`, aviso `#92400e`, grupos como en §2.1 (claro). Base oscura (Grafito): superficie `#111827`, texto `#e5e7eb`, texto suave `#a8b3c5`, primario `#93c5fd`, borde `#8190a8`, error `#fca5a5`, éxito `#86efac`, aviso `#fcd34d`, grupos como en §2.1 (oscuro).

Presets nuevos: registrarlos primero aquí y en `specs.md` si cambian el alcance de RF-11.

## 4. Tipografía

| Token | Valor | Uso |
|---|---|---|
| `--fuente-base` / `--font-sans` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | Toda la UI |
| `--text-xs` | `0.75rem` | Insignias, ayudas mínimas |
| `--text-sm` | `0.875rem` | Texto secundario |
| `--text-base` | `1rem` | Cuerpo |
| `--text-lg` | `1.25rem` | Subtítulos |
| `--text-xl` | `1.5rem` | Títulos de pantalla |
| `--text-palabra` | `clamp(1.75rem, 6vw, 3rem)` | Palabra en la flashcard |
| `--font-weight-normal` / `--font-weight-semibold` | `400` / `600` | |
| `--interlineado` | `1.5` | Cuerpo (WCAG 1.4.12) |

El texto debe poder ampliarse al 200 % sin perder contenido ni funcionalidad; se usa `rem`.

## 5. Espaciado, radios, sombras y tamaños

| Grupo | Tokens |
|---|---|
| Espaciado (base 4 px) | `--spacing: 0.25rem`; las utilidades `p-1`…`p-12`, `gap-*` y `m-*` son múltiplos de este token |
| Radios | `--radius-sm: 0.25rem`, `--radius-md: 0.5rem`, `--radius-lg: 1rem`, `--radius-pill: 999px` |
| Sombras | `--shadow-1: 0 1px 2px rgb(0 0 0 / 0.12)`, `--shadow-2: 0 4px 12px rgb(0 0 0 / 0.16)`, `--shadow-3: 0 12px 32px rgb(0 0 0 / 0.24)` |
| Objetivo táctil | `--objetivo-min: 2.75rem` (44 px, obligatorio) |
| Anillo de foco | `--foco-ancho: 3px`, `--foco-desfase: 2px`; siempre visible (WCAG 2.4.7), nunca `outline: none` sin sustituto |
| Contenedor | `--ancho-contenido: 72rem`, `--ancho-panel-mazos: 18rem` |
| Breakpoints | Medio: `48rem` (768 px), es el `md` de Tailwind y el que usa el prototipo. Grande: `72rem` (1152 px), solo para revisar el diseño; el prototipo aún no lo usa ni lo define como variable |
| Capas | `--capa-base: 0`, `--capa-sticky: 10`, `--capa-menu: 20`, `--capa-dialogo: 30`, `--capa-aviso: 40` |

## 6. Motion (RF-44, RF-45)

### 6.1 Tokens

| Token | Normal | `prefers-reduced-motion: reduce` | Uso |
|---|---|---|---|
| `--mov-rapido` | `120ms` | `0.01ms` | Hover, foco, pulsado, menús, resaltado del mazo al arrastrar |
| `--mov-medio` | `240ms` | `0.01ms` | Diálogos, avisos, listas, navegación, tema, regreso de la palabra |
| `--mov-volteo` | `400ms` | `0.01ms` | Volteo de la flashcard (RF-02) |
| `--mov-deposito` | `300ms` | `0.01ms` | Depósito de una palabra en un mazo (RF-45) |
| `--mov-curva` | `cubic-bezier(0.2, 0, 0, 1)` | igual | Curva estándar de todas las transiciones |
| `--mov-distancia` | `0.5rem` | `0rem` | Recorrido de las entradas y salidas |
| `--mov-escala-entrada` | `0.96` | `1` | Escala inicial de diálogos |
| `--mov-escala-elevada` | `1.03` | `1` | Palabra elevada durante el arrastre (RF-45) |
| `--default-transition-duration` / `--default-transition-timing-function` | `--mov-rapido` / `--mov-curva` | | Valores por defecto de las utilidades `transition*` |

### 6.2 Reglas

1. Toda duración y curva sale de estos tokens; ningún componente fija milisegundos (`duration-*`, `delay-*`). Lo verifica `src/motion.test.tsx`.
2. Las transiciones son breves y sutiles, **no bloquean ni retrasan la interacción** (se puede actuar mientras corren) y **no son el único indicador de un cambio**: siempre hay texto, icono o aviso `aria-live`.
3. Con `prefers-reduced-motion: reduce` las duraciones valen ~0, los desplazamientos 0 y las escalas 1; el volteo no rota y la ficha del depósito no se dibuja. El resultado final y los avisos son los mismos.
4. Las salidas se animan antes de quitar el elemento del DOM (`esperarSalida` en `src/lib/motion.ts`); menús y tarjeta siguiente animan solo la entrada para no retrasar al usuario.
5. Todo funciona sin conexión (RF-28).

### 6.3 Utilidades de animación (`src/index.css`)

| Utilidad | Efecto | Token de duración |
|---|---|---|
| `anim-entrada` / `anim-salida` | Fundido + desplazamiento corto | `--mov-medio` |
| `anim-fundido` / `anim-fundido-salida` | Fundido | `--mov-medio` |
| `anim-escala` / `anim-escala-salida` | Fundido + escala | `--mov-medio` |
| `anim-menu` | Entrada rápida de menús | `--mov-rapido` |
| `anim-pulso-anillo` | Anillo que se expande y se desvanece (reacción del mazo y de la fila, RF-45) | `--mov-deposito` |
| `anim-pulso-contador` | El contador de palabras crece y vuelve (RF-45) | `--mov-deposito` |
| `.cambiando-tema` | Transición de colores al cambiar tema o paleta | `--mov-medio` |

La ficha del depósito (`volarFicha`, `src/lib/motion.ts`) usa `--mov-deposito` al entrar en el mazo y `--mov-medio` al volver, con `--mov-curva`.

## 7. Catálogo componente → animación

Regla general (RF-44): todo componente interactivo anima hover, foco, pulsado y deshabilitado, y su aparición y salida. "Estado" = transición de color, borde, opacidad o escala con `--mov-rapido` salvo que se indique otro token.

| Componente | Estados interactivos | Aparición / salida | Notas |
|---|---|---|---|
| Botón (primario, secundario, peligro, texto) | Hover, pulsado (`scale 0.98`), deshabilitado (sin escala), cargando (giro) | — | Foco visible con anillo |
| Campo de texto | Foco y error (color de borde, `transition-colors`) | El mensaje de error entra con el campo | |
| Flashcard | Volteo (rotación 3D) | Cambio a la tarjeta siguiente: entrada con fundido y desplazamiento (`anim-entrada`) | Volteo con `--mov-volteo`; sin rotación con movimiento reducido (RF-02) |
| Fila de palabra | Hover (borde y fondo); arrastrando: queda atenuada como hueco | Entrada y salida (`anim-entrada`, `anim-salida`) al agregar, quitar, borrar | RF-45 |
| Palabra arrastrada | Copia elevada (`--shadow-3`, `--mov-escala-elevada`) que sigue al puntero | | RF-45 |
| Ítem de mazo | Hover, selección, destino de soltado (borde punteado) y mazo bajo la palabra (borde sólido, fondo, escala 1.02, texto "Suelta aquí") | Entrada y salida de la fila | RF-45; no depende solo del color |
| Depósito en el mazo | Ficha que viaja y se encoge dentro del mazo; pulso del mazo y de su contador | | `--mov-deposito`; RF-45 |
| Soltar fuera, cancelar o duplicado | La ficha vuelve a la fila | | `--mov-medio`; RF-45 |
| Menú "Agregar a mazo" (combobox) | Opción activa y hover | Entrada rápida (`anim-menu`); cierre instantáneo | La versión breve del depósito es el pulso del mazo y de la fila (RF-20, RF-45) |
| Menú de acciones | Opción activa y hover | `anim-menu`; cierre instantáneo | El foco vuelve al disparador sin espera |
| Diálogo | Botones como "Botón" | Fundido del fondo y entrada de la caja (`anim-fundido`, `anim-escala`); salida animada | `--mov-medio`; foco gestionado de inmediato |
| Aviso (toast) | Botón de cerrar | Entrada y salida (`anim-entrada`, `anim-salida`) | Informativos se cierran solos; errores no |
| Alerta en página | — | `anim-entrada` | |
| Pestañas | Hover, selección | — | |
| Indicador de sincronización | Cambio de color e icono; giro en "Sincronizando…" | Fundido al cambiar de estado | Conserva texto e icono y el anuncio `aria-live` (RF-22) |
| Barra de avance (progreso) | Crecimiento del relleno | — | `--mov-medio` |
| Navegación entre pantallas | — | Fundido del contenido (`anim-fundido`); el foco pasa al título de inmediato | |
| Cambio de tema o preset | Transición de `background-color`, `color`, `border-color`, `fill`, `stroke` | — | `.cambiando-tema`, `--mov-medio` |
| Estados vacío, carga y error | Carga: esqueleto pulsante | — | El esqueleto lleva texto oculto "Cargando…" |

## 8. Accesibilidad de los tokens (CLAUDE.md, WCAG 2.1 AA)

- Contraste ≥ 4.5:1 (texto) y ≥ 3:1 (UI y texto grande) en los tres temas y los cinco presets; se comprueba con `tokens.test.ts`.
- Objetivos táctiles ≥ 44×44 px (`--objetivo-min`); foco siempre visible.
- Nada se comunica solo con color (grupos, estados, mazo destino) ni solo con animación.
- `prefers-reduced-motion: reduce` sustituye todas las animaciones por cambios instantáneos (§6.2).

## 9. Verificación

- `npx vitest run` en `prototype/`: `tokens.test.ts` (contraste de temas y presets) y `motion.test.tsx` (tokens de motion, sin duraciones fijas, movimiento reducido, salidas, arrastre y depósito).
- Revisión manual por pantalla: teclado, 320/768/1152 px, los tres temas y `prefers-reduced-motion`.
- Pendiente: probar a mano la ficha del depósito en un navegador real (jsdom no tiene la API de animaciones).

## 10. Registro de cambios

| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-10-10 | Creación del documento con los valores vigentes del prototipo. | `prototype-spec.md` §A los remitía a este archivo. |
| 2026-10-10 | `--color-exito` pasa de `#15803d` a `#166534` en claro y azul. | Con `#15803d` el ratio sobre fondo Azul y presets Menta y Lavanda quedaba en 4.26–4.45 (< 4.5). |
| 2026-10-10 | `--color-grupo-otros` oscuro pasa de `#78350f` a `#6b2f0b`. | El texto suave sobre el fondo daba 4.29. |
| 2026-10-10 | Los presets de fondo son conjuntos completos de tokens de página. | Cambiar solo el fondo rompía el contraste con el texto del tema. |
| 2026-10-10 | `--color-superficie` del tema Blanco es `#f3f4f6`, y se añaden `--color-tarjeta` y `--color-sobre-tarjeta`. | Valores implementados; el preset de tarjeta los sustituye. |
| 2026-10-10 | Nuevos tokens `--mov-deposito` (300 ms) y `--mov-escala-elevada` (1.03), más `--mov-distancia` y `--mov-escala-entrada`. | RF-45 y RF-44 ampliado (R44); catálogo de §7. |
| 2026-10-10 | Documento aprobado por el PO. | Cumple la convención de CLAUDE.md: artefacto aprobado antes de seguir codificando. |
