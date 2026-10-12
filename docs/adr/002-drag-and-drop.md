# ADR 002 — Librería de Drag & Drop

- **Fecha:** 2026-10-11
- **Estado:** Aceptada
- **Relacionado:** RF-18, RF-45; HU-04, HU-17; paso 12 de `docs/frontend-plan.md`

## Contexto
Hay que arrastrar palabras a mazos y reordenar listas, con teclado y lector de pantalla (WCAG 2.1 AA), táctil en PWA, estilos solo con design tokens y bundle pequeño. Solo se aceptan librerías estables.

## Decisión
`@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0 y `@dnd-kit/utilities` 3.2.2 (versiones exactas) en `monorepo/apps/web`.

## Alternativas descartadas
- `@dnd-kit/react` (línea nueva): menos madura.
- `@hello-pangea/dnd`: solo listas, animaciones opinadas, más pesada.
- Pragmatic DnD (Atlassian): núcleo ~4.7 KB, pero DnD nativo HTML5 (táctil pobre), accesibilidad dependiente de @emotion/Atlaskit y React 19 declarado sin pruebas directas.
- HTML5 nativo: sin teclado/aria ni táctil fiables.

## Consecuencias
- Sin estilos propios: el aspecto (copia elevada, hueco, depósito) se define con tokens de `docs/design-tokens.md`.
- Se debe ofrecer alternativa por menú/teclado y anuncios aria-live en español.
- Pendiente: medir el tamaño real del bundle al implementar el paso 12.
