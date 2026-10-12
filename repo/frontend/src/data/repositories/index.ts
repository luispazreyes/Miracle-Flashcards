import type { AppDb } from '../db/db'
import type { RepoDeps } from './context'
import { createDeckRepository } from './decks'
import { createDeckWordRepository } from './deckWords'
import { createOutboxRepository } from './outbox'
import { createPreferenceRepository } from './preferences'
import { createProgressRepository } from './progress'
import { createWordRepository } from './words'

export { RepoError, type RepoErrorCode } from './context'
export type { WordInput } from './words'

export interface RepositoryOptions {
  now?: () => number
  newId?: () => string
  onWrite?: () => void
}

export function createRepositories(db: AppDb, userId: string, options: RepositoryOptions = {}) {
  const deps: RepoDeps = {
    db,
    userId,
    now: options.now ?? Date.now,
    newId: options.newId ?? (() => crypto.randomUUID()),
    onWrite: options.onWrite,
  }
  return {
    words: createWordRepository(deps),
    decks: createDeckRepository(deps),
    deckWords: createDeckWordRepository(deps),
    progress: createProgressRepository(deps),
    preferences: createPreferenceRepository(deps),
    outbox: createOutboxRepository(deps),
  }
}

export type Repositories = ReturnType<typeof createRepositories>
