// Arrastre propio con Pointer Events (frontend-specs.md §6.6, D-06; RF-18, RF-45; BR-27, BR-28). Sin librería:
// captura del puntero, umbral de inicio, detección del destino bajo el puntero y cancelación con Escape.
// El que llama debe poner `touch-action: none` en el asa para que el dedo arrastre en vez de desplazar.

export interface Point {
  x: number
  y: number
}

export type DragEnd =
  | { type: 'drop'; targetId: string; point: Point }
  /** `outside`: soltó fuera de un destino; `escape`: tecla Esc; `interrupted`: pointercancel. */
  | { type: 'cancel'; reason: 'outside' | 'escape' | 'interrupted'; point: Point }

export interface DragCallbacks {
  /** Se pasó el umbral: empieza el arrastre. */
  onStart: (point: Point) => void
  onMove: (point: Point, targetId: string | null) => void
  onEnd: (end: DragEnd) => void
}

export interface DragOptions {
  /** Distancia mínima (px) antes de considerar que se arrastra; evita arrastres por un toque. */
  threshold?: number
  /** Busca el id del destino bajo el punto. Por defecto, el `data-deck-id` más cercano (elementsFromPoint). */
  hitTest?: (point: Point) => string | null
  /** Documento y ventana donde escuchar (pruebas). */
  target?: Pick<Window, 'addEventListener' | 'removeEventListener'>
}

export const DRAG_THRESHOLD_PX = 6

/** Destino por defecto: el elemento con `data-deck-id` bajo el puntero. */
export function deckUnderPoint({ x, y }: Point): string | null {
  if (typeof document.elementsFromPoint !== 'function') return null
  for (const el of document.elementsFromPoint(x, y)) {
    const target = (el as HTMLElement).closest?.('[data-deck-id]')
    if (target) return (target as HTMLElement).dataset.deckId ?? null
  }
  return null
}

/**
 * Empieza a seguir un arrastre desde un `pointerdown`. Devuelve la función que lo termina sin avisar
 * (limpieza al desmontar). Solo se activa con el botón principal.
 */
export function startPointerDrag(
  down: Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY' | 'button'> & {
    currentTarget?: EventTarget | null
  },
  callbacks: DragCallbacks,
  options: DragOptions = {},
): () => void {
  const { threshold = DRAG_THRESHOLD_PX, hitTest = deckUnderPoint } = options
  const target = options.target ?? window
  if (down.button !== 0) return () => {}

  const origin = { x: down.clientX, y: down.clientY }
  const capture = down.currentTarget as Element | null | undefined
  let dragging = false
  let done = false
  let last: Point = origin

  try {
    capture?.setPointerCapture?.(down.pointerId)
  } catch {
    // Puntero ya liberado: el arrastre seguirá con los eventos de la ventana.
  }

  const point = (e: PointerEvent): Point => ({ x: e.clientX, y: e.clientY })

  const finish = (end?: DragEnd) => {
    if (done) return
    done = true
    target.removeEventListener('pointermove', onMove as EventListener)
    target.removeEventListener('pointerup', onUp as EventListener)
    target.removeEventListener('pointercancel', onCancel as EventListener)
    target.removeEventListener('keydown', onKey as EventListener)
    try {
      capture?.releasePointerCapture?.(down.pointerId)
    } catch {
      // Nada que liberar.
    }
    if (end && dragging) callbacks.onEnd(end)
  }

  function onMove(e: PointerEvent) {
    if (e.pointerId !== down.pointerId) return
    const p = point(e)
    last = p
    if (!dragging) {
      if (Math.hypot(p.x - origin.x, p.y - origin.y) < threshold) return
      dragging = true
      callbacks.onStart(p)
    }
    callbacks.onMove(p, hitTest(p))
  }

  function onUp(e: PointerEvent) {
    if (e.pointerId !== down.pointerId) return
    const p = point(e)
    const targetId = dragging ? hitTest(p) : null
    finish(
      targetId
        ? { type: 'drop', targetId, point: p }
        : { type: 'cancel', reason: 'outside', point: p },
    )
  }

  function onCancel(e: PointerEvent) {
    if (e.pointerId !== down.pointerId) return
    finish({ type: 'cancel', reason: 'interrupted', point: point(e) })
  }

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Escape' || !dragging) return
    e.preventDefault()
    finish({ type: 'cancel', reason: 'escape', point: last })
  }

  target.addEventListener('pointermove', onMove as EventListener)
  target.addEventListener('pointerup', onUp as EventListener)
  target.addEventListener('pointercancel', onCancel as EventListener)
  target.addEventListener('keydown', onKey as EventListener)
  return () => finish()
}
