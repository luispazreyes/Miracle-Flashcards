// Utilidad de pruebas: repositorios sobre una base Dexie nueva (fake-indexeddb) por prueba.
import { openDb, deleteDb } from '../data/db/db'
import { createRepositories, type RepositoryOptions } from '../data/repositories'

let counter = 0

export async function makeRepos(options: RepositoryOptions = {}) {
  const userId = `user-${++counter}-${Math.random().toString(36).slice(2)}`
  const db = openDb(userId)
  await db.open()
  let t = 1_700_000_000_000
  const repos = createRepositories(db, userId, { now: () => ++t, ...options })
  return {
    db,
    userId,
    repos,
    async cleanup() {
      db.close()
      await deleteDb(userId)
    },
  }
}

export const word = (english: string, spanish = `${english}-es`) => ({ english, spanish })
