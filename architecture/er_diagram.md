# Miracle Flashcards — Diagrama Entidad-Relación (`architecture/er_diagram.md`)

> Fecha: 2026-10-10. Fuentes: `docs/specs.md` (única fuente de verdad) y `architecture/architecture.md`.
> Si este documento contradice `specs.md`, gana `specs.md`. Modelo **lógico** (sin SQL, sin tipos de motor).
> Criterio: toda entidad, atributo y relación cita un requerimiento (RF-nn) de `specs.md`. No se añade nada que el PRD no justifique.

## 1. Diagrama

```mermaid
erDiagram
    USUARIO ||--o| PREFERENCIA : "tiene"
    USUARIO ||--o{ MAZO : "posee"
    USUARIO ||--o{ PALABRA : "posee"
    MAZO ||--o{ MAZO_PALABRA : "contiene"
    PALABRA ||--o{ MAZO_PALABRA : "pertenece a"
    MAZO_PALABRA ||--o{ EVENTO_PROGRESO : "registra"

    USUARIO {
        uuid id PK
        string email UK "RF-09 identifica de forma unica"
        timestamp creado_en "servidor"
    }

    PREFERENCIA {
        uuid usuario_id PK, FK "RF-42 una por cuenta"
        enum tema "RF-10 azul, blanco, oscuro"
        string paleta_fondo "RF-11 preset predefinido"
        string paleta_tarjeta "RF-11 preset predefinido"
        enum lado_imagen "RF-12 frente, reverso, ambos"
        timestamp actualizado_en "RF-29 RF-42 marca del servidor"
    }

    MAZO {
        uuid id PK
        uuid usuario_id FK
        string nombre "RF-16 obligatorio, max 60"
        string nombre_normalizado "RF-16 unico por usuario, sin mayusculas ni acentos"
        timestamp actualizado_en "RF-29 marca del servidor"
        timestamp eliminado_en "RF-29 el borrado prevalece"
    }

    PALABRA {
        uuid id PK
        uuid usuario_id FK
        string ingles "RF-01 RF-39 obligatorio"
        string ingles_normalizado "RF-36 no unico, solo para detectar duplicados"
        string espanol "RF-02 RF-39 obligatorio"
        string imagen_url "RF-03 opcional, solo enlace"
        boolean imagen_verificada "RF-15 false = sin verificar"
        string ejemplo "RF-32 opcional"
        string nota "RF-32 opcional"
        timestamp ingles_act_en "RF-29 conflicto por campo"
        timestamp espanol_act_en "RF-29 conflicto por campo"
        timestamp imagen_act_en "RF-29 conflicto por campo"
        timestamp ejemplo_act_en "RF-29 conflicto por campo"
        timestamp nota_act_en "RF-29 conflicto por campo"
        timestamp eliminado_en "RF-29 el borrado prevalece"
    }

    MAZO_PALABRA {
        uuid mazo_id PK, FK "RF-23 RF-30"
        uuid palabra_id PK, FK "RF-23 RF-30 RF-36 sin repetir en el mazo"
        int aciertos_consecutivos "RF-05 RF-06 RF-30"
        enum estado "RF-07 RF-27 pendiente o aprendida"
    }

    EVENTO_PROGRESO {
        uuid id PK "RF-22 idempotencia por id de evento"
        uuid mazo_id FK "RF-30"
        uuid palabra_id FK "RF-30"
        boolean acierto "RF-04 acierto o fallo"
        int orden_local "RF-29 orden de los eventos"
        timestamp registrado_en_cliente "RF-29 solo informativa"
        timestamp recibido_en "RF-29 marca del servidor"
    }
```

## 2. Trazabilidad

### Entidades

| Entidad | Requerimientos | Justificación |
|---|---|---|
| USUARIO | RF-09 | Cuenta identificada de forma única por email (enlace mágico, sin contraseña). |
| PREFERENCIA | RF-10, RF-11, RF-12, RF-42 | Tema, paleta y lado de la imagen se guardan con la cuenta y se sincronizan. |
| MAZO | RF-16, RF-19, RF-24 | Varios mazos por usuario, con nombre único; se editan y borran. |
| PALABRA | RF-01, RF-02, RF-03, RF-08, RF-32, RF-39 | Tarjeta con inglés, español, imagen, ejemplo y nota. Existe con o sin mazo (RF-24, RF-33, RF-34). |
| MAZO_PALABRA | RF-23, RF-30, RF-36, RF-40 | Pertenencia N:M y progreso por palabra dentro de cada mazo. |
| EVENTO_PROGRESO | RF-04, RF-22, RF-29 | Progreso sincronizado como eventos ordenados e idempotentes; contador y estado se recalculan. |

### Relaciones y cardinalidad

| Relación | Cardinalidad | Requerimientos |
|---|---|---|
| USUARIO — PREFERENCIA | 1 a 0..1 | RF-42: una por cuenta; si no hay registro, rige la preferencia del sistema. |
| USUARIO — MAZO | 1 a 0..N | RF-16: la cuenta tiene varios mazos (o ninguno). |
| USUARIO — PALABRA | 1 a 0..N | RF-08: el usuario agrega sus propias palabras. |
| MAZO — MAZO_PALABRA — PALABRA | N a M | RF-23: una palabra en varios mazos; RF-24: puede estar en ninguno. |
| MAZO_PALABRA — EVENTO_PROGRESO | 1 a 0..N | RF-29, RF-30: los eventos de acierto/fallo son por palabra en cada mazo. |

### Reglas de integridad que el modelo debe respetar (para la fase SQL)

| Regla | Requerimiento |
|---|---|
| `email` único; `(usuario_id, nombre_normalizado)` único en MAZO. | RF-09, RF-16 |
| `(mazo_id, palabra_id)` único (clave primaria de MAZO_PALABRA). | RF-36 |
| `ingles_normalizado` **no** es único: al crear solo se avisa. | RF-36 |
| `ingles` y `espanol` no vacíos tras recortar espacios; `nombre` ≤ 60. | RF-16, RF-39 |
| Quitar una palabra de un mazo elimina su fila de MAZO_PALABRA y sus eventos; al reagregarla el contador empieza en 0. | RF-40 |
| Reactivar pone `estado = pendiente` y `aciertos_consecutivos = 0`. | RF-27 |
| `estado = aprendida` cuando `aciertos_consecutivos` llega a 3; un fallo lo reinicia a 0. | RF-05, RF-06, RF-07 |
| Borrar una palabra la elimina de todos los mazos con su progreso; borrar un mazo deja sus palabras sin mazo. | RF-19, RF-24 |
| `eliminado_en` conserva el borrado para que prevalezca ante ediciones o eventos concurrentes. | RF-29 |
| Los EVENTO_PROGRESO sincronizados se conservan; solo se eliminan al quitar la palabra del mazo, al borrarla o al borrar el mazo. | RF-29, RF-40, RF-19 |

## 3. Lo que no es entidad (y por qué)

| Concepto | Motivo |
|---|---|
| Sesión de estudio, pasadas y resumen de sesión | RF-31, RF-35, RF-38: se calculan en tiempo de ejecución a partir de MAZO_PALABRA; specs.md no pide guardar historial de sesiones. |
| Pantalla de progreso (contadores y listas) | RF-26: se deriva de `estado` en MAZO_PALABRA; no se almacena. |
| Panel derecho y sus tres grupos | RF-33, RF-34: se derivan de MAZO_PALABRA (palabras con o sin mazo). |
| Enlace mágico (caducidad, un solo uso, 60 s) | RF-37: lo gestiona Supabase Auth, no el modelo de la aplicación. |
| Cola de cambios pendientes, indicador "sin sincronizar", sesión offline | RF-21, RF-22, RF-41: estado local en IndexedDB, no del modelo de dominio. |
| Imágenes cacheadas | RF-03, RF-14: las guarda el Service Worker; la app solo guarda el enlace. |
| Archivos de imagen, fechas de repaso, dirección español → inglés | Fuera de alcance (specs.md §2). |

## 4. Notas de diseño

- `aciertos_consecutivos` y `estado` son derivables de EVENTO_PROGRESO (RF-29: se recalculan). Se conservan en MAZO_PALABRA porque RF-30 los define por palabra y mazo y el estudio offline (RF-28) los lee directamente.
- Las marcas `*_act_en` por campo de PALABRA existen solo para el conflicto por campo de RF-29.
- `eliminado_en` es una lápida técnica para propagar el borrado entre dispositivos (RF-29). Para el usuario el borrado sigue siendo definitivo (RF-19) y la lápida puede purgarse tras sincronizar.
- Retención de eventos: no se purgan, lo que permite recalcular el progreso (RF-29). Purgarlos sería una decisión nueva que debe registrarse primero en `specs.md`.
- Todas las entidades se filtran por `usuario_id` (directo o vía MAZO/PALABRA); la política de acceso se detalla en la fase SQL.
