import type { OutboxOp } from '../../domain'
import type { RepoDeps } from './context'

/** Cola de salida (RF-21, RF-22). Las lecturas y los cambios de estado los usa el motor de sincronización. */
export function createOutboxRepository(deps: Pick<RepoDeps, 'db'>) {
  const { db } = deps

  return {
    /** Operaciones por enviar, en orden de `seq`. `failed` se reintenta solo de forma manual. */
    pending: () => db.outbox.where('status').anyOf('pending', 'inflight').sortBy('seq'),
    all: () => db.outbox.orderBy('seq').toArray(),
    /** Operaciones sin sincronizar (pendientes, en vuelo o fallidas); no cuenta las comprobaciones locales de imagen. */
    unsynced: () => db.outbox.where('type').notEqual('image.verify').count(),
    update: (seq: number, changes: Partial<Pick<OutboxOp, 'status' | 'attempts'>>) =>
      db.outbox.update(seq, changes),
    /** Marca todas las fallidas como pendientes (reintento manual). */
    async requeueFailed(): Promise<void> {
      await db.outbox.where('status').equals('failed').modify({ status: 'pending', attempts: 0 })
    },
    /** Vuelve a pendiente lo que quedó "en vuelo" (p. ej. si se cerró la app a mitad de envío). */
    async requeueInflight(): Promise<void> {
      await db.outbox.where('status').equals('inflight').modify({ status: 'pending' })
    },
    removeMany: (seqs: number[]) => db.outbox.bulkDelete(seqs),
  }
}

export type OutboxRepository = ReturnType<typeof createOutboxRepository>
