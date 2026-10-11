# Miracle Flashcards — Plan de pruebas (`docs/test_plan.md`)

> Fecha: 2026-10-10. Fuentes: `docs/backlog.md` (escenarios Gherkin) y `docs/specs.md` (única fuente de verdad; si este plan la contradice, gana `specs.md`).
> Stack de pruebas (CLAUDE.md): Vitest + Testing Library + axe. E2E y offline: pendientes de elegir herramienta en `docs/architecture.md`.

## 0. Convenciones

| Campo | Significado |
|---|---|
| **ID** | `TC-<HU>.<n>` = caso derivado de un escenario de una historia. `TC-EC<nn>` = derivado de un edge case del backlog. `TC-S<nn>` = caso suplementario creado para cubrir un hueco detectado en la validación (§5). `NEC-nn` = edge case nuevo (§3). |
| **Nivel** | **U** unitario (dominio/reglas), **I** integración (componente + IndexedDB/Supabase simulado), **E** extremo a extremo (navegador, PWA), **A** accesibilidad (axe + revisión manual). |
| **Bloqueado** | Caso cuyo comportamiento `specs.md` no define. Tras resolver V-01 a V-09 (2026-10-10, RF-14, 15, 19, 22, 27, 37 a 40) no hay casos bloqueados. |
| **Prioridad** | Ver §4 (P0 a P3). Los casos de §1 y §2 heredan la prioridad de su RF: **P0** = núcleo de aprendizaje, datos y acceso; **P1** = flujos principales; **P2** = apariencia y estados vacíos. |

Los casos se redactan declarativamente (qué se verifica, no selectores). Todos los casos de UI se ejecutan además con axe y los criterios de S-06 (contraste, teclado, foco, objetivo táctil ≥ 44×44 px).

---

## 1. Casos de prueba por criterio de aceptación (historias HU-01 a HU-14)

### HU-01 — Acceso sin contraseña (RF-09) · P0
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-01.1 | Solicitar acceso con email válido | I/E | Enviar un email válido al formulario de acceso. | Se solicita un enlace al proveedor de auth para ese email; la UI muestra aviso "revisa tu correo"; sin sesión aún. |
| TC-01.2 | Entrar con el enlace | E | Abrir un enlace válido emitido. | Sesión iniciada sin pedir contraseña; se muestra la lista de mazos del usuario. |
| TC-01.3 | Email identifica de forma única | I | Solicitar y consumir acceso dos veces con el mismo email. | Mismo identificador de usuario; no se crea una segunda cuenta; mismos datos. |

### HU-02 — Ver y voltear una tarjeta (RF-01, 02, 03, 32) · P0
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-02.1 | Ver el frente | U/I | Presentar una tarjeta con término "dog". | Frente muestra "dog"; la traducción no es visible ni está en el árbol accesible. |
| TC-02.2 | Voltear | I | Hacer clic en la tarjeta. | Se muestra "perro"; el estado de volteo se anuncia a lector de pantalla. |
| TC-02.3 | Imagen según preferencia | I | Tarjeta con imagen; probar preferencia frente / reverso / ambos. | La imagen aparece solo en los lados indicados. |
| TC-02.4 | Ejemplo y nota | I | Tarjeta con ejemplo y nota; voltear. | Ejemplo y nota consultables tras voltear. |

### HU-03 — Marcar acierto o fallo (RF-04, 05, 06) · P0
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-03.1 | Resultado solo tras voltear | U/I | Con la tarjeta sin voltear, comprobar los controles de acierto/fallo. | Controles ausentes o deshabilitados (con estado accesible `disabled`); ninguna acción posible. |
| TC-03.2 | Acierto suma | U | Palabra con contador 1; acertar tras voltear. | Contador = 2; la tarjeta sigue en la cola. |
| TC-03.3 | Fallo reinicia | U | Palabra con contador 2; fallar tras voltear. | Contador = 0; estado "pendiente"; la tarjeta vuelve a aparecer. |

### HU-04 — Palabra aprendida (RF-07, 30) · P0
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-04.1 | Tercer acierto consecutivo | U | Palabra con contador 2; acertar. | Estado "aprendida" en ese mazo; sale de la cola de pendientes. |
| TC-04.2 | Progreso independiente por mazo | U/I | Misma palabra en mazos A y B; 3 aciertos en A. | Aprendida en A; pendiente en B con su propio contador (0). |

### HU-05 — Sesión de estudio (RF-13, 25, 31, 35) · P0
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-05.1 | Iniciar desde un mazo | I/E | Pulsar "Estudiar" en un mazo con pendientes y aprendidas. | Solo se presentan pendientes de ese mazo; siempre inglés → español. |
| TC-05.2 | Orden aleatorio | U | Barajar N pendientes con un generador sembrado; repetir con varias semillas. | Orden no determinista entre semillas; cada pendiente aparece una vez por pasada. |
| TC-05.3 | Continúa hasta agotar | I | Sesión con > 50 pendientes. | No hay tope de tarjetas; la sesión no termina antes de agotarlas. |
| TC-05.4 | Salir cuando quiera | I | Responder 2 tarjetas y salir. | Sesión termina; los 2 resultados persisten. |
| TC-05.5 | Reaparición sin fechas | U | Fallar una tarjeta y continuar. | Reaparece por la cola simple; ningún cálculo usa fechas ni intervalos. |

### HU-06 — Crear una palabra (RF-03, 08, 15, 17, 32) · P0
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-06.1 | Crear con lo mínimo | I | Indicar inglés + español y guardar. | Palabra creada y visible en la lista de palabras. |
| TC-06.2 | Imagen por enlace válido | I | URL http(s) que carga como imagen. | Se guarda solo la URL; no se guarda ningún blob/archivo (inspeccionar IndexedDB y red). |
| TC-06.3 | Campos opcionales | U | Crear sin imagen, ejemplo ni nota. | Palabra creada sin error. |

### HU-07 — Gestionar mazos (RF-16, 19, 24) · P1
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-07.1 | Crear mazo | I | Crear mazo con nombre. | Aparece en la lista de mazos. |
| TC-07.2 | Editar mazo | I | Cambiar nombre. | La lista muestra el nombre nuevo. |
| TC-07.3 | Borrar con confirmación | I/E | Borrar y confirmar. | Mazo eliminado definitivamente; palabras conservadas y sin mazo. |

### HU-08 — Asignar palabras a mazos (RF-18, 20, 23, 36, 40) · P1
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-08.1 | Arrastrar | E | Arrastrar palabra del panel derecho a un mazo. | Palabra pertenece al mazo. |
| TC-08.2 | Menú con búsqueda predictiva | I | Seleccionar palabra, escribir parte del nombre, elegir. | Palabra pertenece al mazo; el filtrado se actualiza mientras se escribe. |
| TC-08.3 | Varios mazos | U | Añadir palabra de A a B. | Pertenece a ambos. |
| TC-08.4 | Duplicado en el mismo mazo | I | Añadir de nuevo al mismo mazo. | Bloqueado; aviso "ya está en el mazo"; sin fila duplicada. |
| TC-08.5 | Quitar del mazo (RF-40) | I | Quitar una palabra con progreso de un mazo y volver a agregarla. | La palabra se conserva; su progreso en ese mazo se elimina; al reagregarla el contador es 0. |

### HU-09 — Lista de palabras agrupada (RF-33, 34) · P1
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-09.1 | Con mazo seleccionado | U/I | Datos con palabras en 3 situaciones. | Orden: del mazo (resaltadas) → solo en otros mazos → sin mazo. |
| TC-09.2 | Sin mazo seleccionado | U/I | Quitar selección. | Todas listadas; las sin mazo resaltadas y al final. |
| TC-09.3 | Sin depender del color | A | Captura en escala de grises / inspección del DOM. | Cada grupo lleva etiqueta o icono con nombre accesible. |

### HU-10 — Editar o borrar palabras (RF-19) · P1
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-10.1 | Editar | I | Cambiar traducción. | Se muestra la nueva traducción. |
| TC-10.2 | Borrar con confirmación | I | Borrar y confirmar. | Palabra eliminada definitivamente. |
| TC-10.3 | Cancelar | I | Borrar y cancelar. | Palabra sin cambios; foco devuelto al elemento disparador. |

### HU-11 — Progreso y reactivación (RF-26, 27) · P1
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-11.1 | Ver progreso | I | Datos con pendientes y aprendidas. | Contadores y listas correctos y coherentes entre sí. |
| TC-11.2 | Reactivar | I | Reactivar una aprendida. | Pasa a pendientes. |

### HU-12 — Offline y sincronización (RF-14, 21, 22, 28, 29) · P0
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-12.1 | Estudiar sin conexión | E | Cortar red; estudiar; recargar. | Progreso persistido localmente. |
| TC-12.2 | Agregar/editar sin conexión | E | Cortar red; crear y editar palabras. | Cambios guardados localmente y visibles tras recargar. |
| TC-12.3 | Sincronizar al volver | E/I | Restaurar red con cambios en cola. | Cola vaciada; el servidor refleja los cambios. |
| TC-12.4 | Imágenes ya vistas | E | Ver imagen online; cortar red; recargar. | La imagen se sirve desde caché. |
| TC-12.5 | Conflicto entre dispositivos | I | Dos clientes editan la misma palabra sin conexión y sincronizan. | Prevalece el cambio con marca de tiempo más reciente. |

### HU-13 — Tema y paleta (RF-10, 11) · P2
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-13.1 | Elegir tema | I/A | Elegir azul, blanco, oscuro. | Se aplican los tokens del tema; la preferencia persiste. |
| TC-13.2 | Presets | I/A | Elegir cada preset. | Se aplica la paleta; contraste AA (ver TC-EC35). |
| TC-13.3 | Sin color libre | I | Buscar un control de color arbitrario. | No existe (`input[type=color]` ausente); solo presets. |

### HU-14 — Lado de la imagen (RF-12) · P2
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-14.1 | Frente / reverso / ambos | I | Alternar la preferencia. | Tarjetas con imagen la muestran en los lados elegidos. |
| TC-14.2 | Preferencia global | I | Cambiar y estudiar mazos distintos. | Misma preferencia en todos los mazos. |

### HU-15 — Buscar palabras en el panel (RF-43) · P2
| ID | Escenario | Nivel | Verificación | Resultado esperado |
|---|---|---|---|---|
| TC-15.1 | Filtrar por inglés o español | U/I | Escribir parte de un término en inglés y luego en español. | Solo se listan palabras que contienen el texto en alguno de los dos campos; el filtro se actualiza al escribir. |
| TC-15.2 | Sin mayúsculas ni acentos | U | Buscar `CAMION` con la palabra `camión`. | La palabra aparece. |
| TC-15.3 | Respeta los grupos | U/I | Con mazo seleccionado, buscar un texto presente en los tres grupos. | Orden RF-33 intacto con sus etiquetas; los grupos sin coincidencias no se muestran. Sin mazo seleccionado: las sin mazo siguen al final (RF-34). |
| TC-15.4 | Restaurar lista | I | Vaciar el campo. | Vuelve la lista completa y el orden original. |

---

## 2. Casos de prueba por edge case del backlog (EC-01 a EC-36)

Los vacíos V-01 a V-09 están resueltos en `specs.md`; los casos antes bloqueados quedan desbloqueados y alineados con RF-14, 15, 19, 22, 27, 37 a 40.

| ID | Origen | Nivel | Verificación → Resultado esperado | RF | Prio | Est. |
|---|---|---|---|---|---|---|
| TC-EC01 | EC-01 | U/I | Emails inválidos (`a@`, `a b@c.com`, vacío) → no se envía enlace; error explicativo asociado al campo. | 09 | P1 | |
| TC-EC02 | EC-02 | E | Acceder con el mismo email en otro dispositivo → mismos mazos y palabras. | 09, 29 | P0 | |
| TC-EC03 | EC-03 | I | Enlace caducado (> 1 h), ya usado, reemplazado por uno nuevo y alterado → sin sesión; mensaje claro y opción de pedir uno nuevo. | 09, 37 | P1 | |
| TC-EC04 | EC-04 | I | URL muerta y sin caché → tarjeta sin imagen, estudio continúa, sin romper layout. | 03, 14 | P1 | |
| TC-EC05 | EC-05 | I | Preferencia "frente" + tarjeta sin imagen → render normal, sin hueco ni alt vacío ruidoso. | 03 | P2 | |
| TC-EC06 | EC-06 | U | Invocar la acción de resultado sin voltear (también vía teclado) → ningún cambio de contador. | 04 | P0 | |
| TC-EC07 | EC-07 | U | Contador 2 → fallo → 0; luego exigir 3 aciertos nuevos. | 05, 07 | P0 | |
| TC-EC08 | EC-08 | U | Secuencia A,F,A,A → contador 2, pendiente. | 07 | P0 | |
| TC-EC09 | EC-09 | I | Mazo vacío → aviso "no hay tarjetas"; no se crea sesión. | 35 | P1 | |
| TC-EC10 | EC-10 | I | Todas aprendidas → aviso "no hay pendientes" con acciones "Reactivar palabras" y "Volver a mazos"; no se crea sesión. | 07, 35, 38 | P1 | |
| TC-EC11 | EC-11 | I | Última pendiente aprendida → sesión termina; resumen de aciertos/fallos y acciones "Reactivar palabras" y "Volver a mazos". | 35, 38 | P1 | |
| TC-EC12 | EC-12 | U | Una pendiente, 2 aciertos → se vuelve a presentar la misma hasta el 3.º. | 05, 13 | P1 | |
| TC-EC13 | EC-13 | U/I | Vacío en inglés, vacío en español, solo espacios → no se crea; mensaje indica el campo (recorte de espacios). | 17, 39 | P1 | |
| TC-EC14 | EC-14 | U | `javascript:`, `data:`, `file:`, `ftp:` → rechazadas con error. | 15 | P0 | |
| TC-EC15 | EC-15 | I | URL http(s) de una página HTML / 404 / texto → rechazada; palabra sin esa URL. | 15 | P1 | |
| TC-EC16 | EC-16 | I | Sin red al asociar imagen → se guarda "sin verificar" con aviso; al recuperar la conexión se valida; si falla, se retira la imagen y se avisa. | 15, 21, 28 | P1 | |
| TC-EC17 | EC-17 | I | Duplicado por arrastre y por menú → mismo aviso en ambas vías; ningún duplicado persistido. | 36 | P1 | |
| TC-EC18 | EC-18 | I | Palabra en A → añadir a B sin aviso. | 23, 36 | P1 | |
| TC-EC19 | EC-19 | I | Texto sin coincidencias → "sin resultados"; Enter no asigna. | 20 | P2 | |
| TC-EC20 | EC-20 | I/A | Sin mazos → estado vacío con invitación a crear; axe sin violaciones. | 16 | P2 | |
| TC-EC21 | EC-21 | I | Cancelar borrado de mazo → mazo y palabras intactos. | 19 | P1 | |
| TC-EC22 | EC-22 | I | Borrar mazo → palabras existen, sin pertenencia a él. | 19, 24 | P0 | |
| TC-EC23 | EC-23 | I | Palabra en 3 mazos, borrar → la confirmación indica en cuántos mazos está; al confirmar desaparece de la lista, de todos los mazos y de su progreso. | 19, 23 | P0 | |
| TC-EC24 | EC-24 | U | Mazo seleccionado vacío → grupo 1 vacío; grupos 2 y 3 se mantienen. | 33 | P2 | |
| TC-EC25 | EC-25 | U | Palabra en mazo seleccionado y en otro → solo en grupo 1. | 23, 33 | P1 | |
| TC-EC26 | EC-26 | I | Tras borrar mazo, palabras exclusivas pasan al grupo "sin mazo". | 24, 34 | P1 | |
| TC-EC27 | EC-27 | I/A | Sin palabras → estado vacío con invitación a crear. | 33, 34 | P2 | |
| TC-EC28 | EC-28 | I | Dos ediciones offline; sincronizar en ambos órdenes → gana el cambio más reciente según la marca del servidor. | 22, 29 | P0 | |
| TC-EC29 | EC-29 | I | Simular 500/timeout en sync → cambios locales intactos; indicador "sin sincronizar" y botón "Reintentar"; reintentos automáticos con espera creciente (máx. 5). | 22 | P0 | |
| TC-EC30 | EC-30 | E | Abrir la app sin red (tras primera carga) → estudiar, crear y editar funcionan. | 21, 28 | P0 | |
| TC-EC31 | EC-31 | E | Sin red, imagen nunca cacheada → tarjeta sin imagen y sin error; estudio continúa; la imagen se carga al volver la conexión. | 14 | P1 | |
| TC-EC32 | EC-32 | I/A | Sin aprendidas → contador 0 y estado vacío. | 26 | P2 | |
| TC-EC33 | EC-33 | U | Reactivar → pendiente en ese mazo; contador = 0. | 27, 30 | P1 | |
| TC-EC34 | EC-34 | U | Aprendida en A y B; reactivar en A → sigue aprendida en B. | 27, 30 | P1 | |
| TC-EC35 | EC-35 | U/A | Matriz completa presets de fondo × presets de tarjeta × 3 temas → texto ≥ 4,5:1 y UI ≥ 3:1 (cálculo automatizado). | 11 | P1 | |
| TC-EC37 | EC-37 | I | Interrumpir una sincronización a mitad y reintentar → cada operación se aplica una sola vez (sin palabras duplicadas ni contadores sumados dos veces). | 22 | P0 | |
| TC-EC36 | EC-36 | I/A | Emulando `prefers-reduced-motion: reduce` → volteo sin animación o reducida. | 10 | P2 | |
| TC-EC-38 | EC-38 | I | Cliente con reloj +1 día edita antes; otro edita después → prevalece el que llegó más tarde al servidor. | 29 | P0 | |
| TC-EC-39 | EC-39 | I | Dos clientes editan campos distintos de la misma palabra → se conservan ambos cambios. | 29 | P0 | |
| TC-EC-40 | EC-40 | I | Dos clientes estudian el mismo mazo offline y sincronizan en ambos órdenes → todos los eventos se aplican en orden; contador y estado recalculados sin pérdida. | 29, 30 | P0 | |
| TC-EC-41 | EC-41 | I | Borrar en A y editar/estudiar en B offline, sincronizar en ambos órdenes → palabra eliminada; B recibe aviso; sin resurrección. | 19, 29 | P0 | |
| TC-EC-42 | EC-42 | E | Sesión iniciada, sin red, recargar la app → sigue autenticada y estudia. | 41, 28 | P0 | |
| TC-EC-43 | EC-43 | I | Cerrar sesión con cola pendiente → advertencia; cancelar conserva todo; confirmar cierra. | 41 | P1 | |
| TC-EC-44 | EC-44 | U | `dog` vs `Dog ` en el mismo mazo → bloqueado con aviso. | 36 | P1 | |
| TC-EC-45 | EC-45 | U/I | Crear `bank` con inglés existente → aviso y se permite continuar. | 36, 17 | P1 | |
| TC-EC-46 | EC-46 | U | Con N = 2…20 pendientes y fallos repetidos → nunca la misma tarjeta dos veces seguidas; con N = 1 sí (EC-12). | 31, 13 | P1 | |
| TC-EC-47 | EC-47 | I | Palabra en dos mazos, aprendida en uno → progreso por mazo coherente con el selector. | 26, 30 | P1 | |
| TC-EC-48 | EC-48 | U/I | Nombres vacíos, repetidos (`Árbol`/`arbol`), de 61 caracteres → rechazados con motivo; búsqueda `arb` encuentra `Árboles`. | 16, 19, 20 | P2 | |
| TC-EC-49 | EC-49 | E | Cambiar preferencias en un dispositivo; abrir otro → se aplican sin destello; offline también. | 42, 10, 11, 12 | P2 | |
| TC-EC-50 | EC-50 | I/A | Segundo pedido antes de 60 s → deshabilitado con cuenta regresiva anunciada; el enlace anterior queda inválido. | 37 | P1 | |
| TC-EC-51 | EC-51 | I/A | Texto sin coincidencias → aviso "sin resultados" anunciado a lector de pantalla; vaciar el campo restaura la lista. | 43 | P2 | |
| TC-EC-52 | EC-52 | I/E | Sin red, buscar ` dog ` (espacios sobrantes) → encuentra las palabras con "dog"; funciona igual que con conexión. | 43, 28 | P2 | |

---

## 3. Edge cases críticos no cubiertos por el backlog

Hallazgos nuevos tras cruzar `backlog.md` con `specs.md`. Los que dependían de una decisión no escrita en `specs.md` se marcaron **[VACÍO]**; todos quedaron **[RESUELTO]** el 2026-10-10 (RF-16, 20, 26, 29, 31, 36, 37, 40, 41, 42) y sus casos están en TC-EC38 a TC-EC50.

| ID | Edge case | Requisito afectado |
|---|---|---|
| NEC-01 | **Reloj desfasado entre dispositivos**: "prevalece el cambio más reciente" con marcas de tiempo del cliente; un dispositivo con hora adelantada gana siempre. **[RESUELTO]**: origen de la marca de tiempo (cliente o servidor). | RF-29 |
| NEC-02 | **Granularidad del conflicto**: A edita la traducción y B edita la nota de la misma palabra → ¿se pierde uno entero o se fusionan campos? **[RESUELTO]** | RF-29 |
| NEC-03 | **Conflicto de progreso**: el mismo mazo se estudia offline en dos dispositivos; "gana el más reciente" descarta aciertos del otro (contadores no son ediciones de texto). **[RESUELTO]** | RF-29, RF-30 |
| NEC-04 | **Editar vs. borrar**: un dispositivo borra una palabra/mazo mientras otro la edita o estudia offline; al sincronizar, ¿resucita o se pierde la edición? **[RESUELTO]** | RF-19, RF-22, RF-29 |
| NEC-05 | **Duplicados creados offline en dos dispositivos**: ambos añaden la palabra X al mismo mazo; tras sincronizar viola RF-36. | RF-36, RF-22 |
| NEC-06 | **Sincronización interrumpida a mitad / reintento no idempotente**: la misma operación se aplica dos veces (palabra duplicada, contador sumado dos veces). | RF-22 |
| NEC-07 | **Doble clic / toque rápido en "acierto"** (o doble envío en crear/borrar) → cuenta 2 aciertos y aprende la palabra con un solo gesto. | RF-06, RF-07 |
| NEC-08 | **Enlace mágico abierto en otro navegador o en la PWA instalada** (almacenamiento separado, sobre todo en iOS) → la sesión se inicia donde no se pidió o no se inicia. | RF-09 |
| NEC-09 | **Normalización del email**: `User@x.com` vs `user@x.com` vs espacios finales → ¿misma cuenta? Riesgo de cuentas duplicadas. | RF-09 |
| NEC-10 | **Primer uso sin red / sesión caducada offline**: el login requiere red, pero RF-28 promete funcionar sin conexión; ¿qué pasa con datos no sincronizados al caducar la sesión o cerrar sesión? **[RESUELTO]** | RF-09, RF-28 |
| NEC-11 | **Aislamiento entre usuarios** (reglas RLS de Supabase): un usuario no puede leer ni escribir mazos o palabras de otro. | RF-09 (RNF de seguridad implícito) |
| NEC-12 | **Pérdida del almacenamiento local**: cuota de IndexedDB llena, desalojo por el navegador, modo privado, "borrar datos del sitio" con cambios aún sin sincronizar. | RF-21, RF-28 |
| NEC-13 | **Identidad de "la misma palabra"** (RF-36): ¿por id o por texto? `Dog` vs `dog ` vs `dog` con otra traducción; también al crear palabras duplicadas fuera de mazo. **[RESUELTO]** | RF-36, RF-17 |
| NEC-14 | **Borrar o cambiar datos durante una sesión activa** (palabra/mazo borrado, palabra quitada del mazo, reactivada desde otro dispositivo) → la tarjeta en pantalla queda huérfana. | RF-19, RF-35 |
| NEC-15 | **Recarga o cierre accidental en mitad de la sesión / varias pestañas abiertas** → resultados perdidos o duplicados; dos pestañas escribiendo el mismo contador. | RF-21, RF-35 |
| NEC-16 | **Imágenes y CORS**: una URL "carga como imagen" con `<img>` pero el service worker solo obtiene respuesta opaca (cuota de caché inflada, no verificable) o hotlink bloqueado tras la validación; contenido de la URL cambia después. | RF-14, RF-15 |
| NEC-17 | **Contenido de usuario hostil o extremo**: HTML/script en palabra, nota o ejemplo; textos muy largos; emojis, `ñ`, acentos, IME; imágenes enormes o URL de seguimiento (fuga de IP). | RF-08, RF-15, RF-32 |
| NEC-18 | **Arrastrar y soltar inaccesible**: en táctil y teclado el arrastre no funciona; la alternativa (RF-20) debe ser completa y operable por teclado y lector de pantalla. | RF-18, RF-20, WCAG 2.1.1 |
| NEC-19 | **Voltear solo por clic**: RF-02 dice "clic"; sin Enter/Espacio ni rol/estado ARIA la tarjeta es inaccesible por teclado; el volteo debe anunciarse. | RF-02, WCAG |
| NEC-20 | **Aleatoriedad y cola**: tras un fallo, con ≥ 2 pendientes ¿puede repetirse la misma tarjeta inmediatamente? ¿La pasada barajada se rehace tras cada ronda? **[RESUELTO]** (RF-13/RF-31 no lo precisan). | RF-13, RF-31 |
| NEC-21 | **Semántica del progreso con palabras en varios mazos**: ¿los contadores de la pantalla de progreso son por mazo o globales (la misma palabra cuenta dos veces)? **[RESUELTO]** | RF-26, RF-30 |
| NEC-22 | **Quitar una palabra de un mazo**: no existe requisito (solo borrar palabra o mazo); y su progreso por mazo (V-08). **[RESUELTO]** | RF-19, RF-23 |
| NEC-23 | **Nombres de mazo**: vacío, solo espacios, repetido, muy largo; búsqueda predictiva sin distinguir mayúsculas/acentos. **[RESUELTO]** | RF-16, RF-19, RF-20 |
| NEC-24 | **Actualización del service worker / migración del esquema local**: una versión nueva de la app con esquema distinto de IndexedDB sobre datos viejos sin sincronizar. | RF-21, RF-28 |
| NEC-25 | **Persistencia de preferencias**: tema, paleta y lado de la imagen entre sesiones y dispositivos; destello de tema incorrecto al cargar. **[RESUELTO]**: ¿se sincronizan con la cuenta (RF-29)? | RF-10, RF-11, RF-12 |
| NEC-26 | **Volumen**: miles de palabras y mazos (agrupación, búsqueda predictiva, arrastre) y mazos con una sola palabra. | RF-33, RF-20 |
| NEC-27 | **Límite de envío de enlaces**: solicitudes repetidas del enlace mágico (abuso o doble clic) y enlaces anteriores invalidados. **[RESUELTO]** (V-01). | RF-09 |

---

## 4. Matriz impacto × probabilidad

**Escala.** Impacto (I): 5 = pérdida/corrupción de datos o acceso a datos ajenos; 4 = rompe una regla central del aprendizaje o bloquea el uso; 3 = degrada un flujo con alternativa; 2 = molestia; 1 = cosmético. Probabilidad (P): 5 = ocurre en uso normal; 4 = frecuente; 3 = ocasional; 2 = rara; 1 = muy rara.
**Puntuación** = I × P. **P0** ≥ 15 (bloquea el lanzamiento), **P1** 10–14 (debe cubrirse en el MVP), **P2** 5–9 (cubrir si hay capacidad), **P3** < 5 (monitorizar).

| ID | I | P | Pt. | Prio | Justificación | Test propuesto (nivel) |
|---|---|---|---|---|---|---|
| NEC-07 | 4 | 5 | 20 | **P0** | El doble toque es habitual en móvil; rompe la regla "3 aciertos consecutivos" sin que el usuario lo note. | Deshabilitar tras el primer envío; 2 clics en < 100 ms → +1 (U/I) |
| NEC-06 | 5 | 4 | 20 | **P0** | Redes móviles inestables producen reintentos; duplicar o sumar dos veces corrompe datos silenciosamente. | Sync con corte a mitad y reintento; operaciones con id idempotente (I) |
| NEC-03 | 4 | 4 | 16 | **P0** | Usar varios dispositivos offline es un caso declarado (RF-28/29); "último gana" pierde progreso real. | Dos clientes estudian offline, sincronizar; definir regla primero (I) |
| NEC-04 | 5 | 3 | 15 | **P0** | Editar vs borrar concurrentes: pérdida de edición o resurrección de datos borrados; borrado es "definitivo" (RF-19). | Matriz edición/borrado × orden de sync (I) |
| NEC-11 | 5 | 3 | 15 | **P0** | Cuentas multiusuario sobre Supabase: un fallo de RLS expone datos ajenos; impacto máximo aunque sea improbable si se configura bien. | Con dos usuarios, lecturas/escrituras cruzadas → denegadas (I) |
| NEC-01 | 4 | 3 | 12 | **P1** | Relojes mal ajustados son comunes y deciden quién gana el conflicto; error difícil de detectar. | Cliente con reloj ±1 día en conflicto (I) |
| NEC-08 | 4 | 4 | 16 | **P0** | Instalar la PWA e iniciar sesión desde el correo abre el navegador, no la PWA (sobre todo iOS): bloquea el acceso del usuario típico. | E2E en navegador y PWA instalada; mensaje guía (E) |
| NEC-10 | 4 | 3 | 12 | **P1** | Contradicción RF-09 / RF-28: sin sesión válida offline el uso se bloquea o se pierden datos al cerrar sesión. | Caducar token offline; cerrar sesión con cola pendiente (E) |
| NEC-12 | 5 | 2 | 10 | **P1** | El navegador puede desalojar IndexedDB; si hay cambios sin sincronizar se pierden; poco probable, impacto severo. | Simular cuota llena / almacenamiento borrado (E/I) |
| NEC-05 | 3 | 4 | 12 | **P1** | Dos dispositivos offline con la misma palabra es natural; viola RF-36 y contadores. | Dos clientes añaden X al mazo A offline → una sola fila tras sync (I) |
| NEC-14 | 3 | 4 | 12 | **P1** | Sesión larga + multidispositivo hace probable que cambien los datos bajo la tarjeta visible. | Borrar/quitar palabra durante la sesión → se omite sin error (I) |
| NEC-15 | 4 | 3 | 12 | **P1** | Recargas y dobles pestañas son comunes; deben persistir los resultados ya dados y no duplicarse. | Recargar a mitad de sesión; dos pestañas (E) |
| NEC-02 | 3 | 3 | 9 | P2 | Pérdida parcial de edición en conflicto concurrente; poco frecuente con un solo usuario. | Edición de campos distintos en dos clientes (I) |
| NEC-09 | 4 | 3 | 12 | **P1** | Un email con mayúsculas distintas puede crear otra cuenta y "perder" mazos: viola la unicidad de RF-09. | Variantes de mayúsculas/espacios → misma cuenta (I/E) |
| NEC-13 | 3 | 4 | 12 | **P1** | El duplicado por texto (mayúsculas, espacios) es muy probable en entrada manual; define el alcance de RF-36. | Variantes `Dog`/`dog `/`dog` (U) |
| NEC-17 | 4 | 3 | 12 | **P1** | Texto libre y URLs de usuarios: XSS y fugas por imagen; impacto alto si el escapado falla. | Payloads XSS, textos de 10 000 caracteres, unicode (U/I) |
| NEC-16 | 3 | 4 | 12 | **P1** | Muchos sitios bloquean hotlinking o CORS; la caché offline de RF-14 puede fallar o llenar la cuota con respuestas opacas. | URLs con CORS/hotlink bloqueado; ver cuota (E) |
| NEC-18 | 3 | 4 | 12 | **P1** | En táctil el arrastre no funciona de forma fiable; la alternativa debe ser completa (WCAG 2.1.1). | Flujo completo solo con teclado y en táctil emulado (E/A) |
| NEC-19 | 4 | 3 | 12 | **P1** | RF-02 menciona solo "clic"; si no hay teclado/ARIA, el núcleo de la app incumple WCAG AA. | Enter/Espacio voltea; anuncio ARIA (A) |
| NEC-20 | 3 | 4 | 12 | **P1** | Ver la misma tarjeta tras fallar repetidamente degrada la retención; el comportamiento no está especificado. | Simulación con N = 2…20 pendientes (U) |
| NEC-21 | 3 | 3 | 9 | P2 | Contadores ambiguos confunden pero no corrompen datos. | Palabra en dos mazos y contadores de progreso (I) |
| NEC-24 | 4 | 2 | 8 | P2 | Actualizaciones de la PWA con migración defectuosa pueden romper datos locales; ocurre solo al cambiar el esquema. | Migrar desde versión previa con datos (I) |
| NEC-25 | 2 | 4 | 8 | P2 | Preferencias se pierden o parpadean; molestia, no pérdida. | Recarga/otro dispositivo; destello de tema (E) |
| NEC-22 | 3 | 3 | 9 | P2 | Falta de requisito para quitar palabra de un mazo; el usuario no puede corregir una asignación errónea sin borrar. | Resuelto por RF-40; cubierto por TC-08.5 |
| NEC-23 | 2 | 4 | 8 | P2 | Entradas vacías, repetidas o con acentos son comunes; impacto menor. | Nombres vacíos, repetidos, `Árbol`/`arbol` en búsqueda (U) |
| NEC-26 | 3 | 2 | 6 | P2 | Volumen alto es raro en MVP pero degrada el rendimiento. | 5 000 palabras: tiempos de agrupación y búsqueda (I) |
| NEC-27 | 2 | 2 | 4 | P3 | Abuso del envío de enlaces; mitigado por el proveedor de auth. | Doble clic en "enviar enlace" (I) |

**Orden de ejecución recomendado:** P0 (NEC-07, 06, 03, 08, 04, 11) → P1 → P2. Las decisiones de NEC-01…04, 10, 13, 20–23, 25 y 27 ya están en `specs.md`; sus tests están en TC-EC38 a TC-EC50.

---

## 5. Validación final: cobertura de RF de `specs.md`

Se verificó cada RF (RF-01 a RF-43) contra los casos de §1 y §2. "Parcial" = el caso existe pero no ejerce toda la cláusula del RF; se añaden casos suplementarios (TC-S) para cerrar la brecha.

| RF | Casos asociados | Cobertura |
|---|---|---|
| RF-01 | TC-02.1 | Completa |
| RF-02 | TC-02.2, TC-S02 | **Parcial** sin TC-S02 (solo "clic"; sin teclado) |
| RF-03 | TC-02.3, TC-06.2, TC-EC04, TC-EC05 | Completa |
| RF-04 | TC-03.1, TC-EC06 | Completa |
| RF-05 | TC-03.3, TC-EC07, TC-EC12 | Completa |
| RF-06 | TC-03.2 | Completa |
| RF-07 | TC-04.1, TC-EC07, TC-EC08, TC-EC10 | Completa |
| RF-08 | TC-06.1 | Completa |
| RF-09 | TC-01.1–01.3, TC-EC01–03 | Completa |
| RF-10 | TC-13.1, TC-EC36 | Completa |
| RF-11 | TC-13.2, TC-13.3, TC-EC35 | Completa |
| RF-12 | TC-14.1, TC-14.2, TC-02.3 | Completa |
| RF-13 | TC-05.5, TC-EC12, TC-S03 | **Parcial** sin TC-S03 (el "sin fechas ni intervalos" solo se deduce) |
| RF-14 | TC-12.4, TC-EC04, TC-EC31 | Completa |
| RF-15 | TC-06.2, TC-EC14–16 | Completa |
| RF-16 | TC-07.1, TC-EC20, TC-S01 | **Parcial** sin TC-S01 (ningún escenario verifica que la lista esté a la izquierda) |
| RF-17 | TC-06.1, TC-06.3, TC-EC13 | Completa. La palabra aparece en el panel derecho: TC-06.1 |
| RF-18 | TC-08.1 | **Parcial**: solo arrastre con ratón; ver NEC-18 |
| RF-19 | TC-07.2, TC-07.3, TC-10.1–10.3, TC-EC21–23 | Completa |
| RF-20 | TC-08.2, TC-EC19 | Completa |
| RF-21 | TC-12.1, TC-05.4, TC-EC16, TC-EC30 | Completa |
| RF-22 | TC-12.3, TC-EC28, TC-EC29, TC-EC37 | Completa |
| RF-23 | TC-08.3, TC-EC18, TC-EC25 | Completa |
| RF-24 | TC-07.3, TC-EC22, TC-EC26 | Completa |
| RF-25 | TC-05.1 | Completa |
| RF-26 | TC-11.1, TC-EC32, TC-EC47, TC-S04 | Completa |
| RF-27 | TC-11.2, TC-EC33, TC-EC34 | Completa |
| RF-28 | TC-12.1, TC-12.2, TC-EC30 | Completa |
| RF-29 | TC-12.5, TC-EC02, TC-EC28, TC-EC38–41 | Completa |
| RF-30 | TC-04.2, TC-EC33, TC-EC34 | Completa |
| RF-31 | TC-05.2 | Completa |
| RF-32 | TC-02.4, TC-06.3 | Completa |
| RF-33 | TC-09.1, TC-EC24, TC-EC25 | Completa |
| RF-34 | TC-09.2, TC-EC26, TC-EC27 | Completa |
| RF-35 | TC-05.1, TC-05.3, TC-05.4, TC-EC09–11 | Completa |
| RF-36 | TC-08.4, TC-EC17, TC-EC18 | Completa; riesgos en NEC-05 y NEC-13 |
| RF-37 | TC-EC03 | Completa |
| RF-38 | TC-EC10, TC-EC11, TC-05.3 | Completa |
| RF-39 | TC-EC13, TC-06.1, TC-06.3 | Completa |
| RF-40 | TC-08.5 | Completa |
| RF-41 | TC-EC42, TC-EC43 | Completa |
| RF-42 | TC-EC49 | Completa |
| RF-43 | TC-15.1–15.4, TC-EC51, TC-EC52 | Completa |

### Resultado

- **RF sin ningún test asociado: ninguno.** Los 43 RF tienen al menos un caso en §1 o §2.
- **RF con cobertura parcial (cerrada con los casos suplementarios de abajo):** RF-02, RF-13, RF-16, RF-18, RF-26.
- **Casos bloqueados:** ninguno. V-01 a V-09 se resolvieron en `specs.md` el 2026-10-10 (RF-14, 15, 19, 22, 27, 37 a 40).
- **Requisitos fuera de la numeración RF sin test en §1–§2:** PWA instalable (manifest, service worker) y estados de carga/error genéricos (CLAUDE.md, RNF). Cubiertos por TC-S05 y TC-S06.

### Casos suplementarios

| ID | Nivel | Verificación → Resultado esperado | RF/RNF |
|---|---|---|---|
| TC-S01 | E/A | En escritorio, la lista de mazos está a la izquierda y la de palabras a la derecha; en móvil el contenido sigue accesible sin scroll horizontal. | RF-16, RF-17, RNF responsive |
| TC-S02 | A | Enter y Espacio voltean la tarjeta; el control es un botón con estado anunciado; el foco permanece visible. | RF-02 |
| TC-S03 | U | El modelo de datos de progreso no contiene campos de fecha o intervalo de repaso; el orden de la cola depende solo del barajado y del contador. | RF-13 |
| TC-S04 | I | Palabra en dos mazos, aprendida en uno: los contadores de progreso reflejan la regla fijada en `specs.md` (regla definida en RF-26: progreso por mazo). | RF-26, RF-30 |
| TC-S05 | E | El manifest es válido, la app es instalable, y tras la primera carga arranca sin red. | RNF PWA |
| TC-S06 | I/A | Cada pantalla con datos remotos tiene estado de carga, vacío y error definidos y accesibles (aviso anunciado; foco gestionado). | RNF estados |

> **Nota sobre RF-18:** TC-08.1 solo cubre el arrastre con ratón. La cobertura por teclado y táctil se tramita mediante NEC-18 y se apoya en TC-08.2 (RF-20) como vía alternativa; el RF-18 queda cubierto en su alcance literal (arrastrar), no en accesibilidad.

## 6. Resumen

- **Cobertura de criterios de aceptación:** todos los escenarios Gherkin de HU-01 a HU-15 (incluido el nuevo de RF-40) y los edge cases EC-01 a EC-52, uno por uno; más 6 casos suplementarios.
- **Casos bloqueados:** ninguno; los 9 antes bloqueados por `[A CONFIRMAR]` quedaron desbloqueados.
- **Riesgos prioritarios (P0):** NEC-07, 06, 03, 08, 04, 11 (§4).
- **Vacíos que siguen abiertos:** ninguno; los NEC [VACÍO] quedaron resueltos en `specs.md` (R31 a R41).
