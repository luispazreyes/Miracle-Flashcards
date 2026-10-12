// Arrastrar una palabra a un mazo y depositarla (RF-18, RF-45; BR-27 a BR-30). El proveedor une el controlador de
// Pointer Events (lib/drag), el repositorio y las animaciones: la ficha sigue al puntero, el mazo bajo ella se
// resalta, al soltar entra en el mazo (o vuelve a su sitio) y el mazo "pulsa".
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useToast } from '../components/Toast'
import { RepoError } from '../data/repositories'
import type { Word } from '../domain'
import { startPointerDrag, type DragEnd, type Point } from '../lib/drag/pointerDrag'
import { common, drag as t, messages, words as wt } from '../lib/messages.es'
import { durationMs, flyChip } from '../lib/motion'
import { useRepos } from './context'

interface DragUi {
  /** Palabra que se está arrastrando y mazo bajo el puntero. */
  dragging: { wordId: string; english: string; hoverDeckId: string | null } | null
  /** Reacción de depósito: el mazo y la fila pulsan (también al agregar con el menú, BR-29). */
  pulse: { deckId: string; wordId: string; nonce: number } | null
}

interface DragActions {
  begin: (word: Word, event: React.PointerEvent<HTMLElement>) => void
  /** Versión breve del depósito para el menú "Agregar a mazo" (BR-29). */
  deposit: (deckId: string, wordId: string) => void
}

const UiContext = createContext<DragUi>({ dragging: null, pulse: null })
const ActionsContext = createContext<DragActions | null>(null)

export const useDragUi = () => useContext(UiContext)
export function useDragActions(): DragActions {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useDragActions requiere <DragProvider>')
  return ctx
}

const centerOf = (el: Element): Point => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export function DragProvider({ children }: { children: ReactNode }) {
  const repos = useRepos()
  const { notify } = useToast()
  const [dragging, setDragging] = useState<DragUi['dragging']>(null)
  const [pulse, setPulse] = useState<DragUi['pulse']>(null)
  const [layerWord, setLayerWord] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const chip = useRef<HTMLDivElement | null>(null)
  const position = useRef<Point>({ x: 0, y: 0 })
  const session = useRef(0)
  const stop = useRef<(() => void) | null>(null)
  const pulseNonce = useRef(0)

  useEffect(() => () => stop.current?.(), [])

  const deposit = useCallback((deckId: string, wordId: string) => {
    // Con movimiento reducido el cambio es instantáneo: no se dibuja el pulso (el aviso accesible sí se emite).
    if (durationMs('--mov-deposito') === 0) return
    const nonce = ++pulseNonce.current
    setPulse({ deckId, wordId, nonce })
    setTimeout(() => setPulse((p) => (p?.nonce === nonce ? null : p)), durationMs('--mov-deposito'))
  }, [])

  const moveChip = (p: Point) => {
    position.current = p
    if (chip.current) chip.current.style.transform = `translate(${p.x}px, ${p.y}px)`
  }

  const begin = useCallback(
    (word: Word, event: React.PointerEvent<HTMLElement>) => {
      stop.current?.()
      const id = ++session.current
      const row = event.currentTarget.closest('[data-word-id]')
      const home = row ? centerOf(row) : { x: event.clientX, y: event.clientY }

      const fly = async (to: Point, token: '--mov-deposito' | '--mov-medio', shrink: boolean) => {
        if (chip.current) await flyChip(chip.current, position.current, to, { token, shrink })
      }
      const cleanup = () => {
        if (session.current !== id) return // otro arrastre ya tomó el relevo
        setLayerWord(null)
        setDragging(null)
      }

      const finishDrop = async (deckId: string, point: Point) => {
        const deckEl = document.querySelector(`[data-deck-id="${deckId}"]`)
        try {
          await repos.deckWords.add(deckId, word.id)
          const deck = await repos.decks.get(deckId)
          position.current = point
          if (deckEl) await fly(centerOf(deckEl), '--mov-deposito', true)
          deposit(deckId, word.id)
          notify(wt.added(word.english, deck?.name ?? ''))
        } catch (e) {
          // BR-28: duplicado o error → la palabra vuelve a su sitio y se avisa.
          await fly(home, '--mov-medio', false)
          if (e instanceof RepoError && e.code === 'duplicate-in-deck')
            notify(messages.alreadyInDeck(word.english), 'warning')
          else notify(common.genericError, 'error')
        }
      }

      const down = event.nativeEvent
      stop.current = startPointerDrag(
        {
          pointerId: down.pointerId,
          clientX: down.clientX,
          clientY: down.clientY,
          button: down.button,
          currentTarget: event.currentTarget,
        },
        {
          onStart: (p) => {
            moveChip(p)
            setLayerWord(word.english)
            setDragging({ wordId: word.id, english: word.english, hoverDeckId: null })
            setAnnouncement(t.dragging(word.english))
          },
          onMove: (p, targetId) => {
            moveChip(p)
            setDragging((d) =>
              d && d.hoverDeckId !== targetId ? { ...d, hoverDeckId: targetId } : d,
            )
          },
          onEnd: (end: DragEnd) => {
            void (async () => {
              if (end.type === 'drop') await finishDrop(end.targetId, end.point)
              else {
                // Soltar fuera, Esc o interrupción: vuelve animada y no cambia de mazo (BR-28).
                position.current = end.point
                await fly(home, '--mov-medio', false)
                setAnnouncement(t.cancelled(word.english))
              }
              cleanup()
            })()
          },
        },
        {},
      )
    },
    [repos, notify, deposit],
  )

  const actions = useMemo(() => ({ begin, deposit }), [begin, deposit])
  const ui = useMemo(() => ({ dragging, pulse }), [dragging, pulse])

  return (
    <ActionsContext.Provider value={actions}>
      <UiContext.Provider value={ui}>
        {children}
        <p role="status" className="sr-only">
          {announcement}
        </p>
        {layerWord !== null &&
          createPortal(
            <div
              ref={(el) => {
                chip.current = el
                if (el)
                  el.style.transform = `translate(${position.current.x}px, ${position.current.y}px)`
              }}
              data-drag-chip
              aria-hidden="true"
              className="pointer-events-none fixed top-0 left-0 z-40"
            >
              <span className="inline-flex -translate-x-1/2 -translate-y-1/2 scale-(--mov-escala-elevada) items-center gap-2 rounded-md border-2 border-primario bg-superficie px-3 py-2 font-semibold shadow-3">
                {layerWord}
              </span>
            </div>,
            document.body,
          )}
      </UiContext.Provider>
    </ActionsContext.Provider>
  )
}
