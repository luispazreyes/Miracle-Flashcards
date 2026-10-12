# Miracle Flashcards — Contrato de API (`docs/api-contract.md`)

> Fecha: 2026-10-11. Estado: **BORRADOR pendiente de aprobación**. Fuente única de requisitos: `docs/specs.md`; si este contrato la contradice, gana `specs.md`.
> Origen del contrato: `frontend/src/data/remote/contract.ts` (push/pull), `frontend/src/data/auth/AuthService.ts`, `frontend/src/domain/{ops,schemas}.ts`, `frontend/src/data/repositories/*` y `docs/backlog.md`.
> Semántica de servidor de referencia: `frontend/src/data/remote/mock/server.ts`.

## 0. Alcance y hallazgos

- El frontend es **offline-first**: escribe en IndexedDB (Dexie), encola operaciones en el `outbox` y el `SyncEngine` las envía con `push`/`pull`. Hoy **no hace llamadas REST por recurso**. Por decisión de diseño, el backend expone **sync + REST por recurso**; el REST por recurso es la vista "de servidor" de cada operación y comparte la misma lógica que `push`.
- **No existen** `board.store.ts`, un store "tableflashcard", locking ni auditoría en el frontend, en `backlog.md` ni en `specs.md`. Se **excluyen** de este contrato (ver §6, hueco H-01).
- Lo que el frontend sí tiene como "acciones de datos": 4 métodos de `AuthService`, `push`/`pull` de `SyncRemote`, y 12 tipos de operación (`OpBody`) generadas por los repositorios `words`, `decks`, `deckWords`, `progress`, `preferences`.

## 1. Convenciones

| Tema | Regla |
|---|---|
| Base | `/api/v1`, rutas en plural y `kebab-case` |
| Formato | JSON UTF-8; tiempos en milisegundos desde epoch (enteros) |
| Auth | `Authorization: Bearer <accessToken>`. El `userId` sale del token, nunca de la ruta ni del cuerpo |
| IDs | Los genera el cliente (UUID) para poder crear offline (`id` en `word.create`, `deck.create`, `eventId`) |
| Marcas de tiempo | `*UpdatedAt` y `receivedAt` los asigna **siempre el servidor** (EC-38); `createdAt`/`recordedAtClient` del cliente son informativos |
| Idempotencia | `opId` (UUID) en `push`; en REST, cabecera `Idempotency-Key` (= `opId`). Reenviar devuelve `alreadyApplied` / el mismo resultado (EC-37) |
| Envelope éxito | `{ "data": <payload>, "error": null }` |
| Envelope fallo | `{ "data": null, "error": <Problem> }` con `Content-Type: application/problem+json` |
| Paginación | Cursor: `?cursor=<opaco>&limit=<1..100, def. 50>` → `data: { "items": [...], "nextCursor": "<opaco>" \| null }`. `GET /sync/pull` usa el cursor **numérico de versión** ya definido en el cliente |
| Borrados | Lápidas: una operación sobre algo borrado se **descarta** (`discarded`, `reason: "deleted"`) (EC-41) |

### 1.1 Formato de error (RFC 7807 dentro del envelope)

```json
{
  "data": null,
  "error": {
    "type": "https://miracle-flashcards.app/problems/deck-word-duplicate",
    "title": "La palabra ya está en el mazo",
    "status": 409,
    "detail": "La palabra 'dog' ya pertenece al mazo 'Animales'.",
    "instance": "/api/v1/decks/d1/words/w1",
    "code": "DECK_WORD_DUPLICATE",
    "errors": [{ "field": "name", "code": "TOO_LONG", "message": "Máximo 60 caracteres" }]
  }
}
```

`errors[]` es opcional (solo validación, 422). `code` es un identificador estable en `SCREAMING_SNAKE_CASE`; el cliente decide el texto de UI. Catálogo de códigos en §5.

### 1.2 Tipos compartidos (derivados de `domain/schemas.ts`)

```ts
Word     = { id, userId, english, normalizedEnglish, spanish, imageUrl?, imageVerified: boolean,
             example?, note?, englishUpdatedAt, spanishUpdatedAt, imageUpdatedAt, exampleUpdatedAt, noteUpdatedAt }
Deck     = { id, userId, name /*1..60*/, normalizedName, updatedAt }
DeckWord = { deckId, wordId, consecutiveHits /*0..3*/, status: 'pending' | 'learned' }
Preference = { userId, theme: 'blue'|'white'|'dark', backgroundPalette, cardPalette, imageSide: 'front'|'back'|'both', updatedAt }
Changes  = { words: Word[], decks: Deck[], deckWords: DeckWord[], preference: Preference | null,
             deleted: { words: id[], decks: id[], deckWords: {deckId, wordId}[] }, cursor: number }
```

---

## 2. Endpoints P0 — bloquean todo lo demás

### 2.1 Acceso (HU-01, EC-01..03, EC-50)

| # | Método y ruta | Request | Response (`data`) | Errores | Disparador |
|---|---|---|---|---|---|
| A1 | `POST /auth/magic-links` | `{ email }` | `202` `{ sent: true }` | `422 EMAIL_INVALID` · `429 AUTH_COOLDOWN` (60 s, `Retry-After`) · `503 AUTH_SEND_FAILED` | `features/access/AccessPage.tsx` → `AuthService.requestMagicLink` |
| A2 | `POST /auth/sessions` | `{ token }` (token del enlace) | `{ userId, email, accessToken, refreshToken, expiresAt }` | `401 AUTH_LINK_INVALID` (caducado >1 h, usado, reemplazado o alterado) | `AccessPage.tsx` → `AuthService.consumeLink` |
| A3 | `DELETE /auth/sessions/current` | — | `204` | `401` | `app/useLogout.tsx` → `AuthService.signOut` |

Notas: A1 crea la cuenta si el email no existe y reutiliza la misma si existe (HU-01 esc. 3, EC-02); un enlace nuevo invalida el anterior (EC-50). A2 es de un solo uso. Se renombraron las rutas a recursos (`magic-links`, `sessions`) para respetar plural/kebab-case.

### 2.2 Sincronización (HU-12, EC-28..31, EC-37..43)

| # | Método y ruta | Request | Response (`data`) | Disparador |
|---|---|---|---|---|
| S1 | `POST /sync/push` | `{ ops: [{ opId, createdAt, op: { type, payload } }] }` (máx. 50 por lote) | `{ results: [{ opId, outcome: 'applied'\|'alreadyApplied'\|'discarded', reason?: 'deleted' }], changes: Changes }` | `data/sync/engine.ts` → `SyncEngine.pushAll` (tras cada escritura local, al volver la conexión, `retry` manual y reintentos con espera creciente ≤ 5) |
| S2 | `GET /sync/changes?cursor=<n>` | — | `Changes` (todo con versión > cursor + lápidas) | `SyncEngine.pullAll` (tras cada `push` y al arrancar) |

> El frontend llama hoy a `SyncRemote.pull(cursor)`; se expone como `GET /sync/changes` (sustantivo, no verbo). `push` se mantiene como acción RPC por ser un lote atómico por operación.

Reglas del servidor (de `contract.ts` y `mock/server.ts`):
1. `push` es **idempotente por `opId`**: una op ya aplicada → `alreadyApplied`; ya descartada → `discarded`.
2. Se procesa en orden del lote. La respuesta incluye `changes` desde la versión previa al lote, para que el cliente se actualice sin otro `pull`.
3. Parches de palabra **por campo**; gana el cambio con `*UpdatedAt` de servidor más reciente por campo (EC-38, EC-39).
4. Progreso = reproducción de eventos del par (mazo, palabra) ordenados por `receivedAt`, luego `localOrder`; el servidor recalcula contador y estado (EC-40, RF-30).
5. El borrado prevalece sobre la edición (EC-41). Borrar una palabra o mazo elimina sus `deckWords` y el historial, con lápida.
6. Si el cliente no recibe ack de ninguna op del lote, el cliente lo trata como fallo y reintenta.

**Variantes de `op` aceptadas por `S1`** (12 tipos de `domain/ops.ts`) y su equivalente REST:

| `op.type` | `payload` | Resultado `discarded` si… | REST equivalente | Generada por |
|---|---|---|---|---|
| `word.create` | `{ id, english, normalizedEnglish, spanish, imageUrl?, imageVerified, example?, note? }` | la palabra tiene lápida | `POST /words` | `repos.words.create` |
| `word.update` | `{ id, patch: { english?, normalizedEnglish?, spanish?, imageUrl?\|null, imageVerified?, example?\|null, note?\|null } }` | la palabra no existe | `PATCH /words/{id}` | `repos.words.update`, `resolveImage` |
| `word.delete` | `{ id }` | nunca (idempotente) | `DELETE /words/{id}` | `repos.words.delete` |
| `deck.create` | `{ id, name, normalizedName }` | el mazo tiene lápida | `POST /decks` | `repos.decks.create` |
| `deck.rename` | `{ id, name, normalizedName }` | el mazo no existe | `PATCH /decks/{id}` | `repos.decks.rename` |
| `deck.delete` | `{ id }` | nunca | `DELETE /decks/{id}` | `repos.decks.delete` |
| `deckWord.add` | `{ deckId, wordId }` | falta el mazo o la palabra | `PUT /decks/{deckId}/words/{wordId}` | `repos.deckWords.add` |
| `deckWord.remove` | `{ deckId, wordId }` | nunca | `DELETE /decks/{deckId}/words/{wordId}` | `repos.deckWords.remove` |
| `progress.record` | `{ eventId, deckId, wordId, hit, localOrder, recordedAtClient }` | no existe la pertenencia | `POST /decks/{deckId}/words/{wordId}/answers` | `repos.progress.record` |
| `progress.reactivate` | `{ deckId, wordId }` | no existe la pertenencia | `POST /decks/{deckId}/words/{wordId}/reactivation` | `repos.progress.reactivate` |
| `preference.update` | `{ patch: { theme?, backgroundPalette?, cardPalette?, imageSide? } }` | nunca | `PATCH /preferences` | `repos.preferences.update` |
| `image.verify` | `{ wordId, imageUrl }` | — | **solo local** (no se envía en `push`; el cliente lo filtra) | `repos.words.create/update` → `SyncEngine.verifyImages` |

### 2.3 Palabras (HU-06, HU-10, EC-13..16, EC-23, EC-45)

| # | Método y ruta | Request | Response (`data`) | Errores | Disparador |
|---|---|---|---|---|---|
| W1 | `GET /words?cursor=&limit=&q=` | `q` opcional (HU-15, ver P1) | `{ items: Word[], nextCursor }` | `401` | `data/hooks/useLive` (hoy desde Dexie) / hidratación tras login |
| W2 | `POST /words` | `{ id, english, normalizedEnglish, spanish, imageUrl?, imageVerified, example?, note? }` | `201` `Word` + `meta`-like campo `duplicateEnglish: boolean` dentro de `data` (`{ word, duplicateEnglish }`) | `422 WORD_FIELD_REQUIRED` (inglés/español vacío o solo espacios) · `422 IMAGE_URL_INVALID` (no http/https) · `409 WORD_ID_CONFLICT` | `features/words/WordFormDialog.tsx` → `repos.words.create` |
| W3 | `GET /words/{id}` | — | `Word` | `404 WORD_NOT_FOUND` | `WordFormDialog.tsx` (edición) |
| W4 | `PATCH /words/{id}` | parche por campo; `null` quita opcionales | `Word` | `404` · `422` (igual que W2) · `410 WORD_DELETED` (el borrado prevalece) | `WordFormDialog.tsx` → `repos.words.update` |
| W5 | `DELETE /words/{id}` | — | `204`; elimina de todos los mazos y progreso | — (idempotente) | `features/words/WordsPanel.tsx` → `repos.words.delete` |

Notas: `duplicateEnglish` es aviso, no bloqueo (EC-45); la comprobación se hace por `normalizedEnglish` (EC-44). El diálogo de borrado muestra en cuántos mazos está la palabra (EC-23) usando `GET /words/{id}/decks` (P1, ver §3).

### 2.4 Mazos (HU-07, EC-20..22, EC-48)

| # | Método y ruta | Request | Response (`data`) | Errores | Disparador |
|---|---|---|---|---|---|
| D1 | `GET /decks?cursor=&limit=` | — | `{ items: Deck[], nextCursor }` | `401` | `features/decks/DecksPane.tsx` (hoy Dexie) |
| D2 | `POST /decks` | `{ id, name, normalizedName }` | `201` `Deck` | `422 DECK_NAME_REQUIRED` · `422 DECK_NAME_TOO_LONG` (>60) · `409 DECK_NAME_TAKEN` (sin distinguir mayúsculas/acentos) | `DecksPane.tsx` → `repos.decks.create` |
| D3 | `PATCH /decks/{id}` | `{ name, normalizedName }` | `Deck` | `404 DECK_NOT_FOUND` · mismos 422/409 que D2 | `DecksPane.tsx` → `repos.decks.rename` |
| D4 | `DELETE /decks/{id}` | — | `204`; las palabras se conservan, sus pertenencias y progreso se eliminan | — (idempotente) | `DecksPane.tsx` → `repos.decks.delete` |

### 2.5 Pertenencia palabra↔mazo (HU-08, HU-17, EC-17..19, EC-44, EC-56..59)

| # | Método y ruta | Request | Response (`data`) | Errores | Disparador |
|---|---|---|---|---|---|
| M1 | `GET /decks/{deckId}/words?status=&cursor=&limit=` | `status`: `pending`\|`learned` opcional | `{ items: DeckWord[], nextCursor }` | `404 DECK_NOT_FOUND` | `features/study/useStudySession.ts`, `DecksPane.tsx` (hoy Dexie) |
| M2 | `PUT /decks/{deckId}/words/{wordId}` | — | `201` `DeckWord` (`consecutiveHits: 0`, `pending`) | `409 DECK_WORD_DUPLICATE` (ya está; mismo aviso por arrastre o menú) · `404 DECK_NOT_FOUND`/`WORD_NOT_FOUND` | `features/words/WordsPanel.tsx` y `app/DragContext.tsx` → `repos.deckWords.add` |
| M3 | `DELETE /decks/{deckId}/words/{wordId}` | — | `204`; borra también el progreso del par; si se re-agrega empieza en 0 | — (idempotente) | `WordsPanel.tsx` → `repos.deckWords.remove` |

> Nota sobre `409` en M2: `push` trata `deckWord.add` sobre un par existente como `applied` (idempotencia, EC-59). El `409` es solo la respuesta REST para quien lo pida de forma interactiva; el bloqueo de duplicado con aviso es una validación del **cliente** (HU-08, EC-17), de modo que funcione offline.

### 2.6 Progreso de estudio (HU-03, HU-04, HU-05, EC-06..12, EC-46)

| # | Método y ruta | Request | Response (`data`) | Errores | Disparador |
|---|---|---|---|---|---|
| P1 | `POST /decks/{deckId}/words/{wordId}/answers` | `{ eventId, hit: boolean, localOrder: int≥0, recordedAtClient }` | `201` `DeckWord` **recalculado** (acierto: +1, a 3 → `learned`; fallo: 0, `pending`) | `404 DECK_WORD_NOT_FOUND` · `409` si `eventId` repetido con otro cuerpo | `features/study/useStudySession.ts` → `repos.progress.record` |

---

## 3. Endpoints P1 — completan el MVP

| # | Método y ruta | Request | Response (`data`) | Errores | Disparador | Backlog |
|---|---|---|---|---|---|---|
| R1 | `POST /decks/{deckId}/words/{wordId}/reactivation` | — | `DeckWord` (`consecutiveHits: 0`, `pending`); solo afecta a ese mazo | `404 DECK_WORD_NOT_FOUND` | `features/progress/ProgressPage.tsx` → `repos.progress.reactivate` | HU-11, EC-33, EC-34 |
| R2 | `GET /progress?deckId=&status=&cursor=&limit=` | `deckId` opcional | `{ counters: { pending, learned }, items: [{ deckId, wordId, consecutiveHits, status }], nextCursor }` | `404 DECK_NOT_FOUND` | `ProgressPage.tsx` (hoy Dexie) | HU-11, EC-32, EC-47 |
| R3 | `GET /preferences` | — | `Preference` (o valores por defecto si no existe) | `401` | `app/preferences.ts` (arranque en otro dispositivo) | HU-13, HU-14, EC-49 |
| R4 | `PATCH /preferences` | `{ theme?, backgroundPalette?, cardPalette?, imageSide? }` | `Preference` | `422 PREFERENCE_INVALID` (valor fuera de los presets) | `features/settings/SettingsPage.tsx` → `repos.preferences.update` | HU-13, HU-14, EC-35, EC-49 |
| R5 | `GET /words?q=` (variante de W1) | `q`: se normaliza (sin acentos/mayúsculas, trim) y busca en inglés y español | `{ items: Word[], nextCursor }` | — | `features/words/WordsPanel.tsx` (hoy filtro local `domain/search.ts`) | HU-15, EC-51, EC-52 |
| R6 | `GET /words/{id}/decks` | — | `{ items: { deckId, name }[] }` | `404 WORD_NOT_FOUND` | `features/words/WordDialogs.tsx` (diálogo de borrado: "está en N mazos") | EC-23 |
| R7 | `GET /me` | — | `{ id, email, createdAt }` | `401` | `app/context.tsx` (comprobar sesión al reconectar) | EC-02, EC-42 |
| R8 | `POST /auth/sessions/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken, expiresAt }` | `401 AUTH_REFRESH_INVALID` | capa HTTP (futura) | EC-42 |

## 4. Endpoints P2 — opcionales / no usados por el frontend actual

| # | Método y ruta | Detalle | Backlog |
|---|---|---|---|
| X1 | `POST /words/{id}/image-verifications` | Comprobación en servidor de que `imageUrl` carga como imagen. Hoy la hace el cliente (`lib/imageCheck.ts`, op `image.verify` solo local). Respuesta: `{ loads: boolean }` | EC-15, EC-16 |
| X2 | `GET /health` | Salud del servicio (sin auth) | — |

---

## 5. Catálogo de códigos de error

| `status` | `code` | Cuándo |
|---|---|---|
| 401 | `AUTH_REQUIRED` / `AUTH_LINK_INVALID` / `AUTH_REFRESH_INVALID` | Sin sesión / enlace no válido (EC-03) / refresh inválido |
| 404 | `WORD_NOT_FOUND` · `DECK_NOT_FOUND` · `DECK_WORD_NOT_FOUND` | Recurso inexistente |
| 409 | `DECK_WORD_DUPLICATE` · `DECK_NAME_TAKEN` · `WORD_ID_CONFLICT` · `EVENT_ID_CONFLICT` | Duplicados |
| 410 | `WORD_DELETED` · `DECK_DELETED` | El borrado prevalece (EC-41) |
| 422 | `EMAIL_INVALID` · `WORD_FIELD_REQUIRED` · `IMAGE_URL_INVALID` · `DECK_NAME_REQUIRED` · `DECK_NAME_TOO_LONG` · `PREFERENCE_INVALID` | Validación (con `errors[]`) |
| 429 | `AUTH_COOLDOWN` | Pedir enlace antes de 60 s (EC-50); cabecera `Retry-After` |
| 503 | `AUTH_SEND_FAILED` · `SERVICE_UNAVAILABLE` | Fallo de envío o servicio |

Mapeo con `AuthErrorCode` del cliente: `invalid` ← `AUTH_LINK_INVALID`; `cooldown` ← `AUTH_COOLDOWN`; `network` ← 5xx/timeout; `offline` lo decide el cliente sin llamar.

---

## 6. Cruce contra `backlog.md`

### 6.1 Historias

| Historia | Endpoint(s) | Nota |
|---|---|---|
| HU-01 Acceso | A1, A2, A3 | |
| HU-02 Ver/voltear | — (solo cliente) | Lee Words ya sincronizadas (S2) |
| HU-03 Acierto/fallo | P1 (vía `progress.record` en S1) | EC-06 (calificar antes de voltear) es solo UI |
| HU-04 Aprendida | P1 | Estado recalculado en servidor (3 consecutivos); independiente por mazo |
| HU-05 Sesión | M1, P1 | La cola y el orden aleatorio son del cliente (EC-46) |
| HU-06 Crear palabra | W2 | |
| HU-07 Gestionar mazos | D1–D4 | |
| HU-08 Asignar a mazos | M2, M3 | Duplicado: validación cliente + 409 REST |
| HU-09 Lista agrupada | — (cliente) | Agrupa con `domain/grouping.ts` sobre datos sincronizados |
| HU-10 Editar/borrar palabra | W3, W4, W5, R6 | |
| HU-11 Progreso/reactivar | R1, R2 | |
| HU-12 Offline y sync | S1, S2 | Núcleo del contrato |
| HU-13 Tema/paleta | R3, R4 | |
| HU-14 Lado de imagen | R3, R4 | Preferencia global |
| HU-15 Buscar | R5 (o local) | Hoy filtra en cliente (RF-28: debe funcionar offline) |
| HU-16 Transiciones | — | Sin endpoint |
| HU-17 Arrastrar/depositar | M2 (vía `deckWord.add`) | Animación es solo UI |

### 6.2 Edge cases

| EC | Endpoint / regla |
|---|---|
| EC-01 | A1 `422 EMAIL_INVALID` |
| EC-02 | A1/A2 (misma cuenta por email), R7 |
| EC-03, EC-50 | A2 `401 AUTH_LINK_INVALID`; A1 `429 AUTH_COOLDOWN` |
| EC-04, EC-05, EC-31 | Solo cliente (imagen caída/no cargada) |
| EC-06..12, EC-46 | P1 + cliente (cola de sesión) |
| EC-13 | W2/W4 `422 WORD_FIELD_REQUIRED` |
| EC-14, EC-15 | W2/W4 `422 IMAGE_URL_INVALID` (http/https); carga real: cliente o X1 |
| EC-16 | `imageVerified=false` en W2/W4; el cliente verifica y envía `word.update` al volver la red |
| EC-17, EC-18, EC-44 | M2 `409 DECK_WORD_DUPLICATE` (normalizado); otro mazo sí se permite |
| EC-19, EC-20, EC-24..27, EC-51, EC-52 | Solo cliente / R5 |
| EC-21, EC-22, EC-26 | D4 conserva palabras (cliente: diálogo de confirmación) |
| EC-23 | W5 + R6 |
| EC-28, EC-38, EC-39 | S1 regla 3 (servidor asigna tiempos, por campo) |
| EC-29 | Motor de reintentos del cliente (5, espera creciente); el servidor solo debe responder 5xx/timeouts de forma limpia |
| EC-30, EC-42, EC-55, EC-57 | Offline-first, sin endpoint |
| EC-32..34, EC-47 | R1, R2 |
| EC-35, EC-36 | Solo UI/tokens |
| EC-37 | S1 regla 1 |
| EC-40 | S1 regla 4 |
| EC-41 | S1 regla 5; `410` en REST; el cliente avisa (`SyncNotice`) |
| EC-43 | Solo cliente (`useLogout`, cuenta `outbox.unsynced()`); A3 después |
| EC-45 | W2 `duplicateEnglish: true` (aviso) |
| EC-48 | D2/D3 `422`/`409` |
| EC-49 | R3 |
| EC-53, EC-54, EC-56, EC-58, EC-59 | Solo UI; EC-59 apoyado en idempotencia de M2/S1 |

### 6.3 Resultado del cruce
- **Todos los criterios Gherkin tienen endpoint de soporte o están marcados como solo cliente.** No hay ninguna historia sin cobertura.
- **Fuera del backlog, sin criterio Gherkin**: locking (`POST`/`DELETE /flashcards/{id}/lock`) y auditoría (`GET /audit/{wordId}`) → **excluidos** por decisión del usuario.

---

## 7. Huecos y decisiones abiertas

| # | Hueco | Estado |
|---|---|---|
| H-01 | **Locking y auditoría**: no existen en frontend, `backlog.md` ni `specs.md`; "colaboración en tiempo real" está fuera de alcance (CLAUDE.md). Para incluirlos, primero hay que añadir RF y criterios Gherkin a `specs.md`/`backlog.md`. Propuesta si se retoman: lock por `Word` con TTL 5 min, renovable con `POST` repetido y `423 Locked` para otro dispositivo; `DELETE` libera. | **Excluido** (decisión del usuario, 2026-10-11) |
| H-02 | Los `GET` de lista (W1, D1, M1, R2) no son llamados por el frontend (lee Dexie). Se mantienen por completitud del backend y para la hidratación inicial. | Abierto |
| H-03 | El envelope `{data,error}` con RFC 7807: se asume el problem **dentro de `error`** y `Content-Type: application/problem+json`. | Asumido, confirmar |
| H-04 | La implementación real prevista es Supabase (ADR-001). Confirmar si el REST por recurso se implementa como Edge Functions/API propia o sobre PostgREST (cambiaría el formato de errores y paginación). | Abierto |
| H-05 | Autenticación: los nombres de ruta de A1–A3 difieren de la semántica de `AuthService` (verbos); si Supabase Auth gestiona el enlace mágico, A1–A3 pasan a ser un *proxy* o se omiten. | Abierto |
| H-06 | El contrato exige `Idempotency-Key` en REST; `push` ya es idempotente por `opId`. Confirmar si las rutas REST necesitan además deduplicar por recurso. | Abierto |

## 8. Cambios pendientes tras aprobar este contrato (no ejecutados)

Reorganizar carpetas: mover `frontend/` a `repo/frontend/` y crear `repo/backend/`. Revisar rutas relativas en `.github/workflows/ci.yml`, `frontend/vercel.json` y `.husky` antes de mover; `monorepo/` no se toca.
