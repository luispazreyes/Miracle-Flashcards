# Miracle Flashcards — Especificación de prototipo (`docs/prototype-spec.md`)

> Fecha: 2026-10-10. Fuentes: `docs/specs.md` (única fuente de verdad) y `architecture/er_diagram.md`.
> Si este documento contradice `specs.md`, gana `specs.md`.
> Destinatarios: Claude Code (implementación) y Google Stitch (generación de pantallas). Por eso cada sección es autocontenida y declarativa.
> **Todo el contenido de ejemplo es placeholder**: no hay datos reales. Los textos de UI van en español (S-05).
> Criterio: toda funcionalidad cita sus RF-nn. No se añade nada que `specs.md` no justifique.

## 0. Cómo se derivó el alcance

Las funcionalidades de la sección C salen **solo** de `specs.md` (RF-01 a RF-42). Los ejemplos genéricos "proyectos, tablero de tareas, asignación de personas" no existen en este producto y **no se incluyen**. Su equivalente aquí son mazos, panel de palabras y sesión de estudio.

### Mapa de funcionalidades MVP

| # | Funcionalidad | Requerimientos |
|---|---|---|
| F-01 | Acceso con enlace mágico | RF-09, RF-37, RF-41 |
| F-02 | Gestión de mazos | RF-16, RF-19, RF-24, RF-35 |
| F-03 | Panel de palabras (grupos, arrastrar, menú) | RF-17, RF-18, RF-20, RF-23, RF-33, RF-34, RF-40, RF-43 |
| F-04 | Crear y editar palabra | RF-03, RF-08, RF-15, RF-17, RF-19, RF-32, RF-36, RF-39 |
| F-05 | Sesión de estudio | RF-01 a RF-07, RF-12, RF-13, RF-25, RF-31, RF-35 |
| F-06 | Fin de sesión y mazo sin pendientes | RF-38 |
| F-07 | Progreso y reactivación | RF-26, RF-27, RF-30 |
| F-08 | Apariencia y preferencias | RF-10, RF-11, RF-12, RF-42 |
| F-09 | Offline y sincronización | RF-14, RF-21, RF-22, RF-28, RF-29, RF-41 |
| Transversal | Animaciones de transición (catálogo en §A.5) | RF-44 |

### Navegación global

```
App
├─ /acceso            F-01 (sin sesión)
├─ /mazos             F-02 + F-03 + F-04 (pantalla principal: mazos | panel de palabras)
├─ /estudio/:mazo     F-05 → F-06
├─ /progreso          F-07
└─ /ajustes           F-08
   (indicador de sincronización F-09 visible en la barra superior de todas las pantallas con sesión)
```

---

## A. Sistema de diseño global (Design Tokens)

Regla: **ningún componente usa valores hardcodeados** (CLAUDE.md). Todo valor visual es un token. Los tokens se definen como variables CSS en `:root` y se redefinen por tema con `[data-tema="azul" | "blanco" | "oscuro"]`.

### A.1 Tokens de color — semánticos por tema

Los valores son placeholders de partida; los ratios están calculados (WCAG 2.1) y cumplen AA.

| Token | Blanco | Azul | Oscuro | Uso |
|---|---|---|---|---|
| `--color-fondo` | `#FFFFFF` | `#EAF2FF` | `#0F172A` | Fondo de página |
| `--color-superficie` | `#F3F4F6` | `#FFFFFF` | `#1E293B` | Paneles, tarjetas, diálogos |
| `--color-texto` | `#111827` | `#0B1B33` | `#E5E7EB` | Texto principal |
| `--color-texto-suave` | `#4B5563` | `#44546F` | `#A8B3C5` | Texto secundario |
| `--color-primario` | `#1D4ED8` | `#1E40AF` | `#93C5FD` | Acción principal, foco |
| `--color-sobre-primario` | `#FFFFFF` | `#FFFFFF` | `#0F172A` | Texto sobre primario |
| `--color-borde` | `#6B7280` | `#6B7280` | `#8190A8` | Bordes de controles (UI ≥ 3:1) |
| `--color-error` | `#B91C1C` | `#B91C1C` | `#FCA5A5` | Errores, borrado |
| `--color-exito` | `#15803D` | `#15803D` | `#86EFAC` | Acierto, sincronizado |
| `--color-aviso` | `#92400E` | `#92400E` | `#FCD34D` | Avisos, "sin verificar" |
| `--color-foco` | `#1D4ED8` | `#1E40AF` | `#93C5FD` | Anillo de foco |

Contrastes verificados (texto/fondo): texto sobre fondo 17.7 / 15.3 / 14.4; texto suave 7.6 / 6.8 / 8.4; primario con su texto 6.7 / 7.7 / 9.9; error 6.5 / 6.5 / 9.4; éxito 5.0 / 5.0 / 12.7; aviso 7.1 / 7.1 / 12.4; borde sobre fondo 4.8 / 4.8 / 5.5. Todo ≥ 4.5:1 (texto) y ≥ 3:1 (UI).

**Grupos del panel de palabras** (RF-33, RF-34). Nunca se distinguen solo por color: cada grupo lleva etiqueta de texto e icono (§ NFR de `specs.md`).

| Token | Blanco / Azul | Oscuro | Icono | Etiqueta |
|---|---|---|---|---|
| `--color-grupo-mazo` | `#DBEAFE` | `#1E3A8A` | check en círculo | "En este mazo" |
| `--color-grupo-otros` | `#FEF3C7` | `#78350F` | carpeta | "En otros mazos" |
| `--color-grupo-sin` | `#EDE9FE` | `#4C1D95` | círculo con guion | "Sin mazo" |

Texto sobre estos fondos: 14.5 / 15.9 / 14.9 (claro) y 8.4 / 7.3 / 8.9 (oscuro).

### A.2 Presets de paleta (RF-11)

Solo presets predefinidos, **sin selector de color libre**. Dos familias independientes: *fondo* y *tarjeta*. Cada preset es un par `{fondo, texto}` que ya cumple AA; el usuario no puede combinarlos de forma que rompa el contraste porque cada preset de tarjeta define su propio texto.

| Preset | Fondo | Tarjeta (fondo / texto) |
|---|---|---|
| `neutro` | `--color-fondo` del tema | `#FFFFFF` / `#111827` |
| `menta` | `#E6F4EA` | `#F0FDF4` / `#14532D` |
| `arena` | `#FBF3E4` | `#FFFBEB` / `#451A03` |
| `lavanda` | `#EFEAFB` | `#F5F3FF` / `#2E1065` |
| `grafito` | `#1F2937` | `#111827` / `#F9FAFB` |

Cada preset debe pasar la verificación de contraste en CI antes de publicarse. Presets nuevos requieren registrarlos primero aquí.

### A.3 Tipografía

| Token | Valor | Uso |
|---|---|---|
| `--fuente-base` | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | Toda la UI |
| `--fuente-tarjeta` | igual que base | Término en tarjeta |
| `--texto-xs` | `0.75rem` | Etiquetas auxiliares (mínimo absoluto) |
| `--texto-sm` | `0.875rem` | Metadatos |
| `--texto-base` | `1rem` | Cuerpo |
| `--texto-lg` | `1.25rem` | Subtítulos |
| `--texto-xl` | `1.5rem` | Títulos de pantalla |
| `--texto-tarjeta` | `clamp(1.75rem, 6vw, 3rem)` | Palabra en la tarjeta |
| `--peso-normal` / `--peso-fuerte` | `400` / `600` | |
| `--interlineado` | `1.5` | Cuerpo (WCAG 1.4.12) |

El texto debe poder ampliarse al 200 % sin perder contenido ni funcionalidad; usar `rem`.

### A.4 Espaciado, radios, sombras, tamaños

| Grupo | Tokens |
|---|---|
| Espaciado (base 4 px) | `--esp-1: 0.25rem`, `--esp-2: 0.5rem`, `--esp-3: 0.75rem`, `--esp-4: 1rem`, `--esp-6: 1.5rem`, `--esp-8: 2rem`, `--esp-12: 3rem` |
| Radios | `--radio-sm: 0.25rem`, `--radio-md: 0.5rem`, `--radio-lg: 1rem`, `--radio-pill: 999px` |
| Sombras | `--sombra-1: 0 1px 2px rgb(0 0 0 / .12)`, `--sombra-2: 0 4px 12px rgb(0 0 0 / .16)`, `--sombra-3: 0 12px 32px rgb(0 0 0 / .24)` |
| Objetivo táctil | `--objetivo-min: 2.75rem` (44 px, obligatorio) |
| Anillo de foco | `--foco-ancho: 3px`, `--foco-desfase: 2px` (siempre visible, nunca `outline: none` sin sustituto) |
| Contenedor | `--ancho-contenido: 72rem`, `--ancho-panel-mazos: 18rem` |
| Breakpoints | `--bp-m: 48rem` (768 px), `--bp-l: 72rem` (1152 px) |

### A.5 Motion

| Token | Valor | Uso |
|---|---|---|
| `--mov-rapido` | `120ms` | Hover, foco |
| `--mov-medio` | `240ms` | Diálogos, paneles |
| `--mov-volteo` | `400ms` | Volteo de tarjeta (RF-02) |
| `--mov-curva` | `cubic-bezier(.2,0,0,1)` | Curva estándar |

Con `prefers-reduced-motion: reduce` todos los `--mov-*` valen `0.01ms` y el volteo se sustituye por un cambio instantáneo con fundido de 0 ms (sin rotación 3D).

**Catálogo de transiciones (RF-44).** La app no debe verse plana: cada cambio visible de la tabla se anima con tokens de motion (nunca duraciones o curvas fijas en el componente). Son breves y sutiles, no bloquean la interacción (se puede actuar mientras corren) y no son el único indicador del cambio (texto, icono y `aria-live` siguen presentes). Con movimiento reducido todas pasan a instantáneas y sin desplazamiento.

| Elemento | Transición | Duración / curva |
|---|---|---|
| Volteo de tarjeta (RF-02) | Rotación 3D | `--mov-volteo` / `--mov-curva` |
| Cambio a la tarjeta siguiente (F-05) | Entrada con fundido y ligero desplazamiento; la tarjeta anterior no se retrasa (la respuesta es inmediata) | `--mov-medio` |
| Diálogos | Fundido del fondo y entrada de la caja (escala o desplazamiento corto) | `--mov-medio` |
| Menús y combobox | Entrada con fundido y desplazamiento corto; se cierran al instante (el foco vuelve al disparador sin esperas) | `--mov-rapido` |
| Avisos (toast) | Entrada y salida con fundido y desplazamiento | `--mov-medio` |
| Filas de listas (mazos, palabras, pendientes/aprendidas) | Entrada al aparecer; salida al borrar, quitar del mazo o reactivar. Al cambiar de grupo la fila entra de nuevo en su grupo destino | `--mov-medio` |
| Navegación entre pantallas | Fundido de entrada del contenido (el foco pasa al título de inmediato) | `--mov-medio` |
| Cambio de tema o preset de paleta | Transición de `background-color`, `color` y `border-color` | `--mov-medio` |
| Botones, enlaces, pestañas | Hover, foco y pulsado | `--mov-rapido` |
| Indicador de sincronización (F-09) | Cambio de color e icono; giro de "Sincronizando…" | `--mov-medio` |
| Barra de avance (F-07) | Crecimiento del relleno | `--mov-medio` |

### A.6 Capas (z-index)

`--capa-base: 0`, `--capa-sticky: 10`, `--capa-menu: 20`, `--capa-dialogo: 30`, `--capa-aviso: 40`.

### A.7 Componentes base reutilizables

| Componente | Variantes y reglas |
|---|---|
| Botón | primario, secundario, peligro, texto; alto ≥ `--objetivo-min`; estados: normal, hover, foco, activo, deshabilitado, cargando (con `aria-busy`) |
| Campo de texto | etiqueta visible siempre (no solo placeholder), ayuda, error enlazado con `aria-describedby`, contador cuando hay límite |
| Menú desplegable con búsqueda | patrón combobox ARIA (`role="combobox"`, `aria-expanded`, `aria-activedescendant`) |
| Diálogo | `role="dialog"`/`alertdialog`, `aria-modal`, foco atrapado, Esc cierra, devuelve el foco al disparador |
| Aviso / toast | `role="status"` (informativo) o `role="alert"` (error); no desaparece solo si requiere acción |
| Insignia de estado | siempre texto + icono, nunca solo color |
| Tarjeta de palabra (fila) | ver F-03 |
| Flashcard | ver F-05 |
| Indicador de sincronización | ver F-09 |
| Estado vacío / carga / error | cada lista y pantalla define los tres (§ B.3) |

---

## B. Estándares WCAG 2.1 AA y usabilidad

### B.1 Accesibilidad (obligatoria, CLAUDE.md)

| Criterio | Regla de implementación |
|---|---|
| 1.4.3 Contraste (texto) | ≥ 4.5:1; texto grande (≥ 24 px, o ≥ 18.66 px en negrita) ≥ 3:1 |
| 1.4.11 Contraste (no texto) | Bordes de controles, iconos informativos y foco ≥ 3:1 |
| 1.4.1 Uso del color | Estado nunca solo por color: grupos de palabras, acierto/fallo, "sin verificar" y "sin sincronizar" llevan icono y texto |
| 1.4.4 / 1.4.10 | Zoom 200 % y reflujo a 320 px de ancho sin scroll horizontal |
| 1.4.12 Espaciado de texto | Sin pérdida al aumentar interlineado y espaciado |
| 2.1.1 / 2.1.2 Teclado | Todo es operable con teclado; sin trampas de foco (los diálogos devuelven el foco al cerrarse) |
| 2.4.3 / 2.4.7 | Orden de foco lógico; foco siempre visible con `--color-foco` |
| 2.4.1 Saltar bloques | Enlace "Saltar al contenido" al inicio |
| 2.5.5 / objetivo táctil | ≥ 44×44 px (`--objetivo-min`) |
| 2.5.1 Gestos | **Arrastrar (RF-18) siempre tiene alternativa sin arrastre**: el menú desplegable de RF-20 |
| 2.3.3 / movimiento | Respetar `prefers-reduced-motion` (A.5) |
| 3.3.1 / 3.3.3 | Errores identificados en texto, indicando el campo y cómo corregirlo |
| 3.3.4 Prevención | Acciones destructivas con confirmación (RF-19) |
| 4.1.2 / 4.1.3 | Nombre, rol y valor correctos; mensajes de estado con `aria-live` |
| `lang` | `<html lang="es">`; el término en inglés de la tarjeta lleva `lang="en"` |

**Teclado en la sesión de estudio** (F-05): solo navegación estándar. `Espacio` o `Enter` voltea la tarjeta (es un botón); los botones de respuesta se alcanzan con `Tab` y se activan con `Enter`. No hay atajos de letra propios (decisión 2026-10-10: no están en `specs.md`).

### B.2 Verificación previa al cierre de fase (CLAUDE.md)

1. axe sin violaciones en cada pantalla y en cada tema (blanco, azul, oscuro) y preset.
2. Recorrido completo solo con teclado.
3. Revisión con lector de pantalla (NVDA o VoiceOver): lectura de la tarjeta, de los grupos del panel y de los mensajes de estado.
4. Verificación a 320 px, 768 px y 1152 px, y con zoom 200 %.
5. Verificación con `prefers-reduced-motion: reduce`.

### B.3 Usabilidad

| Principio | Regla |
|---|---|
| Flujos cortos | Estudiar un mazo: ≤ 2 acciones desde `/mazos` (RF-35, botón "Estudiar"). Crear palabra: formulario en una sola vista |
| Feedback inmediato | Toda acción confirma en < 100 ms (cambio visual) o muestra estado de carga |
| Estados obligatorios | Cada pantalla y lista define **vacío, carga y error** |
| Destructivo | Borrar palabra o mazo: diálogo de confirmación, borrado definitivo (RF-19). Quitar de un mazo: confirmación breve porque elimina progreso (RF-40) |
| Prevención de errores | Validación en línea, nombre del campo en el error (RF-16, RF-39) |
| Offline primero | Estudiar, agregar y editar funcionan sin red (RF-28); nunca se bloquea la UI por falta de conexión |
| Consistencia | Mismos componentes y textos para la misma acción en todas las pantallas |
| Responsive | Móvil primero. < 768 px: una columna con navegación por pestañas; ≥ 768 px: dos paneles (RF-16: mazos a la izquierda, palabras a la derecha) |
| Tono | Español neutro, frases cortas, sin jerga técnica |

### B.4 Textos y mensajes comunes (placeholder)

| Situación | Mensaje |
|---|---|
| Campo obligatorio vacío | "Falta el campo «Inglés». Escríbelo para crear la palabra." |
| Nombre de mazo repetido | "Ya tienes un mazo con ese nombre. Elige otro." |
| Palabra repetida en el mazo | "«{palabra}» ya está en este mazo." |
| Inglés ya existente al crear | "Ya existe una palabra con ese inglés. Puedes continuar." |
| Sin conexión | "Sin conexión. Tus cambios se guardan en este dispositivo." |
| Error genérico | "No se pudo completar la acción. Inténtalo de nuevo." |

---

## C. Funcionalidades del MVP

Convención de cada subsección: **Propósito · Componentes · Layout · Estados · Accesibilidad específica**. Los datos mostrados son placeholder (`Palabra A`, `Mazo 1`, `ejemplo.invalid`).

---

### F-01. Acceso con enlace mágico
**Requerimientos:** RF-09, RF-37, RF-41.

**Propósito.** Entrar a la cuenta solo con el email, sin contraseña. El email identifica de forma única al usuario. Solo el primer acceso requiere red; luego la sesión persiste sin conexión.

**Componentes.**
- Logotipo y título "Miracle Flashcards".
- Campo `Correo electrónico` (tipo `email`, `autocomplete="email"`).
- Botón primario "Enviar enlace de acceso".
- Mensaje de confirmación "Revisa tu correo. El enlace caduca en 1 hora y solo se puede usar una vez."
- Cuenta regresiva de 60 s sobre el botón (RF-37).
- Mensaje de enlace inválido con botón "Solicitar enlace nuevo".

**Layout.** Tarjeta centrada, ancho máximo 24 rem, sobre `--color-fondo`. Una sola columna. Sin navegación global.

**Estados.**
| Estado | Comportamiento |
|---|---|
| Inicial | Campo vacío, botón habilitado |
| Validando | Email inválido: error en línea "Escribe un correo válido." |
| Enviando | Botón en estado cargando, `aria-busy="true"` |
| Enviado | Mensaje de confirmación; botón **deshabilitado 60 s** con cuenta regresiva anunciada cada 10 s por `aria-live="polite"` (no cada segundo); luego reaparece "Reenviar enlace" |
| Enlace caducado / usado / alterado | Mensaje claro "Este enlace ya no es válido." + botón "Solicitar enlace nuevo"; no inicia sesión |
| Sin conexión (primer acceso) | "Necesitas conexión para iniciar sesión por primera vez." |
| Error de envío | Mensaje de error genérico con reintento |
| Sesión existente sin conexión | Se omite esta pantalla y se abre `/mazos` (RF-41) |

**Accesibilidad.** El foco va al campo al cargar; tras enviar, el foco va al mensaje de confirmación. La cuenta regresiva no depende solo del color.

---

### F-02. Gestión de mazos
**Requerimientos:** RF-16, RF-19, RF-24, RF-35.

**Propósito.** Crear, renombrar, borrar y elegir mazos, e iniciar el estudio de uno. Es la columna izquierda de `/mazos`.

**Componentes.**
- Lista de mazos (`role="listbox"` o lista de botones con `aria-current`), cada ítem con nombre, contador de palabras y botón **"Estudiar"** (RF-35).
- Botón "Nuevo mazo" → campo de nombre en línea con contador `n/60`.
- Menú de acciones por mazo (botón "Más acciones"): "Renombrar", "Borrar".
- Diálogo de confirmación de borrado.
- Ítem especial "Todas las palabras" (sin mazo seleccionado, RF-34).

**Layout.** Columna izquierda de `--ancho-panel-mazos` (18 rem), fija con scroll propio. En móvil (< 768 px) es una pestaña "Mazos" a pantalla completa. Cada ítem ≥ 44 px de alto; "Estudiar" es un botón independiente dentro del ítem.

**Estados.**
| Estado | Comportamiento |
|---|---|
| Vacío | "Aún no tienes mazos. Crea el primero." + botón "Nuevo mazo" |
| Carga | Esqueleto de 3 filas, `aria-busy` |
| Error de carga | "No se pudieron cargar los mazos." + "Reintentar" |
| Mazo seleccionado | Fondo `--color-grupo-mazo`, borde y `aria-current="true"`; el panel derecho se actualiza (F-03) |
| Nombre inválido | Vacío (tras recortar), > 60 caracteres o duplicado sin distinguir mayúsculas ni acentos: no se guarda, se indica el motivo (RF-16) |
| Mazo sin palabras | "Estudiar" deshabilitado con razón accesible ("Este mazo no tiene palabras") |
| Mazo sin pendientes | "Estudiar" lleva a F-06 (no inicia sesión vacía, RF-38) |
| Confirmar borrado | Diálogo: "¿Borrar «Mazo 1»? Sus palabras se conservan y quedarán sin mazo. Esta acción no se puede deshacer." Botones "Cancelar" (foco inicial) y "Borrar mazo" (peligro). Tras borrar, las palabras aparecen como "Sin mazo" (RF-24) |

**Accesibilidad.** Flechas arriba/abajo recorren la lista; `Enter` selecciona; "Estudiar" es alcanzable con `Tab`. El anuncio de selección usa `aria-live="polite"`.

---

### F-03. Panel de palabras
**Requerimientos:** RF-17, RF-18, RF-20, RF-23, RF-33, RF-34, RF-40, RF-43.

**Propósito.** Ver todas las palabras, distinguir a qué mazos pertenecen y asignarlas a un mazo por arrastre o por menú. Es la columna derecha de `/mazos`.

**Componentes.**
- Encabezado con título dinámico ("Palabras de «Mazo 1»" o "Todas las palabras") y botón "Nueva palabra" (abre F-04).
- Campo de búsqueda de palabras (RF-43: subcadena en inglés o español, sin mayúsculas ni acentos; respeta los grupos; estado "Sin resultados para «{texto}»").
- **Grupos** con encabezado, icono, etiqueta y contador:
  1. "En este mazo" (resaltado `--color-grupo-mazo`, solo con mazo seleccionado)
  2. "En otros mazos" (`--color-grupo-otros`)
  3. "Sin mazo" (`--color-grupo-sin`)
  Orden fijo: 1º, 2º, 3º (RF-33). Sin mazo seleccionado: lista única donde las "Sin mazo" resaltan y van **al final** (RF-34).
- **Fila de palabra**: inglés, español, imagen en miniatura (si hay), insignias de mazos, asa de arrastre, botón "Agregar a mazo", menú "Más acciones" (Editar, Borrar, y "Quitar de este mazo" si pertenece al mazo seleccionado).
- **Menú "Agregar a mazo"** (combobox con búsqueda predictiva, RF-20): ignora mayúsculas y acentos, busca por subcadena.
- Diálogos: confirmar borrado de palabra, confirmar quitar de mazo.

**Layout.** Columna derecha flexible, lista vertical con scroll. Cada fila ≥ 56 px. En móvil es la pestaña "Palabras". Las filas son zonas de arrastre; el mazo destino son los ítems de la columna izquierda (en móvil el arrastre se sustituye por el menú).

**Estados.**
| Estado | Comportamiento |
|---|---|
| Vacío (sin palabras) | "Todavía no hay palabras. Crea la primera." + "Nueva palabra" |
| Vacío de grupo | El grupo vacío no se muestra |
| Carga | Esqueleto de filas |
| Error de carga | Mensaje + "Reintentar" |
| Arrastrando | Fila elevada (`--sombra-2`), mazos destino resaltados con borde punteado; anuncio `aria-live`: "Arrastrando «Palabra A». Suéltala sobre un mazo." |
| Soltada con éxito | Aviso "«Palabra A» agregada a «Mazo 1»." |
| Duplicado en el mazo | Se bloquea y se avisa "«Palabra A» ya está en este mazo." (RF-36) |
| Menú abierto sin coincidencias | "Sin resultados para «{texto}»." |
| Quitar de mazo | Diálogo: "¿Quitar «Palabra A» de «Mazo 1»? La palabra no se borra, pero se elimina su progreso en este mazo." (RF-40) |
| Borrar palabra | Diálogo: "¿Borrar «Palabra A»? Está en {n} mazos y se eliminará de todos junto con su progreso. No se puede deshacer." (RF-19) |

**Accesibilidad.** Alternativa sin arrastre (WCAG 2.5.1): el botón "Agregar a mazo" está siempre disponible y es el camino principal en teclado y táctil. Cada fila anuncia: "Palabra A, traducción Palabra A-es, en este mazo". Cada grupo es una `<section>` con `aria-labelledby` y un icono con texto alternativo.

---

### F-04. Crear y editar palabra
**Requerimientos:** RF-03, RF-08, RF-15, RF-17, RF-19, RF-32, RF-36, RF-39.

**Propósito.** Que el usuario construya su propio conjunto de palabras con su traducción, imagen por enlace, ejemplo y nota.

**Componentes.** Formulario en diálogo (escritorio) o pantalla completa (móvil):
- `Inglés` (obligatorio, `lang="en"`).
- `Español` (obligatorio).
- `Enlace de imagen` (opcional, URL `http(s)`), con vista previa.
- `Ejemplo de uso` (opcional).
- `Nota` (opcional, varias líneas).
- Botones "Cancelar" y "Guardar palabra".
- Insignia "Imagen sin verificar" (con icono y texto).

**Layout.** Una columna, etiquetas arriba, ancho máximo 32 rem. Los campos obligatorios se marcan con texto "(obligatorio)", no solo con asterisco. La palabra creada aparece en el panel derecho (RF-17).

**Estados.**
| Estado | Comportamiento |
|---|---|
| Vacío / nuevo | Todos los campos vacíos |
| Edición | Campos precargados; título "Editar palabra" |
| Obligatorio faltante | No se crea; error en línea nombrando el campo (RF-39) |
| Inglés duplicado (RF-36) | Aviso no bloqueante: "Ya existe una palabra con ese inglés. Puedes continuar." |
| Imagen: validando | Indicador "Comprobando imagen…" |
| Imagen válida | Vista previa con texto alternativo editable no requerido; descripción por defecto "Imagen de la palabra" |
| Imagen inválida | Error "El enlace no es http(s) o no carga como imagen." (RF-15) |
| Imagen sin conexión | Se guarda como **sin verificar** con aviso visible; se valida al recuperar la conexión; si falla se retira y se avisa (RF-15) |
| Guardando | Botón cargando |
| Guardado | Cierra el diálogo, aviso "Palabra guardada", foco a la fila creada |
| Error al guardar | Error con "Reintentar"; no se pierde lo escrito |
| Sin conexión | Funciona igual; el cambio queda local (RF-28) |

**Accesibilidad.** El foco inicial va al primer campo; al fallar la validación, al primer campo con error y se enumeran todos los errores en un resumen `role="alert"`.

---

### F-05. Sesión de estudio
**Requerimientos:** RF-01 a RF-07, RF-12, RF-13, RF-25, RF-31, RF-35.

**Propósito.** Estudiar un mazo en dirección inglés → español hasta agotar las pendientes. Una palabra pasa a aprendida con 3 aciertos consecutivos; un fallo reinicia el contador.

**Componentes.**
- Barra superior: nombre del mazo, botón "Salir", contador de pendientes.
- **Flashcard** (botón accesible): frente con el término en inglés (RF-01); al activarla se voltea y muestra el español (RF-02).
- Imagen opcional, en frente, reverso o ambos según la preferencia global (RF-12).
- Ejemplo de uso y nota si existen (RF-32), visibles en el reverso.
- Tras voltear: botones "Acerté" y "No acerté" (RF-04), con icono y texto.
- Indicador de racha de la palabra: "Aciertos seguidos: 1 de 3" (RF-06, RF-07), como texto y puntos con icono.

**Layout.** Columna centrada. Flashcard de proporción ~3:2, ancho máximo 36 rem, con `--radio-lg` y `--sombra-2`, usando el preset de tarjeta elegido (RF-11). Botones de respuesta debajo, lado a lado, cada uno ≥ 56 px. La barra superior es fija.

**Estados.**
| Estado | Comportamiento |
|---|---|
| Cargando mazo | Esqueleto de tarjeta |
| Frente | Texto en inglés; instrucción "Toca o pulsa Espacio para ver la traducción" |
| Reverso | Español + ejemplo/nota; aparecen los botones de respuesta |
| Acierto | Contador +1; si llega a 3: insignia "¡Aprendida!" y sale de pendientes (RF-07). La tarjeta vuelve a mostrarse si no está aprendida (RF-06) |
| Fallo | Contador a 0; permanece pendiente y vuelve en la pasada siguiente (RF-05, RF-31) |
| Orden | Pendientes en pasadas barajadas; con ≥ 2 pendientes no se repite la misma tarjeta seguida (RF-31) |
| Imagen offline no vista | Se omite sin error; la tarjeta se estudia sin imagen (RF-14) |
| Imagen en carga | Marcador de posición con el tamaño reservado (sin saltos de diseño) |
| Sin pendientes | No se inicia; se muestra F-06 (RF-38) |
| Agotadas durante la sesión | Se muestra F-06 con el resumen |
| Salir | Sale sin pedir confirmación: el progreso ya está guardado en cada respuesta (RF-21) |
| Error al guardar respuesta | El progreso queda en cola local y reintenta (RF-22); la sesión no se interrumpe |

**Accesibilidad.** La flashcard es un `<button>` con `aria-pressed` o `aria-expanded` y su nombre cambia: "Tarjeta: {inglés}. Pulsa para ver la traducción" → "Traducción: {español}". Al voltear, el contenido nuevo se anuncia con `aria-live="polite"` y el foco pasa al botón "Acerté". La animación de volteo respeta `prefers-reduced-motion` (A.5). Acierto/fallo no se comunican solo con verde/rojo: llevan icono y texto.

---

### F-06. Fin de sesión y mazo sin pendientes
**Requerimientos:** RF-38.

**Propósito.** Evitar un callejón sin salida cuando se agotan las pendientes o se intenta estudiar un mazo sin ellas. No se inicia una sesión vacía.

**Componentes.**
- Título: "¡Sesión terminada!" o "Este mazo no tiene palabras pendientes".
- Resumen de la sesión: aciertos y fallos (solo si hubo sesión).
- Botones: **"Reactivar palabras"** (lleva a `/progreso` del mazo) y **"Volver a mazos"**.

**Layout.** Tarjeta centrada, resumen en dos cifras grandes (`--texto-xl`) con icono, botones apilados en móvil y en fila en escritorio.

**Estados.**
| Estado | Comportamiento |
|---|---|
| Tras sesión | "Aciertos: 12 · Fallos: 3" (placeholder) |
| Sin sesión (mazo sin pendientes) | Solo el aviso, sin resumen |
| Mazo sin palabras | Mensaje específico "Este mazo no tiene palabras" con acción "Volver a mazos" |

**Accesibilidad.** El foco va al título al aparecer, que se anuncia con `role="status"`. Orden de tabulación: "Reactivar palabras", luego "Volver a mazos".

---

### F-07. Progreso y reactivación
**Requerimientos:** RF-26, RF-27, RF-30.

**Propósito.** Ver cuánto se ha avanzado por mazo y reactivar palabras aprendidas. Contador y estado son por palabra dentro de cada mazo.

**Componentes.**
- Selector de mazo (RF-26). Las palabras sin mazo no tienen progreso y no aparecen.
- Contadores: "Pendientes: n", "Aprendidas: n".
- Pestañas o dos listas: "Pendientes" y "Aprendidas". Cada fila muestra palabra y, en pendientes, "Aciertos seguidos: x de 3".
- Botón "Reactivar" por fila aprendida (RF-27).
- Barra de avance (texto + valor numérico, no solo visual).

**Layout.** Cabecera con selector y contadores; debajo, pestañas "Pendientes | Aprendidas". En escritorio las dos listas pueden mostrarse en columnas. Filas ≥ 48 px.

**Estados.**
| Estado | Comportamiento |
|---|---|
| Sin mazos | "Crea un mazo para ver tu progreso." |
| Mazo sin palabras | "Este mazo no tiene palabras." |
| Lista vacía | "Aún no has aprendido ninguna palabra." / "No quedan palabras pendientes." |
| Carga / error | Esqueleto / mensaje con "Reintentar" |
| Reactivando | Fila pasa a Pendientes con contador en 0 (RF-27); aviso "«Palabra A» vuelve a pendientes de «Mazo 1»." |
| Palabra en dos mazos | Cuenta en cada mazo con su propio estado (RF-30) |

**Accesibilidad.** Pestañas con patrón `tablist`. Los contadores tienen etiqueta textual. La reactivación se anuncia por `aria-live`.

---

### F-08. Apariencia y preferencias
**Requerimientos:** RF-10, RF-11, RF-12, RF-42.

**Propósito.** Personalizar la apariencia sin romper el contraste. Las preferencias se guardan con la cuenta, funcionan sin conexión y se aplican antes del primer pintado.

**Componentes.**
- Selector de **tema** (RF-10): "Azul", "Blanco", "Oscuro" (grupo de radio con vista previa).
- Selector de **paleta de fondo** (RF-11): presets de A.2, con muestra y nombre.
- Selector de **paleta de tarjeta** (RF-11): presets de A.2.
- Selector de **lado de la imagen** (RF-12): "Frente", "Reverso", "Ambos".
- Vista previa de una flashcard placeholder que refleja los cambios en vivo.
- Botón "Cerrar sesión" (RF-41).

**Layout.** Formulario de una columna con secciones, y la vista previa a la derecha (escritorio) o arriba (móvil). Los cambios se aplican al instante, sin botón "Guardar".

**Estados.**
| Estado | Comportamiento |
|---|---|
| Sin sesión | Se usa la preferencia del sistema (claro u oscuro) (RF-42) |
| Primer login sin preferencia guardada | Tema según el sistema (claro → Blanco, oscuro → Oscuro); "Azul" solo si lo elige el usuario |
| Primera carga | El tema se aplica antes del primer pintado (script inline en `<head>` + caché local) para evitar parpadeo |
| Guardando | Indicador discreto "Guardado" tras aplicar |
| Sin conexión | Se guarda localmente y se sincroniza después (RF-42); en conflicto gana el cambio más reciente |
| Cerrar sesión con cambios sin sincronizar | Diálogo: "Tienes cambios sin sincronizar. Si cierras sesión, se perderán." con "Cancelar" y "Cerrar sesión igualmente" (RF-41) |
| Cerrar sesión sin pendientes | Cierra directamente |

**Accesibilidad.** Los presets muestran nombre y vista previa, no solo color. El cambio de tema no es un cambio de contexto inesperado: no mueve el foco.

---

### F-09. Offline y sincronización
**Requerimientos:** RF-14, RF-21, RF-22, RF-28, RF-29, RF-41.

**Propósito.** Que estudiar, agregar y editar funcionen sin conexión, y que los cambios se sincronicen sin perder nada al volver la red o al usar varios dispositivos.

**Componentes.**
- **Indicador de sincronización** en la barra superior (siempre visible con sesión), con texto e icono:
  - "Sincronizado" (check)
  - "Sin conexión" (nube tachada)
  - "Sincronizando…" (flechas, con movimiento reducible)
  - "Sin sincronizar" (aviso) + botón **"Reintentar"** (RF-22)
- Banner de modo sin conexión: "Sin conexión. Tus cambios se guardan en este dispositivo."
- Aviso de imagen no disponible sin conexión (omitida, RF-14).
- Instalación PWA: botón "Instalar app" cuando el navegador lo permita.

**Layout.** Indicador en el extremo derecho de la barra superior (≥ 44 px de alto al ser interactivo); el banner se muestra bajo la barra sin empujar bruscamente el contenido. Ver pestaña "Mazos" para su contexto.

**Estados.**
| Estado | Comportamiento |
|---|---|
| En línea y al día | "Sincronizado" |
| Sin conexión | "Sin conexión"; todo sigue funcionando (RF-28) |
| Recuperada la conexión | Pasa a "Sincronizando…" y sincroniza lo pendiente automáticamente (RF-22) |
| Fallo de sincronización | Los cambios locales **no se descartan**; reintento automático con espera creciente (máx. 5); muestra "Sin sincronizar" + "Reintentar" (RF-22) |
| Reintentos agotados | Permanece "Sin sincronizar" hasta reintento manual o conexión recuperada |
| Conflicto multi-dispositivo | Gana el cambio más reciente según la hora del servidor, por campo; el progreso se recalcula desde eventos; el borrado prevalece (RF-29). Sin UI de resolución para el usuario en el MVP |
| Cierre de sesión con pendientes | Ver F-08 |

**Accesibilidad.** Los cambios de estado se anuncian con `aria-live="polite"`; "Sin sincronizar" se anuncia con mayor prioridad (`role="status"`, sin interrumpir). El indicador nunca depende solo del color.

---

## D. Fuera de alcance de este prototipo

Se hereda de `specs.md` §2 y `CLAUDE.md`. **No** se diseñan: apps nativas; cuentas sociales, comunidad o mazos públicos; pagos o analítica de terceros; IA generativa, OCR o voz; colaboración en tiempo real; subida de archivos de imagen (solo enlace); repetición espaciada con fechas; estudio inverso español → inglés; resolución manual de conflictos de sincronización.

## E. Uso con Google Stitch

Para generar pantallas, pasar a Stitch **una sección F-nn a la vez** junto con A (tokens) y B (estándares). Prompt sugerido:

> "Diseña la pantalla {nombre de F-nn} de una PWA de flashcards en español. Usa exactamente los tokens de la sección A, el tema {blanco|azul|oscuro}, los componentes y estados de la subsección F-nn y los estándares WCAG 2.1 AA de la sección B. Contenido placeholder. Genera todos los estados de la tabla."

Pantallas prioritarias: `/mazos` (F-02 + F-03), F-05 (frente y reverso), F-07, F-01. Verificar en cada salida de Stitch el contraste, el objetivo táctil ≥ 44 px y que ningún valor visual quede fuera de los tokens.

## F. Registro de decisiones de este documento

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10-10 | Las funcionalidades se derivan solo de `specs.md`; no se incluyen proyectos, tablero ni asignación de personas. | Criterio del encargo; esos conceptos no están en el PRD. |
| 2026-10-10 | Paletas y tokens de color como placeholders con contraste calculado. | WCAG AA; se revisan al aprobar `docs/design-tokens.md`. |
| 2026-10-10 | Presets de RF-11 definidos como pares fondo/texto. | RF-11 prohíbe color libre; evita combinaciones sin contraste. |
| 2026-10-10 | El arrastre (RF-18) tiene siempre alternativa por menú. | WCAG 2.5.1; coincide con RF-20. |
| 2026-10-10 | Sin atajos de letra en la sesión; solo teclado estándar. | No están en `specs.md` (CLAUDE.md: lo no listado queda fuera). |
| 2026-10-10 | Búsqueda en el panel de palabras: conservada; RF-43 ya registrado en `specs.md`, backlog (HU-15) y plan de pruebas. | `specs.md` es la fuente de verdad; el RF va primero. |
| 2026-10-10 | Barra de avance (F-07) y vista previa (F-08) conservadas. | Derivadas de RF-26 y RF-10/11/12; sin datos nuevos. |
| 2026-10-10 | Presets de RF-11: neutro, menta, arena, lavanda, grafito. | Aprobados; definitivos en `docs/design-tokens.md`. |
| 2026-10-10 | Tema tras el primer login: sigue al sistema. | Coherente con RF-42. |
| 2026-10-10 | Animaciones de transición (RF-44): catálogo en §A.5, con tokens de motion y respeto a `prefers-reduced-motion`. | Requisito nuevo en `specs.md` (R43): evitar una interfaz plana; `specs.md` primero, luego este documento, backlog (HU-16) y plan de pruebas (TC-16.x). |
| 2026-10-10 | Tokens corregidos al implementar: éxito `#166534`; `--color-grupo-otros` (oscuro) `#6B2F0B`. Presets de fondo = conjunto completo de tokens de página. | La verificación automática de contraste (`prototype/src/styles/tokens.test.ts`) mostró ratios < 4.5:1 con los valores iniciales. |
