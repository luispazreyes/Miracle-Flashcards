// Contrato entre el cliente y el backend (frontend-specs.md §5.1). Este archivo es el REQUISITO para la fase
// SQL/Supabase: cualquier implementación de `SyncRemote` debe cumplirlo (RF-22, RF-29).
//
// Reglas del servidor:
//  - `push` es idempotente por `opId`: reenviar una operación ya aplicada devuelve `alreadyApplied` (EC-37).
//  - Las ediciones de palabra son parches por campo; el servidor asigna `*UpdatedAt` por campo y gana el más
//    reciente por campo (EC-39).
//  - El progreso se recalcula en el servidor a partir de los eventos de todos los dispositivos (EC-40).
//  - El borrado prevalece: una operación sobre algo ya eliminado se descarta (`discarded`) (EC-41).
//  - `pull(cursor)` devuelve los cambios con versión > cursor y las eliminaciones (lápidas).
import { z } from 'zod'
import {
  deckSchema,
  deckWordSchema,
  opBodySchema,
  preferenceSchema,
  wordSchema,
} from '../../domain'

const id = z.string().min(1)

export const pushOpSchema = z.object({
  opId: id,
  createdAt: z.number().int().nonnegative(),
  op: opBodySchema,
})

export const pushRequestSchema = z.object({ ops: z.array(pushOpSchema) })

export const changesSchema = z.object({
  words: z.array(wordSchema),
  decks: z.array(deckSchema),
  /** Estado definitivo (contador y estado) de cada pertenencia modificada. */
  deckWords: z.array(deckWordSchema),
  preference: preferenceSchema.nullable(),
  /** Lápidas: entidades eliminadas (el borrado prevalece). */
  deleted: z.object({
    words: z.array(id),
    decks: z.array(id),
    deckWords: z.array(z.object({ deckId: id, wordId: id })),
  }),
  /** Versión del servidor tras estos cambios; el cliente la guarda como cursor del siguiente `pull`. */
  cursor: z.number().int().nonnegative(),
})

export const pushResponseSchema = z.object({
  results: z.array(
    z.object({
      opId: id,
      outcome: z.enum(['applied', 'alreadyApplied', 'discarded']),
      reason: z.literal('deleted').optional(),
    }),
  ),
  changes: changesSchema,
})

export const pullResponseSchema = changesSchema

export type PushOp = z.infer<typeof pushOpSchema>
export type PushRequest = z.infer<typeof pushRequestSchema>
export type PushResponse = z.infer<typeof pushResponseSchema>
export type PullResponse = z.infer<typeof pullResponseSchema>
export type Changes = z.infer<typeof changesSchema>

/** Frontera con el backend de datos. Implementaciones: `MockSyncRemote` y, más adelante, la de Supabase. */
export interface SyncRemote {
  push(request: PushRequest): Promise<PushResponse>
  pull(cursor: number): Promise<PullResponse>
}

export const emptyChanges = (cursor = 0): Changes => ({
  words: [],
  decks: [],
  deckWords: [],
  preference: null,
  deleted: { words: [], decks: [], deckWords: [] },
  cursor,
})
