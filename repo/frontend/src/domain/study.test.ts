import {
  applyAnswer,
  buildPass,
  emptyQueue,
  nextCard,
  reactivate,
  shuffle,
  type Random,
  type StudyQueue,
} from './study'

/** Generador determinista (mulberry32). */
export function seeded(seed: number): Random {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('applyAnswer (BR-03, BR-04)', () => {
  it('un acierto suma 1', () => {
    expect(applyAnswer({ consecutiveHits: 0, status: 'pending' }, true)).toEqual({
      consecutiveHits: 1,
      status: 'pending',
    })
  })
  it('con 3 aciertos consecutivos pasa a aprendida (EC-07)', () => {
    expect(applyAnswer({ consecutiveHits: 2, status: 'pending' }, true)).toEqual({
      consecutiveHits: 3,
      status: 'learned',
    })
  })
  it('un fallo reinicia el contador y sigue pendiente (EC-08)', () => {
    expect(applyAnswer({ consecutiveHits: 2, status: 'pending' }, false)).toEqual({
      consecutiveHits: 0,
      status: 'pending',
    })
  })
  it('un fallo en una aprendida la devuelve a pendiente', () => {
    expect(applyAnswer({ consecutiveHits: 3, status: 'learned' }, false).status).toBe('pending')
  })
  it('el contador no pasa de 3', () => {
    expect(applyAnswer({ consecutiveHits: 3, status: 'learned' }, true).consecutiveHits).toBe(3)
  })
})

describe('reactivate (BR-09)', () => {
  it('deja pendiente con contador 0', () => {
    expect(reactivate()).toEqual({ consecutiveHits: 0, status: 'pending' })
  })
})

describe('shuffle y buildPass (BR-05)', () => {
  it('conserva los elementos y no muta la entrada', () => {
    const input = ['a', 'b', 'c', 'd']
    const out = shuffle(input, seeded(1))
    expect([...out].sort()).toEqual(input)
    expect(input).toEqual(['a', 'b', 'c', 'd'])
  })
  it('con ≥ 2 pendientes la primera nunca es la última mostrada', () => {
    for (let seed = 0; seed < 200; seed++) {
      const pass = buildPass(['a', 'b', 'c'], 'a', seeded(seed))
      expect(pass[0]).not.toBe('a')
      expect([...pass].sort()).toEqual(['a', 'b', 'c'])
    }
  })
  it('con 1 pendiente se repite (EC-46)', () => {
    expect(buildPass(['a'], 'a', seeded(1))).toEqual(['a'])
  })
  it('sin pendientes devuelve una pasada vacía', () => {
    expect(buildPass([], null, seeded(1))).toEqual([])
  })
})

describe('nextCard: cola en pasadas (BR-05, RF-31, EC-12)', () => {
  it('cada tarjeta aparece una vez por pasada', () => {
    let queue: StudyQueue = emptyQueue
    const shown: string[] = []
    const pending = ['a', 'b', 'c', 'd']
    for (let i = 0; i < 4; i++) {
      const r = nextCard(queue, pending, seeded(7))
      shown.push(r.card!)
      queue = r.queue
    }
    expect([...shown].sort()).toEqual(pending)
  })

  it('sin pendientes no hay tarjeta (BR-07)', () => {
    expect(nextCard(emptyQueue, [], seeded(1)).card).toBeNull()
  })

  it('las tarjetas que dejan de estar pendientes se descartan de la pasada', () => {
    const first = nextCard(emptyQueue, ['a', 'b', 'c'], seeded(3))
    const learned = first.queue.pass[0]
    const stillPending = ['a', 'b', 'c'].filter((x) => x !== learned)
    const second = nextCard(first.queue, stillPending, seeded(3))
    expect(second.card).not.toBe(learned)
  })

  it('las falladas vuelven en la pasada siguiente, no dentro de la misma', () => {
    const pending = ['a', 'b', 'c']
    let queue: StudyQueue = emptyQueue
    const shown: string[] = []
    for (let i = 0; i < 6; i++) {
      const r = nextCard(queue, pending, seeded(11 + i))
      shown.push(r.card!)
      queue = r.queue
    }
    expect(new Set(shown.slice(0, 3)).size).toBe(3)
    expect(new Set(shown.slice(3, 6)).size).toBe(3)
  })

  it('propiedad: con ≥ 2 pendientes nunca se repite la misma tarjeta seguida (200 sesiones al azar)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const random = seeded(seed)
      const hits = new Map<string, number>()
      const ids = Array.from({ length: 2 + Math.floor(random() * 6) }, (_, i) => `w${i}`)
      ids.forEach((id) => hits.set(id, 0))
      let queue: StudyQueue = emptyQueue
      let last: string | null = null
      for (let step = 0; step < 150; step++) {
        const pending = ids.filter((id) => (hits.get(id) ?? 0) < 3)
        const r = nextCard(queue, pending, random)
        if (r.card === null) break
        if (pending.length >= 2) expect(r.card).not.toBe(last)
        last = r.card
        queue = r.queue
        hits.set(r.card, random() < 0.6 ? (hits.get(r.card) ?? 0) + 1 : 0)
      }
    }
  })

  it('con 1 pendiente se repite hasta aprenderla (EC-46)', () => {
    let queue: StudyQueue = emptyQueue
    const shown: string[] = []
    for (let i = 0; i < 3; i++) {
      const r = nextCard(queue, ['solo'], seeded(1))
      shown.push(r.card!)
      queue = r.queue
    }
    expect(shown).toEqual(['solo', 'solo', 'solo'])
  })
})
