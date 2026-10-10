# Miracle Flashcards — Backlog de historias del MVP (`docs/backlog.md`)

> Fecha: 2026-10-10. Fuente única: `docs/specs.md`. Si este documento contradice `specs.md`, gana `specs.md`.
> Los escenarios son declarativos (describen el QUÉ, sin IDs ni selectores de UI).
> **Convención:** `HU-nn` = historia; `EC-nn` = edge case / escenario de fallo; `[A CONFIRMAR]` = comportamiento que `specs.md` no define y que no se asume.
> **Rol único:** "estudiante" = usuario autenticado que estudia inglés → español (S-01).
> Todos los requisitos de UI de CLAUDE.md (WCAG 2.1 AA, tokens, táctil ≥ 44×44 px) aplican a toda historia (S-06) y no se repiten en cada una.

---

## 1. Historias críticas del MVP

### HU-01 — Acceso sin contraseña
**Como** estudiante **quiero** entrar con mi email mediante un enlace mágico **para** acceder a mis mazos sin recordar contraseñas.
**Origen:** RF-09

```gherkin
Escenario: Solicitar acceso con un email válido
  Dado que no tengo sesión iniciada
  Cuando solicito acceso con mi email
  Entonces recibo un enlace de acceso en ese email
  Y la app me informa de que revise mi correo

Escenario: Entrar con el enlace recibido
  Dado que recibí un enlace de acceso válido
  Cuando abro el enlace
  Entonces inicio sesión sin introducir contraseña
  Y veo mis mazos

Escenario: El email identifica de forma única a la persona
  Dado que ya tengo una cuenta con mi email
  Cuando solicito acceso otra vez con el mismo email
  Entonces accedo a la misma cuenta y no se crea una nueva
```

### HU-02 — Ver y voltear una tarjeta
**Como** estudiante **quiero** ver la palabra en inglés y voltear la tarjeta para ver su traducción **para** comprobar si la recuerdo.
**Origen:** RF-01, RF-02, RF-03, RF-32

```gherkin
Escenario: Ver el frente de la tarjeta
  Dado que estoy estudiando una tarjeta
  Cuando se me presenta
  Entonces veo la palabra en inglés

Escenario: Voltear para ver la traducción
  Dado que veo el frente de una tarjeta
  Cuando la volteo
  Entonces veo la palabra en español

Escenario: Tarjeta con imagen asociada
  Dado que la tarjeta tiene una imagen asociada por enlace
  Cuando la estudio
  Entonces veo la imagen en el lado que indica mi preferencia global

Escenario: Tarjeta con ejemplo de uso y nota
  Dado que la tarjeta tiene ejemplo de uso y nota libre
  Cuando la volteo
  Entonces puedo consultar el ejemplo y la nota
```

### HU-03 — Marcar acierto o fallo
**Como** estudiante **quiero** indicar si acerté tras voltear la tarjeta **para** que la app registre mi avance en esa palabra.
**Origen:** RF-04, RF-05, RF-06

```gherkin
Escenario: Indicar resultado solo tras voltear
  Dado que estoy viendo el frente de una tarjeta
  Cuando todavía no la he volteado
  Entonces no puedo indicar si acerté o fallé

Escenario: Acierto suma al contador
  Dado que la palabra tiene 1 acierto consecutivo
  Cuando volteo la tarjeta e indico que acerté
  Entonces su contador de aciertos consecutivos pasa a 2
  Y la tarjeta vuelve a mostrarse más adelante

Escenario: Fallo reinicia el contador
  Dado que la palabra tiene 2 aciertos consecutivos
  Cuando volteo la tarjeta e indico que no acerté
  Entonces su contador de aciertos consecutivos pasa a 0
  Y la palabra permanece en pendientes
  Y la tarjeta vuelve a aparecer
```

### HU-04 — Palabra aprendida
**Como** estudiante **quiero** que una palabra se considere aprendida al acertarla 3 veces seguidas **para** dejar de repasar lo que ya domino.
**Origen:** RF-07, RF-30

```gherkin
Escenario: Tercer acierto consecutivo
  Dado que una palabra de un mazo tiene 2 aciertos consecutivos
  Cuando acierto por tercera vez seguida
  Entonces la palabra pasa a aprendidas en ese mazo
  Y deja de aparecer en las pendientes de ese mazo

Escenario: Progreso independiente por mazo
  Dado que una palabra pertenece a dos mazos
  Cuando la apruebo 3 veces seguidas en el primer mazo
  Entonces queda aprendida en el primer mazo
  Y sigue pendiente, con su propio contador, en el segundo mazo
```

### HU-05 — Sesión de estudio por mazo
**Como** estudiante **quiero** iniciar una sesión de estudio de un mazo **para** repasar sus palabras pendientes sin fijar un tamaño de sesión.
**Origen:** RF-13, RF-25, RF-31, RF-35

```gherkin
Escenario: Iniciar la sesión desde un mazo
  Dado que un mazo tiene palabras pendientes
  Cuando inicio el estudio de ese mazo
  Entonces se me presentan solo palabras pendientes de ese mazo
  Y siempre en dirección inglés → español

Escenario: Orden aleatorio
  Dado que un mazo tiene varias palabras pendientes
  Cuando estudio
  Entonces las tarjetas se presentan en orden aleatorio

Escenario: La sesión continúa hasta agotar pendientes
  Dado que estoy en una sesión
  Cuando aún quedan palabras pendientes
  Entonces la sesión continúa sin límite de tarjetas

Escenario: Salir cuando quiera
  Dado que estoy en una sesión
  Cuando decido salir
  Entonces la sesión termina
  Y se conserva el progreso ya registrado

Escenario: Reaparición sin fechas de repaso
  Dado que fallé una tarjeta
  Cuando continúa la sesión
  Entonces la tarjeta reaparece por la cola simple, sin depender de fechas ni intervalos
```

### HU-06 — Crear una palabra
**Como** estudiante **quiero** agregar palabras con su traducción, imagen, ejemplo y nota **para** construir mi propio conjunto de estudio.
**Origen:** RF-08, RF-15, RF-17, RF-32, RF-03

```gherkin
Escenario: Crear una palabra con lo mínimo
  Dado que quiero agregar una palabra
  Cuando indico la palabra en inglés y su traducción al español
  Entonces la palabra se crea
  Y aparece en la lista de palabras

Escenario: Crear con imagen por enlace válido
  Dado que indico una URL http(s) que carga como imagen
  Cuando guardo la palabra
  Entonces la palabra queda asociada a esa imagen
  Y la app no almacena el archivo de imagen, solo el enlace

Escenario: Campos opcionales
  Dado que creo una palabra
  Cuando no indico imagen, ejemplo ni nota
  Entonces la palabra se crea igualmente
```

### HU-07 — Gestionar mazos
**Como** estudiante **quiero** crear, editar y borrar mazos **para** organizar mis palabras por tema.
**Origen:** RF-16, RF-19, RF-24

```gherkin
Escenario: Crear un mazo
  Dado que quiero organizar mis palabras
  Cuando creo un mazo con un nombre
  Entonces el mazo aparece en la lista de mazos

Escenario: Editar un mazo
  Dado que existe un mazo
  Cuando cambio su nombre
  Entonces la lista de mazos muestra el nombre actualizado

Escenario: Borrar un mazo con confirmación
  Dado que existe un mazo con palabras
  Cuando pido borrarlo y confirmo
  Entonces el mazo se elimina definitivamente
  Y sus palabras se conservan y quedan sin mazo
```

### HU-08 — Asignar palabras a mazos
**Como** estudiante **quiero** agregar una palabra a un mazo arrastrándola o eligiendo el mazo con búsqueda **para** organizar rápido mi estudio.
**Origen:** RF-18, RF-20, RF-23, RF-36, RF-40

```gherkin
Escenario: Agregar arrastrando
  Dado que veo una palabra en la lista de palabras y un mazo en la lista de mazos
  Cuando arrastro la palabra hasta el mazo
  Entonces la palabra pertenece a ese mazo

Escenario: Agregar eligiendo el mazo con búsqueda predictiva
  Dado que he seleccionado una palabra
  Cuando busco un mazo escribiendo parte de su nombre y lo elijo
  Entonces la palabra pertenece a ese mazo

Escenario: Una palabra en varios mazos
  Dado que una palabra ya está en un mazo
  Cuando la agrego a otro mazo distinto
  Entonces pertenece a ambos mazos

Escenario: Duplicado en el mismo mazo
  Dado que una palabra ya está en un mazo
  Cuando intento agregarla otra vez a ese mismo mazo
  Entonces se bloquea la acción
  Y recibo un aviso de que ya está en el mazo

Escenario: Quitar una palabra de un mazo
  Dado que una palabra está en un mazo con progreso
  Cuando la quito de ese mazo
  Entonces la palabra se conserva y deja de pertenecer a ese mazo
  Y su progreso en ese mazo se elimina
  Y si la vuelvo a agregar a ese mazo empieza con el contador en 0
```

### HU-09 — Lista de palabras agrupada
**Como** estudiante **quiero** ver mis palabras agrupadas según el mazo seleccionado **para** saber qué falta asignar.
**Origen:** RF-33, RF-34 (y RNF: no depender solo del color)

```gherkin
Escenario: Con un mazo seleccionado
  Dado que he seleccionado un mazo
  Cuando veo la lista de palabras
  Entonces aparecen primero las palabras del mazo, resaltadas
  Y después las asignadas solo a otros mazos
  Y al final las que no tienen ningún mazo

Escenario: Sin mazo seleccionado
  Dado que no he seleccionado ningún mazo
  Cuando veo la lista de palabras
  Entonces aparecen todas las palabras
  Y las que no están en ningún mazo se resaltan y van al final

Escenario: Los grupos se distinguen sin depender del color
  Dado que veo la lista de palabras agrupada
  Cuando comparo los grupos
  Entonces cada grupo tiene además una etiqueta o icono que lo identifica
```

### HU-10 — Editar o borrar palabras
**Como** estudiante **quiero** corregir o eliminar palabras **para** mantener mi conjunto de estudio correcto.
**Origen:** RF-19

```gherkin
Escenario: Editar una palabra
  Dado que existe una palabra
  Cuando cambio su traducción
  Entonces la palabra muestra la traducción actualizada

Escenario: Borrar una palabra con confirmación
  Dado que existe una palabra
  Cuando pido borrarla y confirmo
  Entonces la palabra se elimina definitivamente

Escenario: Cancelar el borrado
  Dado que se me pide confirmar el borrado de una palabra
  Cuando cancelo
  Entonces la palabra se conserva sin cambios
```

### HU-11 — Progreso y reactivación
**Como** estudiante **quiero** ver mi progreso y reactivar palabras aprendidas **para** saber cuánto avancé y repasar de nuevo lo que quiera.
**Origen:** RF-26, RF-27

```gherkin
Escenario: Ver el progreso
  Dado que tengo palabras pendientes y aprendidas
  Cuando abro la pantalla de progreso
  Entonces veo los contadores y las listas de palabras pendientes y aprendidas

Escenario: Reactivar una palabra aprendida
  Dado que una palabra está en aprendidas
  Cuando la reactivo
  Entonces vuelve a pendientes
```

### HU-12 — Uso sin conexión y sincronización
**Como** estudiante **quiero** estudiar, agregar y editar sin conexión y que todo se sincronice después **para** no perder avance y usar varios dispositivos.
**Origen:** RF-14, RF-21, RF-22, RF-28, RF-29

```gherkin
Escenario: Estudiar sin conexión
  Dado que no tengo conexión
  Cuando estudio mis tarjetas
  Entonces mi progreso se guarda localmente

Escenario: Agregar y editar palabras sin conexión
  Dado que no tengo conexión
  Cuando agrego o edito una palabra
  Entonces el cambio se guarda localmente

Escenario: Sincronizar al recuperar la conexión
  Dado que tengo cambios guardados localmente
  Cuando recupero la conexión
  Entonces la app sincroniza lo pendiente

Escenario: Imágenes ya vistas sin conexión
  Dado que ya vi una imagen con conexión
  Cuando no tengo conexión
  Entonces la imagen se sigue mostrando

Escenario: Conflicto entre dispositivos
  Dado que edité la misma palabra en dos dispositivos
  Cuando ambos sincronizan
  Entonces prevalece el cambio más reciente
```

### HU-13 — Tema y paleta
**Como** estudiante **quiero** elegir tema y paleta de colores **para** estudiar cómodamente con mis preferencias visuales.
**Origen:** RF-10, RF-11

```gherkin
Escenario: Elegir tema
  Dado que abro las preferencias de apariencia
  Cuando elijo tema azul, blanco u oscuro
  Entonces la app adopta el tema elegido

Escenario: Elegir paleta entre presets
  Dado que quiero personalizar el fondo y las tarjetas
  Cuando elijo uno de los presets disponibles
  Entonces la app aplica esa paleta
  Y todos los presets cumplen el contraste WCAG AA

Escenario: Sin selección de color libre
  Dado que personalizo la paleta
  Cuando busco elegir un color arbitrario
  Entonces solo puedo escoger entre presets predefinidos
```

### HU-14 — Lado de la imagen
**Como** estudiante **quiero** definir en qué lado de la tarjeta se muestra la imagen **para** adaptar el estudio a cómo aprendo mejor.
**Origen:** RF-12

```gherkin
Escenario: Imagen en el frente, el reverso o ambos
  Dado que elijo mi preferencia global de imagen
  Cuando selecciono frente, reverso o ambos lados
  Entonces todas mis tarjetas con imagen la muestran en esos lados

Escenario: La preferencia es global
  Dado que cambio la preferencia de imagen
  Cuando estudio tarjetas de distintos mazos
  Entonces todas respetan la misma preferencia
```

---

## 2. Edge cases y escenarios de fallo

### Acceso (HU-01)
```gherkin
# EC-01 — Origen: RF-09
Escenario: Email con formato inválido
  Dado que solicito acceso
  Cuando indico un email con formato inválido
  Entonces no se envía ningún enlace
  Y recibo un mensaje de error que explica el problema

# EC-02 — Origen: RF-09, RF-29
Escenario: Mismo email en otro dispositivo
  Dado que tengo cuenta en un dispositivo
  Cuando accedo con el mismo email desde otro
  Entonces veo los mismos mazos y palabras

# EC-03 — Origen: RF-09, RF-37
Escenario: Enlace de acceso no válido
  Dado que abro un enlace caducado (más de 1 hora), ya usado, reemplazado por uno nuevo o alterado
  Cuando la app lo procesa
  Entonces no inicio sesión
  Y veo un mensaje claro del motivo
  Y puedo solicitar un enlace nuevo
```

### Tarjeta e imagen (HU-02, HU-03)
```gherkin
# EC-04 — Origen: RF-03, RF-14
Escenario: Imagen no disponible
  Dado que la tarjeta tiene imagen, el enlace ya no responde y la imagen no está en caché
  Cuando estudio la tarjeta
  Entonces la tarjeta se muestra igualmente sin imagen
  Y puedo seguir estudiando

# EC-05 — Origen: RF-03
Escenario: Tarjeta sin imagen con preferencia de imagen activa
  Dado que mi preferencia muestra la imagen en el frente
  Cuando estudio una tarjeta sin imagen
  Entonces la tarjeta se muestra con normalidad

# EC-06 — Origen: RF-04
Escenario: Calificar antes de voltear
  Dado que no he volteado la tarjeta
  Cuando intento marcar acierto o fallo
  Entonces la app no registra ningún resultado
```

### Contadores y aprendizaje (HU-03, HU-04)
```gherkin
# EC-07 — Origen: RF-05, RF-07
Escenario: Fallo justo antes de aprender
  Dado que una palabra tiene 2 aciertos consecutivos
  Cuando fallo
  Entonces el contador vuelve a 0
  Y para aprenderla necesito 3 aciertos consecutivos nuevos

# EC-08 — Origen: RF-07
Escenario: Los aciertos no consecutivos no cuentan
  Dado que acerté una palabra, luego fallé, y luego acerté dos veces
  Cuando reviso su contador
  Entonces vale 2 y la palabra sigue pendiente
```

### Sesión (HU-05)
```gherkin
# EC-09 — Origen: RF-35
Escenario: Estudiar un mazo sin palabras
  Dado que un mazo no tiene palabras
  Cuando intento estudiarlo
  Entonces la app me informa de que no hay tarjetas que estudiar
  Y no se inicia una sesión vacía

# EC-10 — Origen: RF-07, RF-35, RF-38
Escenario: Mazo sin pendientes
  Dado que todas las palabras de un mazo están aprendidas
  Cuando intento estudiarlo
  Entonces la app me informa de que no hay pendientes
  Y me ofrece "Reactivar palabras" (lleva al progreso) y "Volver a mazos"
  Y no se inicia una sesión vacía

# EC-11 — Origen: RF-35, RF-38
Escenario: Se agotan las pendientes durante la sesión
  Dado que estoy en una sesión y acierto la última palabra pendiente hasta aprenderla
  Cuando ya no quedan pendientes
  Entonces la sesión termina
  Y veo un resumen con mis aciertos y fallos de la sesión
  Y me ofrece "Reactivar palabras" y "Volver a mazos"

# EC-12 — Origen: RF-05, RF-13
Escenario: Una única palabra pendiente
  Dado que solo queda una palabra pendiente
  Cuando la acierto sin llegar aún a 3 aciertos consecutivos
  Entonces la misma palabra vuelve a presentarse hasta aprenderla o hasta que salga
```

### Palabras e imágenes (HU-06)
```gherkin
# EC-13 — Origen: RF-17, RF-39
Escenario: Palabra sin traducción o sin término en inglés
  Dado que creo una palabra
  Cuando dejo vacío (o solo con espacios) el término en inglés o la traducción
  Entonces la palabra no se crea
  Y se me indica qué campo falta

# EC-14 — Origen: RF-15
Escenario: URL de imagen con protocolo no permitido
  Dado que asocio una imagen
  Cuando la URL no es http(s)
  Entonces se rechaza el enlace con un mensaje de error

# EC-15 — Origen: RF-15
Escenario: URL que no carga como imagen
  Dado que asocio una imagen
  Cuando la URL es http(s) pero no carga como imagen
  Entonces se rechaza el enlace con un mensaje de error
  Y la palabra no queda asociada a esa URL

# EC-16 — Origen: RF-15, RF-21, RF-28
Escenario: Asociar imagen sin conexión
  Dado que no tengo conexión
  Cuando asocio una URL de imagen
  Entonces la URL se guarda como "sin verificar" con un aviso visible

Escenario: Validar la imagen al recuperar la conexión
  Dado que tengo una imagen "sin verificar"
  Cuando recupero la conexión
  Entonces la app comprueba que la URL cargue como imagen
  Y si falla, se retira la imagen de la palabra y se me avisa
```

### Mazos y duplicados (HU-07, HU-08)
```gherkin
# EC-17 — Origen: RF-36
Escenario: Duplicado bloqueado por cualquiera de las dos vías
  Dado que una palabra ya está en un mazo
  Cuando intento agregarla otra vez, arrastrándola o desde el menú de mazos
  Entonces ambas vías la bloquean con el mismo aviso

# EC-18 — Origen: RF-23, RF-36
Escenario: Misma palabra en otro mazo sí se permite
  Dado que una palabra ya está en el mazo A
  Cuando la agrego al mazo B
  Entonces se agrega sin aviso de duplicado

# EC-19 — Origen: RF-20
Escenario: Búsqueda de mazo sin coincidencias
  Dado que busco un mazo al asignar una palabra
  Cuando lo que escribo no coincide con ningún mazo
  Entonces la app indica que no hay resultados
  Y no asigna la palabra a ningún mazo

# EC-20 — Origen: RF-16
Escenario: Sin mazos creados
  Dado que no existen mazos
  Cuando abro la lista de mazos
  Entonces veo un estado vacío que me invita a crear un mazo
```

### Borrado (HU-07, HU-10)
```gherkin
# EC-21 — Origen: RF-19
Escenario: Cancelar el borrado de un mazo
  Dado que se me pide confirmar el borrado de un mazo
  Cuando cancelo
  Entonces el mazo y sus palabras se conservan

# EC-22 — Origen: RF-19, RF-24
Escenario: Borrar un mazo no borra sus palabras
  Dado que un mazo tiene palabras
  Cuando lo borro
  Entonces las palabras siguen existiendo
  Y ya no pertenecen a ese mazo

# EC-23 — Origen: RF-19, RF-23
Escenario: Borrar una palabra que está en varios mazos
  Dado que una palabra pertenece a varios mazos
  Cuando pido borrarla
  Entonces el diálogo de confirmación indica en cuántos mazos está
  Y al confirmar desaparece de la lista de palabras, de todos los mazos y de su progreso
```

### Lista de palabras (HU-09)
```gherkin
# EC-24 — Origen: RF-33
Escenario: Mazo seleccionado sin palabras
  Dado que selecciono un mazo sin palabras
  Cuando veo la lista de palabras
  Entonces el grupo del mazo está vacío
  Y las demás palabras siguen apareciendo en sus grupos

# EC-25 — Origen: RF-33, RF-23
Escenario: Palabra en el mazo seleccionado y en otros
  Dado que una palabra está en el mazo seleccionado y en otro mazo
  Cuando veo la lista de palabras
  Entonces aparece en el grupo del mazo seleccionado y no en el de otros mazos

# EC-26 — Origen: RF-34, RF-24
Escenario: Tras borrar un mazo, sus palabras se ven sin mazo
  Dado que borré un mazo
  Cuando veo la lista de palabras
  Entonces las palabras que solo estaban en ese mazo aparecen como palabras sin mazo

# EC-27 — Origen: RF-33, RF-34
Escenario: Sin ninguna palabra creada
  Dado que no he creado palabras
  Cuando veo la lista de palabras
  Entonces veo un estado vacío que me invita a crear una palabra
```

### Sin conexión y sincronización (HU-12)
```gherkin
# EC-28 — Origen: RF-22, RF-29
Escenario: Conflicto con cambio más reciente
  Dado que dos dispositivos editaron la misma palabra sin conexión
  Cuando ambos recuperan la conexión
  Entonces se conserva el cambio con la marca de tiempo más reciente

# EC-29 — Origen: RF-22
Escenario: Falla la sincronización
  Dado que tengo cambios locales pendientes
  Cuando recupero la conexión y la sincronización falla
  Entonces mis cambios locales no se pierden
  Y veo el indicador "sin sincronizar" y un botón "Reintentar"
  Y la app reintenta automáticamente con espera creciente, hasta 5 veces

# EC-37 — Origen: RF-22
Escenario: Reintento sin duplicados
  Dado que una sincronización se interrumpió a mitad
  Cuando se reintenta
  Entonces cada cambio se aplica una sola vez, sin palabras duplicadas ni contadores sumados dos veces

# EC-30 — Origen: RF-21, RF-28
Escenario: Sin conexión no se bloquea el estudio
  Dado que no tengo conexión
  Cuando abro la app
  Entonces puedo estudiar, agregar y editar palabras

# EC-31 — Origen: RF-14
Escenario: Imagen nunca vista sin conexión
  Dado que no tengo conexión y la imagen de una tarjeta nunca se cargó antes
  Cuando estudio esa tarjeta
  Entonces la tarjeta se muestra sin imagen
  Y puedo continuar estudiando
```

### Progreso (HU-11)
```gherkin
# EC-32 — Origen: RF-26
Escenario: Sin palabras aprendidas
  Dado que no tengo palabras aprendidas
  Cuando abro la pantalla de progreso
  Entonces el contador de aprendidas muestra 0
  Y la lista muestra un estado vacío

# EC-33 — Origen: RF-27, RF-30
Escenario: Reactivar una palabra aprendida
  Dado que reactivo una palabra aprendida en un mazo
  Cuando la estudio de nuevo
  Entonces aparece entre las pendientes de ese mazo
  Y su contador de aciertos consecutivos es 0

# EC-34 — Origen: RF-30
Escenario: Reactivar solo afecta al mazo correspondiente
  Dado que una palabra está aprendida en dos mazos
  Cuando la reactivo en uno
  Entonces sigue aprendida en el otro
```

### Apariencia (HU-13, HU-14)
```gherkin
# EC-35 — Origen: RF-11
Escenario: Todas las paletas ofrecidas cumplen contraste AA
  Dado que combino un preset de fondo con un preset de tarjeta
  Cuando los aplico
  Entonces el texto mantiene contraste ≥ 4.5:1 y los elementos de UI ≥ 3:1

# EC-36 — Origen: RF-10, CLAUDE.md
Escenario: Respeto a la reducción de movimiento
  Dado que mi sistema pide reducir el movimiento
  Cuando volteo una tarjeta
  Entonces la animación de volteo se reduce o desaparece
```

---

## 3. Vacíos detectados en `specs.md`: resueltos (2026-10-10)

Los nueve vacíos de la primera versión de este backlog se resolvieron en `specs.md` (ver §7 y §8 allí). No quedan `[A CONFIRMAR]` abiertos.

| # | Resolución en `specs.md` | Escenarios actualizados |
|---|---|---|
| V-01 | RF-37 | EC-03 |
| V-02 | RF-38 | EC-10, EC-11 |
| V-03 | RF-39 | EC-13 |
| V-04 | RF-15 | EC-16 |
| V-05 | RF-19 | EC-23 |
| V-06 | RF-27 | EC-33 |
| V-07 | RF-22 | EC-29, EC-37 |
| V-08 | RF-40 | HU-08 (nuevo escenario) |
| V-09 | RF-14 | EC-31 |

---

## 4. Trazabilidad RF → historias

| RF | Historias / EC | RF | Historias / EC |
|---|---|---|---|
| RF-01 | HU-02 | RF-19 | HU-07, HU-10, EC-21, EC-22, EC-23 |
| RF-02 | HU-02 | RF-20 | HU-08, EC-19 |
| RF-03 | HU-02, HU-06, EC-04, EC-05 | RF-21 | HU-12, EC-16, EC-30 |
| RF-04 | HU-03, EC-06 | RF-22 | HU-12, EC-28, EC-29, EC-37 |
| RF-05 | HU-03, EC-07, EC-12 | RF-23 | HU-08, EC-18, EC-25 |
| RF-06 | HU-03 | RF-24 | HU-07, EC-22, EC-26 |
| RF-07 | HU-04, EC-07, EC-08, EC-10 | RF-25 | HU-05 |
| RF-08 | HU-06 | RF-26 | HU-11, EC-32 |
| RF-09 | HU-01, EC-01, EC-02, EC-03 | RF-27 | HU-11, EC-33, EC-34 |
| RF-10 | HU-13, EC-36 | RF-28 | HU-12, EC-30 |
| RF-11 | HU-13, EC-35 | RF-29 | HU-12, EC-02, EC-28 |
| RF-12 | HU-14 | RF-30 | HU-04, EC-33, EC-34 |
| RF-13 | HU-05, EC-12 | RF-31 | HU-05 |
| RF-14 | HU-12, EC-04, EC-31 | RF-32 | HU-02, HU-06 |
| RF-15 | HU-06, EC-14, EC-15, EC-16 | RF-33 | HU-09, EC-24, EC-25, EC-27 |
| RF-16 | HU-07, EC-20 | RF-34 | HU-09, EC-26, EC-27 |
| RF-17 | HU-06, EC-13 | RF-35 | HU-05, EC-09, EC-10, EC-11 |
| RF-18 | HU-08 | RF-36 | HU-08, EC-17, EC-18 |
| RF-37 | EC-03 | RF-38 | HU-05, EC-10, EC-11 |
| RF-39 | HU-06, EC-13 | RF-40 | HU-08 |

**Requisitos no funcionales** (WCAG AA, tokens, estados vacío/carga/error, PWA, no depender solo del color): se heredan de CLAUDE.md y no tienen historia propia; los casos que los ejercen son EC-35, EC-36, EC-20, EC-27 y el último escenario de HU-09.
