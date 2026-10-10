# Miracle Flashcards — PRD (`docs/specs.md`)

> Única fuente de verdad del proyecto. Fecha: 2026-10-10.
>
> **Leyenda de fuentes:** `T-n` = línea n de `Recording 2026-10-10-22-26-55.txt` (transcripción). `R1..R21` = respuestas del usuario en cuatro rondas (R1 a R4: diagnóstico; R5 a R8: P-01 a P-04; R9 a R17: RF-19 y pendientes restantes; R18 a R21: P-09 a P-11; R22 a R30: P-12 a P-20, resolución de los vacíos V-01 a V-09 del backlog). `CLAUDE.md` = instrucciones del proyecto.
> **[PENDIENTE]** = vacío sin resolver; no se asume nada.

## 1. Objetivos
- O-01. Permitir al usuario aprender palabras de inglés con flashcards (T-1).
- O-02. Que el usuario construya su propio conjunto de palabras (T-7).
- O-03. Seguir el avance por palabra hasta considerarla aprendida (T-5, R1).
- O-04. Ofrecer una interfaz personalizable en colores y tema (T-7).
- Principios de producto: simplicidad, accesibilidad y retención del aprendizaje (CLAUDE.md).

## 2. In-Scope / Out-of-Scope

### In-Scope
- Tarjetas inglés → español con volteo (T-1, T-3).
- Imagen opcional por enlace (T-3).
- Marcado de acierto/fallo, contador y backlog de aprendidas (T-5, R1).
- Alta de palabras por el usuario (T-7).
- Login por email con enlace mágico (T-7, R2).
- Temas y paleta personalizable (T-7).
- Preferencia global del lado de la imagen (T-9, R4).
- Varios mazos con gestión de palabras y mazos (R7).
- Caché de imágenes ya vistas y uso offline con sincronización posterior (R5, R8, R13).
- Pantalla de progreso y reactivación de palabras aprendidas (R12).
- Ejemplo de uso y nota libre opcionales en la tarjeta (R16).
- Quitar una palabra de un mazo sin borrarla (R29).

### Out-of-Scope (CLAUDE.md)
- Apps nativas móviles o de escritorio; solo PWA responsive.
- Cuentas sociales, comunidad, mazos públicos o marketplace.
- Monetización, pagos y analítica de terceros.
- IA generativa de contenido, OCR y reconocimiento de voz.
- Colaboración en tiempo real.
- Subida de archivos de imagen (T-3: solo se guarda el enlace).
- Repetición espaciada con fechas de repaso (R3).
- Estudio inverso español → inglés (R11).
- Cualquier funcionalidad no listada en este documento.

## 3. Stack tecnológico (tentativo; fuente CLAUDE.md, sujeto a confirmación)
- Frontend: TypeScript + React (Vite).
- Estilos: CSS con Design Tokens (variables CSS), tema claro/oscuro.
- PWA: manifest + service worker, responsive.
- Backend: Supabase (Postgres + Auth). El enlace mágico (R2) es compatible con Supabase Auth.
- Caché local: IndexedDB para el progreso offline (R8); service worker para las imágenes ya vistas (R5).
- Pruebas: Vitest + Testing Library; axe para accesibilidad.

## 4. Supuestos
- S-01. El idioma de estudio es inglés → español, sin dirección inversa (T-1, T-3, R11).
- S-02. Una "palabra" es una tarjeta con un término en inglés y su traducción al español, más imagen, ejemplo de uso y nota libre opcionales (T-1, T-3, R16).
- S-03. "Backlog" designa dos colas: pendientes de estudio y aprendidas (T-5).
- S-04. "Revés" e "inverso" (T-9) se interpretan como los dos lados de la tarjeta (frente y reverso); confirmado (R17).
- S-05. Documentación y textos de UI en español (CLAUDE.md).
- S-06. Los estándares de UI de CLAUDE.md (WCAG 2.1 AA, tokens, objetivos táctiles ≥ 44×44 px) aplican a todo requisito.

## 5. Requerimientos funcionales

| ID | Requerimiento | Fuente |
|---|---|---|
| RF-01 | El frente de la tarjeta muestra la palabra en inglés. | (T-1) |
| RF-02 | Al hacer clic en la tarjeta, esta se voltea y muestra la palabra en español. | (T-3) |
| RF-03 | Una tarjeta puede tener una imagen asociada. La imagen se referencia solo por enlace o URL; la app no almacena archivos de imagen. | (T-3) |
| RF-04 | Tras voltear la tarjeta, el usuario puede indicar si acertó o no. | (T-5) |
| RF-05 | Si el usuario no acierta, la tarjeta permanece en el backlog de pendientes y vuelve a aparecer; su contador de aciertos consecutivos se reinicia a 0. | (T-5, R1) |
| RF-06 | Si el usuario acierta, la app suma 1 al contador de aciertos consecutivos de esa palabra y la tarjeta vuelve a mostrarse. | (T-5, R1) |
| RF-07 | Cuando una palabra alcanza 3 aciertos consecutivos se considera aprendida y pasa al backlog de palabras aprendidas. | (T-5, R1) |
| RF-08 | El usuario puede agregar las palabras que quiere aprender. | (T-7) |
| RF-09 | El acceso es por email mediante enlace mágico, sin contraseña. El email identifica de forma única al usuario. | (T-7, R2) |
| RF-10 | La app ofrece tema en azul, tema en blanco y modo oscuro. | (T-7) |
| RF-11 | El usuario puede personalizar la paleta de colores del fondo y de las flashcards eligiendo entre presets predefinidos que cumplen WCAG AA; no hay selección de color libre. | (T-7, R6) |
| RF-12 | Una preferencia global del usuario define si la imagen se muestra en el frente, en el reverso o en ambos lados de las tarjetas. | (T-9, R4) |
| RF-13 | La reaparición de las tarjetas funciona con una cola simple y el contador de aciertos; sin fechas de repaso ni intervalos. | (R3, R15) |
| RF-14 | Las imágenes ya vistas se cachean para poder mostrarse sin conexión. Una imagen nunca vista y sin conexión se omite sin error (la tarjeta se estudia sin imagen) y se carga al recuperar la conexión. | (R5, R30) |
| RF-15 | Al asociar una imagen se valida que la URL sea http(s) y que cargue como imagen. Sin conexión no se puede validar: la URL se guarda como "sin verificar" con un aviso visible y se valida al recuperar la conexión; si falla, se retira la imagen y se avisa al usuario. | (R5, R25) |
| RF-16 | La app permite varios mazos; la lista de mazos aparece a la izquierda. | (R7) |
| RF-17 | El usuario escribe una palabra con su traducción e imagen; la palabra creada aparece en el panel derecho (ver RF-33 y RF-34). | (R7) |
| RF-18 | El usuario puede arrastrar una palabra del panel derecho al mazo donde quiere agregarla. | (R7) |
| RF-19 | El usuario puede editar o borrar palabras individuales y mazos completos. Antes de borrar se muestra un diálogo de confirmación; el borrado es definitivo. Borrar una palabra que está en varios mazos la elimina de todos ellos junto con su progreso; el diálogo de confirmación indica en cuántos mazos está. | (R7, R9, R26) |
| RF-20 | El usuario también puede agregar una palabra a un mazo seleccionándola y eligiendo el mazo en un menú desplegable con búsqueda predictiva. | (R7) |
| RF-21 | Sin conexión, el progreso se guarda localmente. | (R8, R13) |
| RF-22 | Al recuperar la conexión, la app sincroniza lo pendiente. Si la sincronización falla, los cambios locales nunca se descartan: se reintenta automáticamente con espera creciente (máximo 5 reintentos) y al recuperar la conexión; la app muestra un indicador "sin sincronizar" y un botón "Reintentar". Las operaciones de sincronización son idempotentes. | (R8, R28) |
| RF-23 | Una palabra puede pertenecer a varios mazos. | (R10) |
| RF-24 | Al borrar un mazo, sus palabras se conservan y quedan sin mazo, visibles en el panel derecho como palabras sin mazo (RF-33, RF-34). | (R10) |
| RF-25 | El usuario estudia por mazo, solo en dirección inglés → español. | (R11) |
| RF-26 | Una pantalla de progreso muestra contadores y listas de palabras pendientes y aprendidas. | (R12) |
| RF-27 | El usuario puede reactivar una palabra aprendida; vuelve a pendientes de ese mazo con el contador de aciertos consecutivos en 0. | (R12, R27) |
| RF-28 | Estudiar, agregar y editar palabras funciona sin conexión. | (R13) |
| RF-29 | La cuenta puede usarse en varios dispositivos; si hay conflicto al sincronizar, prevalece el cambio más reciente. | (R13) |
| RF-30 | El contador de aciertos consecutivos y el estado (pendiente o aprendida) se llevan por palabra dentro de cada mazo. | (R14) |
| RF-31 | Las tarjetas pendientes de un mazo se presentan en orden aleatorio. | (R15) |
| RF-32 | Una tarjeta admite un ejemplo de uso opcional y una nota libre opcional. | (R16) |
| RF-33 | Con un mazo seleccionado, el panel derecho lista todas las palabras en tres grupos y en este orden: 1º las del mazo seleccionado (resaltadas), 2º las asignadas solo a otros mazos (otro color), 3º las sin ningún mazo (un tercer color). | (R18) |
| RF-34 | Sin mazo seleccionado, el panel derecho lista todas las palabras; las que no están en ningún mazo se resaltan con un color distinto y van al final. | (R19) |
| RF-35 | Cada mazo tiene un botón "Estudiar" que inicia la sesión; la sesión no tiene límite de tamaño y continúa hasta agotar las pendientes o que el usuario salga. | (R20) |
| RF-36 | No se permite agregar la misma palabra dos veces al mismo mazo; se bloquea y se muestra un aviso. | (R21) |
| RF-37 | El enlace mágico caduca a la hora y es de un solo uso: se invalida al usarse o al solicitar uno nuevo. Un enlace caducado, usado o alterado no inicia sesión, muestra un mensaje claro y permite solicitar un enlace nuevo. | (R22) |
| RF-38 | Cuando se agotan las pendientes durante una sesión, o se intenta estudiar un mazo sin pendientes, la app muestra un mensaje con el resumen de la sesión (aciertos y fallos; si no hubo sesión, solo el aviso) y dos acciones: "Reactivar palabras" (lleva a la pantalla de progreso) y "Volver a mazos". No se inicia una sesión vacía. | (R23) |
| RF-39 | Para crear una palabra son obligatorios el término en inglés y la traducción al español, no vacíos tras recortar espacios; imagen, ejemplo y nota son opcionales. Si falta un campo obligatorio, no se crea y se indica cuál falta. | (R24) |
| RF-40 | El usuario puede quitar una palabra de un mazo sin borrarla. Su progreso en ese mazo se elimina; si se vuelve a agregar al mazo, empieza con el contador en 0. | (R29) |

## 6. Requisitos no funcionales
Se heredan sin cambios de CLAUDE.md; no añaden funcionalidad.
- Accesibilidad WCAG 2.1 AA (contraste, teclado, foco visible, ARIA, `prefers-reduced-motion`).
- Design Tokens para color, tipografía, espaciado, radios, sombras y motion; sin valores hardcodeados en componentes.
- Estados vacío/carga/error definidos; acciones destructivas con confirmación o reversibles.
- PWA instalable y responsive.
- Los grupos del panel derecho (RF-33, RF-34) no dependen solo del color: llevan además etiqueta o icono (CLAUDE.md, "no depender solo del color").

## 7. [PENDIENTE]
| ID | Tema | Detalle sin resolver |
|---|---|---|
| P-01 | ~~Imágenes y offline~~ | Resuelto en R5 (RF-14, RF-15). |
| P-02 | ~~Personalización vs. contraste~~ | Resuelto en R6 (RF-11). |
| P-03 | ~~Mazos~~ | Resuelto en R7, R10, R11 (RF-16 a RF-20, RF-23 a RF-25). |
| P-04 | ~~Sincronización y progreso~~ | Resuelto en R8, R12, R13 (RF-21, RF-22, RF-26 a RF-29). |
| P-05 | ~~Orden de la cola~~ | Resuelto en R15 (RF-31); tamaño de sesión resuelto en R20 (RF-35). |
| P-06 | ~~"Revés/inverso"~~ | Resuelto en R17 (S-04). |
| P-07 | ~~Contenido de la tarjeta~~ | Resuelto en R16 (RF-32). |
| P-08 | ~~Contradicción con CLAUDE.md~~ | Resuelto: mazos y progreso entran (R7, R12); la repetición espaciada queda fuera (R3). |
| P-09 | ~~Panel derecho~~ | Resuelto en R18, R19 (RF-33, RF-34). |
| P-10 | ~~Sesión de estudio~~ | Resuelto en R20 (RF-35). |
| P-11 | ~~Duplicados~~ | Resuelto en R21 (RF-36). |
| P-12 | ~~Enlace mágico (V-01)~~ | Resuelto en R22 (RF-37). |
| P-13 | ~~Fin de sesión (V-02)~~ | Resuelto en R23 (RF-38). |
| P-14 | ~~Campos obligatorios (V-03)~~ | Resuelto en R24 (RF-39). |
| P-15 | ~~URL de imagen sin conexión (V-04)~~ | Resuelto en R25 (RF-15). |
| P-16 | ~~Borrar palabra en varios mazos (V-05)~~ | Resuelto en R26 (RF-19). |
| P-17 | ~~Contador al reactivar (V-06)~~ | Resuelto en R27 (RF-27). |
| P-18 | ~~Sincronización fallida (V-07)~~ | Resuelto en R28 (RF-22). |
| P-19 | ~~Quitar palabra de un mazo (V-08)~~ | Resuelto en R29 (RF-40). |
| P-20 | ~~Imágenes nunca vistas offline (V-09)~~ | Resuelto en R30 (RF-14). |

No quedan [PENDIENTE] abiertos al 2026-10-10.

## 8. Registro de decisiones
| Fecha | Decisión | Motivo / Fuente |
|---|---|---|
| 2026-10-10 | Aprendida = 3 aciertos consecutivos; un fallo reinicia el contador. | R1; resuelve la ambigüedad de "al menos tres veces más" (T-5). |
| 2026-10-10 | Login por enlace mágico, sin contraseña. | R2; compatible con "email como llave" (T-7). |
| 2026-10-10 | Cola simple + contador, sin repetición espaciada. | R3; sustituye la repetición espaciada de CLAUDE.md. |
| 2026-10-10 | Lado de la imagen como preferencia global. | R4; resuelve la ambigüedad de T-9. |
| 2026-10-10 | Imágenes ya vistas se cachean; la URL se valida. | R5 (P-01). |
| 2026-10-10 | Personalización solo con presets que cumplen AA. | R6 (P-02); evita el conflicto con WCAG. |
| 2026-10-10 | Varios mazos: mazos a la izquierda, palabras a la derecha, arrastrar o menú con búsqueda predictiva; editar y borrar palabras y mazos. | R7 (P-03). |
| 2026-10-10 | Offline: progreso local y sincronización al volver la conexión. | R8 (P-04). |
| 2026-10-10 | Borrado con confirmación, definitivo. | R9 (RF-19). |
| 2026-10-10 | Una palabra en varios mazos; al borrar un mazo las palabras quedan sin mazo. | R10 (P-03). |
| 2026-10-10 | Estudio por mazo, solo inglés → español. | R11 (P-03). |
| 2026-10-10 | Progreso con contadores y listas; aprendidas reactivables. | R12 (P-04). |
| 2026-10-10 | Todo offline, multi-dispositivo, gana el cambio más reciente. | R13 (P-04). |
| 2026-10-10 | Contador y estado por palabra en cada mazo. | R14. |
| 2026-10-10 | Orden aleatorio de pendientes. | R15 (P-05). |
| 2026-10-10 | Ejemplo de uso y nota libre opcionales. | R16 (P-07). |
| 2026-10-10 | "Revés/inverso" = frente y reverso. | R17 (P-06). |
| 2026-10-10 | Panel derecho con mazo seleccionado: 3 grupos (mazo, otros mazos, sin mazo). | R18 (P-09). |
| 2026-10-10 | Panel derecho sin selección: todas, sin mazo resaltadas al final. | R19 (P-09). |
| 2026-10-10 | Botón "Estudiar" por mazo, sesión sin límite. | R20 (P-10). |
| 2026-10-10 | Duplicados en el mismo mazo bloqueados con aviso. | R21 (P-11). |
| 2026-10-10 | Enlace mágico: 1 h de vigencia, un solo uso. | R22 (P-12, V-01); estándar de Supabase Auth. |
| 2026-10-10 | Fin de sesión / mazo sin pendientes: resumen y acciones "Reactivar palabras" y "Volver a mazos". | R23 (P-13, V-02); evita callejón sin salida. |
| 2026-10-10 | Obligatorios: inglés y traducción. | R24 (P-14, V-03); una tarjeta sin reverso no es estudiable. |
| 2026-10-10 | URL de imagen sin conexión: se guarda "sin verificar" y se valida después. | R25 (P-15, V-04); mantiene RF-28 y RF-15. |
| 2026-10-10 | Borrar una palabra la elimina de todos los mazos con su progreso. | R26 (P-16, V-05); coherente con borrado definitivo. |
| 2026-10-10 | Reactivar deja el contador en 0. | R27 (P-17, V-06); refuerza la retención. |
| 2026-10-10 | Sync fallida: sin pérdida local, reintentos automáticos (máx. 5), indicador y botón. | R28 (P-18, V-07). |
| 2026-10-10 | Nueva acción "quitar del mazo"; borra su progreso en ese mazo. | R29 (P-19, V-08); amplía alcance de In-Scope. |
| 2026-10-10 | Imagen nunca vista sin conexión: se omite sin error. | R30 (P-20, V-09). |
