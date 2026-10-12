# ADR-001: Selección de backend-as-a-service y base de datos para el MVP

- **Estado:** Propuesto
- **Fecha:** 2026-10-10
- **Fuente de requisitos:** `docs/specs.md` (única fuente de verdad)

> **Nota 2026-10-11:** el modelo se nombra en inglés (`Word`, `Deck`, `DeckWord`, `ProgressEvent`, `Preference`; ver `architecture/er_diagram.md` y `docs/frontend-specs.md` §4.1). Los nombres `words`, `decks` y `deck_words` de este ADR ya coinciden con esa nomenclatura. El frontend accede al backend mediante las interfaces `SyncRemote` y `AuthService` (con implementación mock hasta que exista el SQL).

## Contexto

`docs/specs.md` §3 propone Supabase como backend de forma tentativa. Este ADR lo evalúa frente a Firebase usando solo los requerimientos de `specs.md`; no se introducen requisitos nuevos.

Los requerimientos que condicionan la elección son:

| Tema | Requerimientos |
|---|---|
| Autenticación | RF-09 (enlace mágico por email, sin contraseña), RF-37 (caduca a la hora, un solo uso, se invalida al emitir uno nuevo, 60 s entre solicitudes), RF-41 (sesión persistente sin conexión) |
| Modelo de datos | RF-23 (palabra en varios mazos), RF-30 (contador y estado por palabra dentro de cada mazo), RF-24 (borrar mazo conserva palabras), RF-19 (borrar palabra la elimina de todos los mazos con su progreso), RF-40 (quitar de un mazo borra su progreso) |
| Integridad | RF-16 (nombre de mazo único sin distinguir mayúsculas ni acentos), RF-36 (no repetir la misma palabra en un mazo; igualdad por inglés normalizado) |
| Consultas | RF-26 (contadores y listas de progreso por mazo), RF-33/34 (listado de palabras por grupos) |
| Offline y sincronización | RF-21, RF-22 (reintentos con espera creciente, máx. 5; indicador "sin sincronizar"; botón "Reintentar"; operaciones idempotentes), RF-28 |
| Conflictos multidispositivo | RF-29 (marca de tiempo asignada por el servidor; resolución por campo; progreso como eventos ordenados con contador y estado recalculados; el borrado prevalece) |
| Preferencias | RF-10, RF-12, RF-42 (sincronizadas con la cuenta) |
| Restricciones de alcance | RF-03 (imágenes solo por enlace, sin archivos), CLAUDE.md (sin analítica de terceros; caché local en IndexedDB y service worker para imágenes, RF-14) |

Fuera del alcance de esta decisión: la caché de imágenes (RF-14) la resuelve el service worker en el cliente y es independiente del BaaS elegido.

## Opciones consideradas

### Opción A: Supabase (Postgres + Auth)

**Pros**
- **RF-23, RF-30, RF-24, RF-19, RF-40:** el modelo es relacional natural (`words`, `decks`, `deck_words` con el progreso por par). Las claves foráneas con `ON DELETE CASCADE` / `SET NULL` implementan directamente el borrado de palabra (a todos los mazos, con progreso), el borrado de mazo (palabras conservadas) y el quitar de mazo (progreso eliminado).
- **RF-16, RF-36:** los índices únicos sobre expresiones (minúsculas, sin acentos, recortado) hacen cumplir la unicidad en la base de datos, también ante dos dispositivos concurrentes.
- **RF-26:** contadores y listas por mazo son agregaciones SQL (`GROUP BY`) sobre `deck_words`.
- **RF-29:** la marca de tiempo del servidor es `now()` o un trigger; el progreso como eventos es una tabla de solo inserción, y el contador y el estado se recalculan en una función o vista SQL. La resolución por campo se implementa con una marca de tiempo por campo escrita por el servidor.
- **RF-22 (idempotencia):** una clave única por evento más `ON CONFLICT DO NOTHING` hace idempotente el reenvío.
- **RF-22 (control de reintentos):** la cola de sincronización es del cliente, por lo que el máximo de 5 reintentos con espera creciente, el indicador "sin sincronizar" y el botón "Reintentar" se implementan exactamente como se especifican.
- **RF-09, RF-37:** Auth ofrece enlace mágico por email sin contraseña. El propio `specs.md` (registro de decisiones, R22) señala que la vigencia de 1 h y el uso único son el estándar de Supabase Auth; el límite de 60 s entre solicitudes coincide con el de envío de email por usuario (verificar la configuración al implementar).
- **RF-41:** la sesión se persiste en el cliente y no requiere red tras el primer acceso.
- **RF-03:** no se necesita almacenamiento de archivos; no hay servicios sin usar que gestionar.

**Contras**
- **RF-21, RF-28:** no incluye sincronización offline. La cola de escrituras locales en IndexedDB (ya prevista en CLAUDE.md) y la lógica de sincronización hay que construirlas y probarlas.
- **RF-29:** el recálculo por eventos, las marcas de tiempo por campo y los tombstones de borrado requieren diseño propio (tablas, triggers o funciones RPC) y pruebas de conflicto.
- Las reglas de acceso por usuario (RLS) deben escribirse explícitamente para que cada cuenta vea solo sus datos (RF-09: el email identifica al usuario).

### Opción B: Firebase (Authentication + Cloud Firestore)

**Pros**
- **RF-21, RF-28:** el SDK web de Firestore incluye persistencia offline y cola de escrituras pendientes, lo que reduciría el código de sincronización básico.
- **RF-09, RF-41:** Authentication ofrece acceso por enlace de email sin contraseña y persiste la sesión en el cliente.
- **RF-29 (marca de tiempo):** existe `serverTimestamp()` para que el servidor asigne la hora.
- **RF-29 (campos):** las actualizaciones por campo sobre un documento evitan pisar campos distintos.
- **RF-10, RF-12, RF-42:** las preferencias caben en un documento por usuario.

**Contras**
- **RF-23, RF-30, RF-19, RF-24, RF-40:** Firestore es documental y no tiene claves foráneas ni borrado en cascada. La relación palabra↔mazo con progreso por par se modela con duplicación o subcolecciones, y los borrados en cascada deben orquestarse a mano (transacciones, lotes o código de servidor).
- **RF-16, RF-36:** no hay restricciones de unicidad; garantizar nombre de mazo único y palabra no repetida en un mazo exige transacciones o claves de documento derivadas de la forma normalizada, con la normalización de acentos hecha en el cliente.
- **RF-29 (eventos y recálculo):** recalcular contador y estado a partir de eventos ordenados requiere transacciones del cliente o código de servidor adicional (por ejemplo, Cloud Functions), que añade un componente a operar y probar.
- **RF-22:** el SDK gestiona sus propios reintentos; no permite fijar "máximo 5 reintentos con espera creciente" ni el botón "Reintentar" tal como se especifican. Habría que superponer una capa propia sobre una cola que no controlamos.
- **RF-37:** la vigencia del enlace de email no es configurable al nivel que exige el requisito (1 h, invalidación al emitir uno nuevo, 60 s entre solicitudes); habría que verificarlo y, de no cumplirse, implementar controles propios. *(Verificar contra la documentación vigente antes de dar el punto por cerrado.)*
- **RF-26:** contadores y listas por mazo se resuelven con consultas por colección y agregaciones más limitadas que SQL; el progreso por mazo y la pertenencia múltiple complican las consultas.
- **CLAUDE.md (sin analítica de terceros):** el SDK de Firebase integra Analytics como producto opcional; habría que asegurar que no se habilita.
- **CLAUDE.md (stack):** contradice el stack tentativo (Postgres + IndexedDB) y requeriría reabrir `specs.md` §3.

## Decisión

Se elige **Supabase (Postgres + Auth)** para el MVP.

Razones, por requerimiento:
1. El dominio es relacional: pertenencia múltiple con progreso por par (RF-23, RF-30) y borrados con efectos definidos (RF-19, RF-24, RF-40) se expresan de forma nativa con claves foráneas y cascadas en Postgres; en Firestore habría que reimplementarlos a mano.
2. La integridad exigida por RF-16 y RF-36 se garantiza con índices únicos en la base de datos, incluso con varios dispositivos (RF-29).
3. La sincronización de RF-22 y RF-29 exige control fino (idempotencia, máx. 5 reintentos, indicador y botón, eventos ordenados, marca de tiempo del servidor). Una cola propia sobre Postgres lo permite; la cola interna de Firestore, no.
4. La ventaja real de Firebase, la persistencia offline integrada (RF-21, RF-28), no compensa lo anterior, porque CLAUDE.md ya prevé IndexedDB como caché local y RF-22 exige un comportamiento que el SDK no ofrece tal cual.
5. Es coherente con el stack tentativo de CLAUDE.md y `specs.md` §3, y el enlace mágico de RF-37 coincide con el estándar de Supabase Auth.

## Consecuencias

**Positivas**
- Esquema relacional que refleja `specs.md` y permite que la base de datos haga cumplir RF-16, RF-19, RF-24, RF-36 y RF-40.
- Contadores y listas de progreso (RF-26) con consultas SQL simples.
- Sin componentes adicionales de servidor para RF-29: las marcas de tiempo, el recálculo y los tombstones viven en la base de datos.

**Negativas / riesgos**
- Hay que construir la capa offline y de sincronización (RF-21, RF-22, RF-28, RF-29): cola de operaciones en IndexedDB, reintentos, idempotencia y fusión por campo. Es el mayor riesgo técnico del MVP.
- Hay que escribir y probar las políticas de acceso por usuario (RLS) y las funciones de recálculo de progreso.
- Los parámetros de Auth (vigencia de 1 h, uso único, 60 s entre solicitudes, RF-37) deben verificarse en la configuración del proyecto y cubrirse en el plan de pruebas.

**Trabajo derivado**
- Documentar en `docs/architecture.md` el esquema, las políticas RLS y el protocolo de sincronización.
- Añadir al `docs/test-plan.md` los casos de conflicto de RF-29 y de fallo de sincronización de RF-22.
- Si se confirma el stack, actualizar `docs/specs.md` §3 (de "tentativo" a confirmado) y su registro de decisiones; los cambios de requisitos se hacen primero ahí.
