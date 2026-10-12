// Servidor simulado para el modo `mock` (D-07). Hace lo que hará el backend real (RF-29): asigna marcas de
// tiempo, aplica idempotencia por `opId`, resuelve conflictos por campo, recalcula el progreso desde los
// eventos y deja que el borrado prevalezca. Su estado es JSON serializable y se guarda en un `Storage`.
import {
  applyAnswer,
  reactivate,
  type Deck,
  type DeckWord,
  type OpBody,
  type Preference,
  type Word,
} from '../../../domain'
import { DEFAULT_IMAGE_SIDE } from '../../../domain'
import { emptyChanges, type Changes, type PushOp, type PushResponse } from '../contract'

interface Versioned<T> {
  v: number
  data: T
}

interface ServerEvent {
  deckId: string
  wordId: string
  /** `true`/`false` = respuesta; `'reactivate'` = reinicio del par. */
  kind: boolean | 'reactivate'
  receivedAt: number
  localOrder: number
}

interface UserState {
  version: number
  words: Record<string, Versioned<Word>>
  decks: Record<string, Versioned<Deck>>
  deckWords: Record<string, Versioned<DeckWord>>
  preference: Versioned<Preference> | null
  tombstones: {
    words: Record<string, number>
    decks: Record<string, number>
    deckWords: Record<string, { deckId: string; wordId: string; v: number }>
  }
  events: ServerEvent[]
  /** `opId` ya aplicados (idempotencia). */
  applied: Record<string, 'applied' | 'discarded'>
  lastClock: number
}

type Store = Pick<Storage, 'getItem' | 'setItem'>

export const MOCK_SERVER_KEY = 'mf:mock-server'
const pairKey = (deckId: string, wordId: string) => `${deckId}:${wordId}`

const newUser = (): UserState => ({
  version: 0,
  words: {},
  decks: {},
  deckWords: {},
  preference: null,
  tombstones: { words: {}, decks: {}, deckWords: {} },
  events: [],
  applied: {},
  lastClock: 0,
})

export class MockServer {
  private users: Record<string, UserState>

  constructor(
    private readonly store: Store,
    private readonly clock: () => number = Date.now,
  ) {
    this.users = this.load()
  }

  private load(): Record<string, UserState> {
    try {
      return JSON.parse(this.store.getItem(MOCK_SERVER_KEY) ?? '{}') as Record<string, UserState>
    } catch {
      return {}
    }
  }

  private save() {
    try {
      this.store.setItem(MOCK_SERVER_KEY, JSON.stringify(this.users))
    } catch {
      // Sin almacenamiento el servidor simulado sigue funcionando en memoria.
    }
  }

  private user(userId: string): UserState {
    // Recarga por si otra pestaña u otra instancia modificó el almacén.
    this.users = this.load()
    return (this.users[userId] ??= newUser())
  }

  /** Reloj del servidor, estrictamente creciente. */
  private now(u: UserState): number {
    u.lastClock = Math.max(this.clock(), u.lastClock + 1)
    return u.lastClock
  }

  // ----- API -----

  push(userId: string, ops: PushOp[]): PushResponse {
    const u = this.user(userId)
    const startVersion = u.version
    const results: PushResponse['results'] = []
    for (const { opId, op } of ops) {
      const previous = u.applied[opId]
      if (previous) {
        results.push({
          opId,
          outcome: previous === 'discarded' ? 'discarded' : 'alreadyApplied',
          ...(previous === 'discarded' ? { reason: 'deleted' as const } : {}),
        })
        continue
      }
      const outcome = this.apply(u, userId, op)
      u.applied[opId] = outcome
      results.push({
        opId,
        outcome,
        ...(outcome === 'discarded' ? { reason: 'deleted' as const } : {}),
      })
    }
    this.save()
    return { results, changes: this.changesSince(u, startVersion) }
  }

  pull(userId: string, cursor: number): Changes {
    return this.changesSince(this.user(userId), cursor)
  }

  /** Foto del estado de un usuario (para pruebas). */
  snapshot(userId: string) {
    const u = this.user(userId)
    return {
      words: Object.values(u.words).map((x) => x.data),
      decks: Object.values(u.decks).map((x) => x.data),
      deckWords: Object.values(u.deckWords).map((x) => x.data),
      events: u.events.length,
    }
  }

  // ----- Cambios -----

  private changesSince(u: UserState, cursor: number): Changes {
    const since = <T>(rec: Record<string, Versioned<T>>) =>
      Object.values(rec)
        .filter((x) => x.v > cursor)
        .map((x) => x.data)
    return {
      ...emptyChanges(u.version),
      words: since(u.words),
      decks: since(u.decks),
      deckWords: since(u.deckWords),
      preference: u.preference && u.preference.v > cursor ? u.preference.data : null,
      deleted: {
        words: Object.entries(u.tombstones.words)
          .filter(([, v]) => v > cursor)
          .map(([k]) => k),
        decks: Object.entries(u.tombstones.decks)
          .filter(([, v]) => v > cursor)
          .map(([k]) => k),
        deckWords: Object.values(u.tombstones.deckWords)
          .filter((t) => t.v > cursor)
          .map(({ deckId, wordId }) => ({ deckId, wordId })),
      },
    }
  }

  // ----- Operaciones -----

  private apply(u: UserState, userId: string, op: OpBody): 'applied' | 'discarded' {
    const bump = () => ++u.version

    switch (op.type) {
      case 'word.create': {
        const p = op.payload
        if (u.tombstones.words[p.id]) return 'discarded'
        if (u.words[p.id]) return 'applied'
        const t = this.now(u)
        u.words[p.id] = {
          v: bump(),
          data: {
            id: p.id,
            userId,
            english: p.english,
            normalizedEnglish: p.normalizedEnglish,
            spanish: p.spanish,
            imageUrl: p.imageUrl,
            imageVerified: p.imageVerified,
            example: p.example,
            note: p.note,
            englishUpdatedAt: t,
            spanishUpdatedAt: t,
            imageUpdatedAt: t,
            exampleUpdatedAt: t,
            noteUpdatedAt: t,
          },
        }
        return 'applied'
      }
      case 'word.update': {
        const current = u.words[op.payload.id]
        if (!current) return 'discarded'
        const patch = op.payload.patch
        const t = this.now(u)
        const next: Word = { ...current.data }
        if (patch.english !== undefined) {
          next.english = patch.english
          next.normalizedEnglish = patch.normalizedEnglish ?? next.normalizedEnglish
          next.englishUpdatedAt = t
        }
        if (patch.spanish !== undefined) {
          next.spanish = patch.spanish
          next.spanishUpdatedAt = t
        }
        if (patch.imageUrl !== undefined || patch.imageVerified !== undefined) {
          if (patch.imageUrl !== undefined) next.imageUrl = patch.imageUrl ?? undefined
          if (patch.imageVerified !== undefined) next.imageVerified = patch.imageVerified
          next.imageUpdatedAt = t
        }
        if (patch.example !== undefined) {
          next.example = patch.example ?? undefined
          next.exampleUpdatedAt = t
        }
        if (patch.note !== undefined) {
          next.note = patch.note ?? undefined
          next.noteUpdatedAt = t
        }
        u.words[op.payload.id] = { v: bump(), data: next }
        return 'applied'
      }
      case 'word.delete': {
        const id = op.payload.id
        if (u.tombstones.words[id]) return 'applied'
        delete u.words[id]
        for (const k of Object.keys(u.deckWords)) {
          if (u.deckWords[k].data.wordId === id) this.dropPair(u, u.deckWords[k].data, bump)
        }
        u.tombstones.words[id] = bump()
        return 'applied'
      }
      case 'deck.create': {
        const p = op.payload
        if (u.tombstones.decks[p.id]) return 'discarded'
        if (u.decks[p.id]) return 'applied'
        u.decks[p.id] = {
          v: bump(),
          data: {
            id: p.id,
            userId,
            name: p.name,
            normalizedName: p.normalizedName,
            updatedAt: this.now(u),
          },
        }
        return 'applied'
      }
      case 'deck.rename': {
        const current = u.decks[op.payload.id]
        if (!current) return 'discarded'
        u.decks[op.payload.id] = {
          v: bump(),
          data: {
            ...current.data,
            name: op.payload.name,
            normalizedName: op.payload.normalizedName,
            updatedAt: this.now(u),
          },
        }
        return 'applied'
      }
      case 'deck.delete': {
        const id = op.payload.id
        if (u.tombstones.decks[id]) return 'applied'
        delete u.decks[id]
        for (const k of Object.keys(u.deckWords)) {
          if (u.deckWords[k].data.deckId === id) this.dropPair(u, u.deckWords[k].data, bump)
        }
        u.tombstones.decks[id] = bump()
        return 'applied'
      }
      case 'deckWord.add': {
        const { deckId, wordId } = op.payload
        if (!u.decks[deckId] || !u.words[wordId]) return 'discarded'
        const key = pairKey(deckId, wordId)
        if (!u.deckWords[key]) {
          u.deckWords[key] = {
            v: bump(),
            data: { deckId, wordId, consecutiveHits: 0, status: 'pending' },
          }
        }
        return 'applied'
      }
      case 'deckWord.remove': {
        const { deckId, wordId } = op.payload
        const entry = u.deckWords[pairKey(deckId, wordId)]
        if (entry) this.dropPair(u, entry.data, bump)
        return 'applied'
      }
      case 'progress.record': {
        const p = op.payload
        if (!u.deckWords[pairKey(p.deckId, p.wordId)]) return 'discarded'
        u.events.push({
          deckId: p.deckId,
          wordId: p.wordId,
          kind: p.hit,
          receivedAt: this.now(u),
          localOrder: p.localOrder,
        })
        this.recompute(u, p.deckId, p.wordId, bump)
        return 'applied'
      }
      case 'progress.reactivate': {
        const p = op.payload
        if (!u.deckWords[pairKey(p.deckId, p.wordId)]) return 'discarded'
        u.events.push({
          deckId: p.deckId,
          wordId: p.wordId,
          kind: 'reactivate',
          receivedAt: this.now(u),
          localOrder: 0,
        })
        this.recompute(u, p.deckId, p.wordId, bump)
        return 'applied'
      }
      case 'preference.update': {
        const current = u.preference?.data ?? {
          userId,
          theme: 'white' as const,
          backgroundPalette: 'neutral' as const,
          cardPalette: 'neutral' as const,
          imageSide: DEFAULT_IMAGE_SIDE,
          updatedAt: 0,
        }
        u.preference = {
          v: bump(),
          data: { ...current, ...op.payload.patch, updatedAt: this.now(u) },
        }
        return 'applied'
      }
      case 'image.verify':
        // Tarea solo local; si llegara, se confirma sin efecto.
        return 'applied'
    }
  }

  /** Elimina una pertenencia con su historial y deja la lápida. */
  private dropPair(u: UserState, pair: DeckWord, bump: () => number) {
    const key = pairKey(pair.deckId, pair.wordId)
    delete u.deckWords[key]
    u.events = u.events.filter((e) => !(e.deckId === pair.deckId && e.wordId === pair.wordId))
    u.tombstones.deckWords[key] = { deckId: pair.deckId, wordId: pair.wordId, v: bump() }
  }

  /** RF-29: contador y estado = resultado de reproducir los eventos del par en orden de recepción. */
  private recompute(u: UserState, deckId: string, wordId: string, bump: () => number) {
    const key = pairKey(deckId, wordId)
    const events = u.events
      .filter((e) => e.deckId === deckId && e.wordId === wordId)
      .sort((a, b) => a.receivedAt - b.receivedAt || a.localOrder - b.localOrder)
    let state: Pick<DeckWord, 'consecutiveHits' | 'status'> = {
      consecutiveHits: 0,
      status: 'pending',
    }
    for (const e of events)
      state = e.kind === 'reactivate' ? reactivate() : applyAnswer(state, e.kind)
    u.deckWords[key] = { v: bump(), data: { deckId, wordId, ...state } }
  }
}
