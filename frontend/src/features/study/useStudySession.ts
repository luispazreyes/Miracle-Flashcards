// Máquina de estados de la sesión de estudio (F-05, F-06; BR-01..BR-10). Las reglas viven en domain/study; aquí
// solo se orquesta: cargar, mostrar la tarjeta, voltear, responder (sin bloquear la UI) y terminar.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRepos, useServices } from '../../app/context'
import { useDeckWords } from '../../app/queries'
import { useToast } from '../../components/Toast'
import { RepoError } from '../../data/repositories'
import {
  applyAnswer,
  emptyQueue,
  nextCard,
  type DeckWord,
  type StudyQueue,
  type Word,
} from '../../domain'
import { study as t } from '../../lib/messages.es'

export type EndReason = 'completed' | 'noPending' | 'noWords'

export interface LastResult {
  hit: boolean
  learned: boolean
  english: string
}

interface Loaded {
  deckName: string
  words: Map<string, Word>
  entries: Map<string, DeckWord>
}

export type StudyView =
  | { phase: 'loading' }
  | { phase: 'error'; retry: () => void }
  | { phase: 'end'; reason: EndReason; deckName: string; hits: number; misses: number }
  | {
      phase: 'front' | 'back'
      deckName: string
      word: Word
      entry: DeckWord
      pendingCount: number
      last: LastResult | null
    }

export function useStudySession(deckId: string) {
  const repos = useRepos()
  const { random } = useServices()
  const { notify } = useToast()

  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [queue, setQueue] = useState<StudyQueue>(emptyQueue)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ hits: 0, misses: 0 })
  const [endReason, setEndReason] = useState<EndReason | null>(null)
  const [last, setLast] = useState<LastResult | null>(null)
  // NEC-14: si una palabra deja de estar en el mazo durante la sesión (borrada o quitada, aquí o en otro
  // dispositivo), se omite sin error.
  const live = useDeckWords()
  const liveIds = useMemo(
    () =>
      live.status === 'ready'
        ? new Set(live.data.filter((d) => d.deckId === deckId).map((d) => d.wordId))
        : null,
    [live, deckId],
  )
  /** Las escrituras van en cadena para conservar el orden, sin bloquear la respuesta siguiente (EC-53). */
  const writes = useRef<Promise<unknown>>(Promise.resolve())

  useEffect(() => {
    let cancelled = false
    repos.deckWords
      .studySet(deckId)
      .then((set) => {
        if (cancelled) return
        if (!set) {
          setFailed(true)
          return
        }
        const words = new Map(set.words.map((w) => [w.id, w]))
        const entries = new Map(set.entries.map((e) => [e.wordId, e]))
        const pending = set.entries.filter((e) => e.status === 'pending').map((e) => e.wordId)
        setLoaded({ deckName: set.deck.name, words, entries })
        // BR-07: no se inicia una sesión vacía.
        if (set.words.length === 0) setEndReason('noWords')
        else if (pending.length === 0) setEndReason('noPending')
        else {
          const first = nextCard(emptyQueue, pending, random)
          setQueue(first.queue)
          setCurrentId(first.card)
        }
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [repos, deckId, random, attempt])

  if (loaded && liveIds && !endReason) {
    const gone = [...loaded.entries.keys()].filter((id) => !liveIds.has(id))
    if (gone.length > 0) {
      const entries = new Map(loaded.entries)
      gone.forEach((id) => entries.delete(id))
      setLoaded({ ...loaded, entries })
      if (currentId && gone.includes(currentId)) {
        const pending = [...entries.values()]
          .filter((e) => e.status === 'pending')
          .map((e) => e.wordId)
        const next = nextCard(queue, pending, random)
        if (next.card === null) {
          setEndReason(entries.size === 0 ? 'noWords' : 'completed')
          setCurrentId(null)
        } else {
          setQueue(next.queue)
          setCurrentId(next.card)
          setFlipped(false)
        }
      }
    }
  }

  const flip = useCallback(() => setFlipped(true), [])

  const answer = useCallback(
    (hit: boolean) => {
      // BR-02: antes de voltear no se registra nada.
      if (!flipped || !loaded || !currentId) return
      const entry = loaded.entries.get(currentId)
      const word = loaded.words.get(currentId)
      if (!entry || !word) return

      const updated: DeckWord = { ...entry, ...applyAnswer(entry, hit) }
      const entries = new Map(loaded.entries).set(currentId, updated)
      setLoaded({ ...loaded, entries })
      setStats((s) => ({ hits: s.hits + (hit ? 1 : 0), misses: s.misses + (hit ? 0 : 1) }))
      setLast({ hit, learned: updated.status === 'learned', english: word.english })

      // BR-08: se guarda al instante en el dispositivo, sin esperar a la red ni a la escritura anterior.
      writes.current = writes.current
        .then(() => repos.progress.record(deckId, currentId, hit))
        .catch((e: unknown) => {
          // La palabra ya no está en el mazo (NEC-14): no hay nada que guardar ni que avisar.
          if (!(e instanceof RepoError && e.code === 'not-found')) notify(t.writeError, 'error')
        })

      const pending = [...entries.values()]
        .filter((e) => e.status === 'pending')
        .map((e) => e.wordId)
      const next = nextCard(queue, pending, random)
      if (next.card === null) {
        setEndReason('completed')
        setCurrentId(null)
      } else {
        setQueue(next.queue)
        setCurrentId(next.card)
        setFlipped(false)
      }
    },
    [flipped, loaded, currentId, queue, random, repos, deckId, notify],
  )

  let view: StudyView
  if (failed) {
    view = {
      phase: 'error',
      retry: () => {
        setFailed(false)
        setLoaded(null)
        setAttempt((n) => n + 1)
      },
    }
  } else if (!loaded) view = { phase: 'loading' }
  else if (endReason)
    view = { phase: 'end', reason: endReason, deckName: loaded.deckName, ...stats }
  else {
    const word = currentId ? loaded.words.get(currentId) : undefined
    const entry = currentId ? loaded.entries.get(currentId) : undefined
    view =
      word && entry
        ? {
            phase: flipped ? 'back' : 'front',
            deckName: loaded.deckName,
            word,
            entry,
            pendingCount: [...loaded.entries.values()].filter((e) => e.status === 'pending').length,
            last,
          }
        : { phase: 'loading' }
  }

  return { view, flip, answer }
}
