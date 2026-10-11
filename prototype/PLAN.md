# Plan de implementación del prototipo

Fuente: `docs/prototype-spec.md` (si hay contradicción con `docs/specs.md`, gana `specs.md`).
Stack: React + TypeScript + Tailwind v4 (Vite). Datos placeholder en memoria; sin backend.

## Reglas de trabajo
- Una pantalla a la vez. **No se empieza la siguiente sin feedback e instrucción explícita.**
- Cada pantalla implementa todos los estados de su tabla (vacío, carga, error incluidos).
- Sin valores visuales hardcodeados: todo sale de `src/styles/tokens.css` (§A).
- Cada pantalla cierra con: axe sin violaciones, teclado, 320/768/1152 px, `prefers-reduced-motion`, 3 temas (§B.2).
- `src/proto/PanelPrototipo.tsx` (selector de estado y tema) es solo para revisión; no es producto.

## Base (hecha)
- Vite + React + TS + Tailwind v4, Vitest + Testing Library + axe-core.
- Tokens §A.1, A.3–A.6 (temas blanco/azul/oscuro, foco, objetivo táctil, motion, reduced-motion). Script inline anti-parpadeo (RF-42).
- Componentes base: `Button`, `TextField`, `Alert`, `Icon`, `SkipLink`.

## Orden de pantallas

| # | Pantalla | RF | Depende de | Estado |
|---|---|---|---|---|
| 1 | F-01 Acceso con enlace mágico (`/acceso`) | 09, 37, 41 | Base | Hecha, aprobada |
| 2 | Shell de app: barra superior + indicador de sync F-09 + navegación + react-router | 14, 22, 28, 41 | 1 | Hecha, aprobada |
| 3 | F-02 Gestión de mazos (columna izq. de `/mazos`) | 16, 19, 24, 35 | 2; componentes Diálogo, Menú | Hecha, en revisión |
| 4 | F-03 Panel de palabras (grupos, combobox, arrastre + alternativa) | 17, 18, 20, 23, 33, 34, 40, 43, 45 | 3; Combobox | Hecha, en revisión; animación de arrastre y depósito (RF-45) implementada |
| 5 | F-04 Crear/editar palabra (diálogo / pantalla completa) | 03, 08, 15, 17, 19, 32, 36, 39 | 4 | Hecha, en revisión |
| 6 | F-05 Sesión de estudio (flashcard + volteo) | 01–07, 12, 13, 25, 31, 35 | 3 | Hecha, en revisión |
| 7 | F-06 Fin de sesión / mazo sin pendientes | 38 | 6 | Hecha, en revisión |
| 8 | F-07 Progreso y reactivación (`/progreso`) | 26, 27, 30 | 3 | Hecha, en revisión |
| 9 | F-08 Apariencia y preferencias (`/ajustes`) + presets §A.2 | 10, 11, 12, 42, 41 | 2 | Hecha, en revisión |
| 10 | F-09 completa: banner offline, fallo de sync, instalar PWA | 14, 21, 22, 28, 29 | 2 | Hecha, en revisión |

Notas de orden: el shell (2) va antes de F-02 porque F-09 vive en la barra superior de todas las pantallas con sesión. F-06 y F-07 comparten la ruta de reactivación.

## Criterios por pantalla (checklist)
1. Todos los estados de la tabla de su sección en el panel de prototipo.
2. Textos de §B.4 y de la sección, en español.
3. Tokens únicamente; objetivos ≥ 44 px; foco visible.
4. Etiquetas/ARIA, foco inicial y anuncios `aria-live` según su sección.
5. Estado nunca solo por color (icono + texto).
6. Test de axe por estado + tests de comportamiento clave.

## Decisiones tomadas durante la implementación (2026-10-10)
- Color de éxito: `#15803D` → `#166534`. Con `#15803D` el ratio sobre `--color-fondo` del tema Azul y de los presets Menta/Lavanda quedaba entre 4.26 y 4.45 (< 4.5). Detectado por `src/styles/tokens.test.ts`.
- `--color-grupo-otros` en oscuro: `#78350F` → `#6B2F0B` (el texto suave daba 4.29).
- Presets de fondo: cada uno es un conjunto completo de tokens de página (fondo, superficie, texto, bordes, estados, grupos), porque cambiar solo el fondo rompía el contraste con el texto del tema. Un preset de fondo prevalece sobre el tema; Neutro usa el tema.
- Lado de la imagen por defecto: Reverso (`specs.md` RF-12 no define valor inicial).
- Estudio: las dos caras de la tarjeta están en el DOM; el nombre accesible del botón cambia con el estado y el detalle (ejemplo, nota) se anuncia por región viva.
- RF-44 (animaciones): implementado con tokens de motion (`--mov-*`, `--mov-distancia`, `--mov-escala-entrada`), utilidades `anim-*` en `src/index.css` y `src/lib/motion.ts` para esperar las salidas. Las salidas se animan en diálogos, avisos y filas (borrar, quitar, reactivar); menús y tarjeta siguiente solo animan la entrada para no retrasar la interacción. Con movimiento reducido las duraciones valen ~0 y las salidas se aplican al instante. Tests en `src/motion.test.tsx`.
- RF-45 (R44) implementado: la fila arrastrada deja un hueco atenuado y la imagen que sigue al puntero es una copia elevada (`--sombra`, `--mov-escala-elevada`); el mazo bajo la palabra se resalta con borde sólido, fondo y texto "Suelta aquí"; al soltar, una ficha (`volarFicha` en `src/lib/motion.ts`, `--mov-deposito`) viaja y se encoge dentro del mazo y este pulsa (anillo y contador); al soltar fuera, cancelar o duplicado la ficha vuelve a la fila; el menú "Agregar a mazo" dispara el pulso del mazo y de la fila. Con movimiento reducido todo es instantáneo y el aviso de texto sigue. Tests en `src/motion.test.tsx`. Estados de interacción: `TextField` y filas con `transition`. Pendiente: probar a mano en navegador real (la ficha usa la API de animaciones, no cubierta por jsdom).
