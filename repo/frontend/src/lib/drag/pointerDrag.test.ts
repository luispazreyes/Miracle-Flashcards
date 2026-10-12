// Controlador de arrastre con Pointer Events (Fase 12): umbral, destino, cancelación. EC-56, EC-59.
import { startPointerDrag, type DragCallbacks, type DragEnd, type DragOptions } from './pointerDrag'

type Pt = { x: number; y: number }

function setup(options: DragOptions = {}) {
  const target = new EventTarget()
  const calls = {
    starts: [] as Pt[],
    moves: [] as { point: Pt; targetId: string | null }[],
    ends: [] as DragEnd[],
  }
  const callbacks: DragCallbacks = {
    onStart: (p) => calls.starts.push(p),
    onMove: (point, targetId) => calls.moves.push({ point, targetId }),
    onEnd: (e) => calls.ends.push(e),
  }
  const pointer = (type: string, x: number, y: number, extra: Record<string, unknown> = {}) =>
    target.dispatchEvent(
      Object.assign(new Event(type), { pointerId: 1, clientX: x, clientY: y, ...extra }),
    )
  const key = (k: string) =>
    target.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key: k }))
  const stop = startPointerDrag({ pointerId: 1, clientX: 10, clientY: 10, button: 0 }, callbacks, {
    threshold: 6,
    hitTest: ({ x }) => (x >= 100 ? 'deck-1' : null),
    target,
    ...options,
  })
  return { calls, pointer, key, stop }
}

describe('startPointerDrag', () => {
  it('no empieza hasta superar el umbral: un toque no es un arrastre', () => {
    const t = setup()
    t.pointer('pointermove', 12, 12)
    t.pointer('pointerup', 12, 12)
    expect(t.calls.starts).toEqual([])
    expect(t.calls.ends).toEqual([])
  })

  it('al superar el umbral empieza y sigue al puntero informando el destino bajo él', () => {
    const t = setup()
    t.pointer('pointermove', 30, 10)
    expect(t.calls.starts).toEqual([{ x: 30, y: 10 }])
    t.pointer('pointermove', 120, 40)
    expect(t.calls.moves.map((m) => m.targetId)).toEqual([null, 'deck-1'])
  })

  it('soltar sobre un destino es un depósito (BR-27)', () => {
    const t = setup()
    t.pointer('pointermove', 50, 10)
    t.pointer('pointermove', 120, 10)
    t.pointer('pointerup', 120, 10)
    expect(t.calls.ends).toEqual([{ type: 'drop', targetId: 'deck-1', point: { x: 120, y: 10 } }])
  })

  it('soltar fuera de un destino cancela (BR-28, EC-56)', () => {
    const t = setup()
    t.pointer('pointermove', 50, 10)
    t.pointer('pointerup', 50, 10)
    expect(t.calls.ends).toEqual([{ type: 'cancel', reason: 'outside', point: { x: 50, y: 10 } }])
  })

  it('Escape cancela mientras se arrastra, con la última posición', () => {
    const t = setup()
    t.pointer('pointermove', 50, 20)
    t.key('Escape')
    expect(t.calls.ends).toEqual([{ type: 'cancel', reason: 'escape', point: { x: 50, y: 20 } }])
    t.pointer('pointerup', 120, 10) // ya terminó: no hay un segundo final
    expect(t.calls.ends).toHaveLength(1)
  })

  it('Escape sin haber empezado el arrastre no hace nada', () => {
    const t = setup()
    t.key('Escape')
    expect(t.calls.ends).toEqual([])
  })

  it('pointercancel (interrupción) cancela', () => {
    const t = setup()
    t.pointer('pointermove', 50, 10)
    t.pointer('pointercancel', 50, 10)
    expect(t.calls.ends[0]).toMatchObject({ type: 'cancel', reason: 'interrupted' })
  })

  it('ignora otros punteros y otros botones', () => {
    const t = setup()
    t.pointer('pointermove', 50, 10, { pointerId: 2 })
    expect(t.calls.starts).toEqual([])
    const right = startPointerDrag(
      { pointerId: 1, clientX: 0, clientY: 0, button: 2 },
      {
        onStart: () => t.calls.starts.push({ x: 0, y: 0 }),
        onMove: () => {},
        onEnd: () => {},
      },
    )
    right()
    expect(t.calls.starts).toEqual([])
  })

  it('la función de limpieza deja de escuchar sin avisar', () => {
    const t = setup()
    t.pointer('pointermove', 50, 10)
    t.stop()
    t.pointer('pointermove', 120, 10)
    t.pointer('pointerup', 120, 10)
    expect(t.calls.ends).toEqual([])
    expect(t.calls.moves).toHaveLength(1)
  })

  it('captura el puntero en el asa y lo libera al terminar', () => {
    const el = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    }
    const target = new EventTarget()
    startPointerDrag(
      { pointerId: 7, clientX: 0, clientY: 0, button: 0, currentTarget: el as unknown as Element },
      { onStart: () => {}, onMove: () => {}, onEnd: () => {} },
      { target },
    )
    expect(el.setPointerCapture).toHaveBeenCalledWith(7)
    target.dispatchEvent(
      Object.assign(new Event('pointerup'), { pointerId: 7, clientX: 0, clientY: 0 }),
    )
    expect(el.releasePointerCapture).toHaveBeenCalledWith(7)
  })
})
