// Reglas de estudio (BR-03, BR-04, BR-05, BR-09). Funciones puras; la aleatoriedad se inyecta.
import { LEARNED_THRESHOLD } from './constants'
import type { DeckWord } from './schemas'

/** Generador en [0, 1), p. ej. Math.random. Inyectable para pruebas deterministas. */
export type Random = () => number

type Progress = Pick<DeckWord, 'consecutiveHits' | 'status'>

/** BR-03/BR-04: acierto suma 1 (a 3 pasa a aprendida); fallo reinicia y sigue pendiente. */
export function applyAnswer(current: Progress, hit: boolean): Progress {
  if (!hit) return { consecutiveHits: 0, status: 'pending' }
  const consecutiveHits = Math.min(current.consecutiveHits + 1, LEARNED_THRESHOLD)
  return {
    consecutiveHits,
    status: consecutiveHits >= LEARNED_THRESHOLD ? 'learned' : 'pending',
  }
}

/** BR-09: reactivar deja la palabra pendiente con el contador en 0. */
export function reactivate(): Progress {
  return { consecutiveHits: 0, status: 'pending' }
}

/** Fisher-Yates sin mutar la entrada. */
export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Pasada barajada de pendientes (BR-05). Con ≥ 2 pendientes la primera nunca es la última mostrada.
 */
export function buildPass(pending: readonly string[], lastShown: string | null, random: Random) {
  const pass = shuffle(pending, random)
  if (pass.length >= 2 && pass[0] === lastShown) {
    const j = 1 + Math.floor(random() * (pass.length - 1))
    ;[pass[0], pass[j]] = [pass[j], pass[0]]
  }
  return pass
}

export interface StudyQueue {
  /** Tarjetas que faltan por mostrar en la pasada actual. */
  pass: readonly string[]
  lastShown: string | null
}

export const emptyQueue: StudyQueue = { pass: [], lastShown: null }

/**
 * Siguiente tarjeta (BR-05, RF-13, RF-31). Cada tarjeta aparece una vez por pasada; las que dejaron de estar
 * pendientes se descartan; al terminar la pasada se recalculan las pendientes y se baraja de nuevo.
 * Devuelve `card: null` cuando no queda ninguna pendiente.
 */
export function nextCard(
  queue: StudyQueue,
  pending: readonly string[],
  random: Random,
): { card: string | null; queue: StudyQueue } {
  const pendingSet = new Set(pending)
  let pass = queue.pass.filter((id) => pendingSet.has(id))
  if (pass.length === 0) pass = buildPass(pending, queue.lastShown, random)
  if (pass.length === 0) return { card: null, queue: { pass: [], lastShown: queue.lastShown } }
  const [card, ...rest] = pass
  return { card, queue: { pass: rest, lastShown: card } }
}
