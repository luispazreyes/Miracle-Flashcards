# Miracle Flashcards

## Objetivo
Aplicación de flashcards para estudio con repetición espaciada: crear mazos y tarjetas, estudiar con sesiones guiadas y seguir el progreso. Prioriza simplicidad, accesibilidad y retención del aprendizaje.

## Stack tentativo
(Sujeto a confirmación en `docs/specs.md`; no asumir como definitivo.)
- Frontend: TypeScript + React (Vite)
- Estilos: CSS con Design Tokens (variables CSS / JSON de tokens)
- **Progressive Web App (PWA)**: instalable, manifest + service worker, funcionamiento offline y responsive
- Base de datos (preliminar): Supabase (Postgres + Auth); caché local en IndexedDB para uso offline y sincronización
- Decisión de BD (2026-10-10): Supabase elegido sobre Firebase por el modelo relacional (RF-23, RF-30, RF-16, RF-36) y el control de sincronización (RF-22, RF-29); ver `docs/adr/001-database-selection.md`.
- Pruebas: Vitest + Testing Library; axe para accesibilidad

## Convenciones de trabajo
- **Cada fase produce un artefacto en `docs/` antes de escribir código** (p. ej. `docs/specs.md`, `docs/design-tokens.md`, `docs/architecture.md`, `docs/test-plan.md`). No se codifica una fase sin su artefacto aprobado.
- **`docs/specs.md` es la única fuente de verdad.** Si el código, otro doc o una conversación contradicen `specs.md`, gana `specs.md`; los cambios de requisitos se hacen primero ahí.
- Cambios de alcance o decisiones técnicas relevantes se registran en `docs/` (con fecha y motivo).
- Commits pequeños y descriptivos; referenciar la sección de `specs.md` que implementan.
- Documentación y textos de UI en español, salvo que `specs.md` indique otra cosa.

## Estándares de UI
- **WCAG 2.1 AA** obligatorio: contraste ≥ 4.5:1 (texto) y 3:1 (UI/texto grande), navegación completa por teclado, foco visible, etiquetas/ARIA correctas, no depender solo del color, respetar `prefers-reduced-motion`.
- **Usabilidad**: flujos cortos, feedback inmediato, estados vacíos/carga/error definidos, acciones destructivas reversibles o con confirmación, objetivos táctiles ≥ 44×44 px, responsive.
- **Design Tokens**: color, tipografía, espaciado, radios, sombras y motion se definen como tokens; prohibido usar valores hardcodeados en componentes. Soporte de tema claro/oscuro vía tokens.
- Verificar accesibilidad (axe + revisión manual de teclado/lector de pantalla) antes de dar una fase por terminada.

## Fuera de alcance
- Apps nativas móviles/escritorio (solo PWA, responsive).
- Cuentas sociales, funciones de comunidad o mazos públicos/marketplace.
- Monetización, pagos y analítica de terceros.
- IA generativa de contenido, OCR y reconocimiento de voz.
- Colaboración en tiempo real.
- Cualquier funcionalidad no listada en `docs/specs.md`.
