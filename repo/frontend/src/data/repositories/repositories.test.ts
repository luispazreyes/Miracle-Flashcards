// Repositorios (Fase 3): reglas de datos y atomicidad con la cola de salida.
import { openDb } from '../db/db'
import { makeRepos, word } from '../../test/repos'
import { RepoError } from '.'

type Ctx = Awaited<ReturnType<typeof makeRepos>>
let ctx: Ctx

beforeEach(async () => {
  ctx = await makeRepos()
})
afterEach(async () => {
  vi.restoreAllMocks()
  await ctx.cleanup()
})

const types = async () => (await ctx.repos.outbox.all()).map((o) => o.type)

async function rejection(p: Promise<unknown>): Promise<RepoError> {
  try {
    await p
  } catch (e) {
    return e as RepoError
  }
  throw new Error('se esperaba un rechazo')
}

describe('base local', () => {
  it('no se abre sin userId', () => {
    expect(() => openDb('')).toThrow()
    expect(() => openDb('   ')).toThrow()
  })
  it('cada usuario tiene su propia base', async () => {
    const other = await makeRepos()
    await ctx.repos.decks.create('Solo mío')
    expect(await other.repos.decks.list()).toEqual([])
    await other.cleanup()
  })
})

describe('atomicidad con el outbox (BR-40, EC-37)', () => {
  it('cada escritura deja su operación en el outbox', async () => {
    const deck = await ctx.repos.decks.create('Mazo 1')
    const { word: w } = await ctx.repos.words.create(word('Apple'))
    await ctx.repos.deckWords.add(deck.id, w.id)
    await ctx.repos.progress.record(deck.id, w.id, true)
    expect(await types()).toEqual(['deck.create', 'word.create', 'deckWord.add', 'progress.record'])
  })

  it('si falla el encolado no queda ningún dato a medias', async () => {
    vi.spyOn(ctx.db.outbox, 'add').mockRejectedValueOnce(new Error('fallo forzado'))
    await expect(ctx.repos.words.create(word('Apple'))).rejects.toThrow('fallo forzado')
    expect(await ctx.db.words.count()).toBe(0)
    expect(await ctx.db.outbox.count()).toBe(0)
  })

  it('si falla a mitad de registrar una respuesta, ni evento ni contador ni operación', async () => {
    const deck = await ctx.repos.decks.create('D')
    const { word: w } = await ctx.repos.words.create(word('Apple'))
    await ctx.repos.deckWords.add(deck.id, w.id)
    const before = await ctx.db.outbox.count()
    vi.spyOn(ctx.db.outbox, 'add').mockRejectedValueOnce(new Error('fallo forzado'))
    await expect(ctx.repos.progress.record(deck.id, w.id, true)).rejects.toThrow()
    expect(await ctx.db.progressEvents.count()).toBe(0)
    expect((await ctx.db.deckWords.get([deck.id, w.id]))?.consecutiveHits).toBe(0)
    expect(await ctx.db.outbox.count()).toBe(before)
  })

  it('un fallo de validación no deja operaciones', async () => {
    await rejection(ctx.repos.words.create({ english: '', spanish: '' }))
    expect(await ctx.db.outbox.count()).toBe(0)
  })

  it('avisa al confirmar la escritura (dispara la sincronización)', async () => {
    const onWrite = vi.fn()
    const c = await makeRepos({ onWrite })
    await c.repos.decks.create('A')
    expect(onWrite).toHaveBeenCalledTimes(1)
    await c.cleanup()
  })
})

describe('palabras', () => {
  it('BR-11: sin inglés o español no se crea y se nombra el campo (EC-13)', async () => {
    const e = await rejection(ctx.repos.words.create({ english: 'Hello', spanish: ' ' }))
    expect(e.code).toBe('invalid-word')
    expect(e.detail?.fields).toEqual({ spanish: 'required' })
    expect(await ctx.db.words.count()).toBe(0)
  })

  it('BR-12: mismo inglés avisa pero crea (EC-45)', async () => {
    await ctx.repos.words.create(word('Apple'))
    const second = await ctx.repos.words.create(word('  APPLE ', 'otra'))
    expect(second.duplicateEnglish).toBe(true)
    expect(await ctx.db.words.count()).toBe(2)
  })

  it('BR-12: "café" y "cafe" no se consideran el mismo término', async () => {
    await ctx.repos.words.create(word('café'))
    expect((await ctx.repos.words.create(word('cafe'))).duplicateEnglish).toBe(false)
  })

  it('BR-16: editar encola solo los campos modificados', async () => {
    const { word: w } = await ctx.repos.words.create({ ...word('Apple', 'manzana'), note: 'n' })
    await ctx.repos.words.update(w.id, { english: 'Apple', spanish: 'manzana verde', note: 'n' })
    const ops = await ctx.repos.outbox.all()
    const last = ops[ops.length - 1]
    expect(last.type).toBe('word.update')
    expect(last.payload).toEqual({ id: w.id, patch: { spanish: 'manzana verde' } })
  })

  it('BR-16: borrar el ejemplo viaja como null y sin cambios no hay operación', async () => {
    const { word: w } = await ctx.repos.words.create({ ...word('Apple'), example: 'e' })
    await ctx.repos.words.update(w.id, { ...word('Apple'), example: '' })
    const last = (await ctx.repos.outbox.all()).at(-1)!
    expect(last.payload).toEqual({ id: w.id, patch: { example: null } })
    const count = await ctx.db.outbox.count()
    await ctx.repos.words.update(w.id, { ...word('Apple') })
    expect(await ctx.db.outbox.count()).toBe(count)
  })

  it('BR-17: imagen sin verificar encola image.verify (EC-16)', async () => {
    const { word: w } = await ctx.repos.words.create({
      ...word('Cat'),
      imageUrl: 'https://img.invalid/cat.png',
      imageVerified: false,
    })
    expect(w.imageVerified).toBe(false)
    expect(await types()).toEqual(['word.create', 'image.verify'])
  })

  it('BR-17: si la imagen no carga al reconectar se retira y se sincroniza', async () => {
    const { word: w } = await ctx.repos.words.create({
      ...word('Cat'),
      imageUrl: 'https://img.invalid/cat.png',
      imageVerified: false,
    })
    await ctx.repos.words.resolveImage(w.id, false)
    const saved = await ctx.db.words.get(w.id)
    expect(saved?.imageUrl).toBeUndefined()
    expect((await ctx.repos.outbox.all()).at(-1)?.payload).toEqual({
      id: w.id,
      patch: { imageUrl: null, imageVerified: true },
    })
  })

  it('BR-17: si carga queda verificada', async () => {
    const { word: w } = await ctx.repos.words.create({
      ...word('Cat'),
      imageUrl: 'https://img.invalid/cat.png',
      imageVerified: false,
    })
    await ctx.repos.words.resolveImage(w.id, true)
    expect((await ctx.db.words.get(w.id))?.imageVerified).toBe(true)
  })
})

describe('mazos', () => {
  it('BR-19: valida vacío, longitud y duplicado sin mayúsculas ni acentos (EC-48)', async () => {
    await ctx.repos.decks.create('Café')
    expect((await rejection(ctx.repos.decks.create('  '))).detail?.deckName).toBe('empty')
    expect((await rejection(ctx.repos.decks.create('a'.repeat(61)))).detail?.deckName).toBe(
      'too-long',
    )
    expect((await rejection(ctx.repos.decks.create('CAFE'))).detail?.deckName).toBe('duplicate')
    expect(await ctx.db.decks.count()).toBe(1)
  })

  it('renombrar permite conservar el mismo nombre con otra capitalización', async () => {
    const d = await ctx.repos.decks.create('Café')
    expect((await ctx.repos.decks.rename(d.id, 'CAFÉ')).name).toBe('CAFÉ')
  })

  it('BR-20: borrar un mazo conserva las palabras y borra pertenencias y eventos (EC-21, EC-22)', async () => {
    const a = await ctx.repos.decks.create('A')
    const b = await ctx.repos.decks.create('B')
    const { word: w } = await ctx.repos.words.create(word('Apple'))
    await ctx.repos.deckWords.add(a.id, w.id)
    await ctx.repos.deckWords.add(b.id, w.id)
    await ctx.repos.progress.record(a.id, w.id, true)
    await ctx.repos.progress.record(b.id, w.id, true)

    await ctx.repos.decks.delete(a.id)

    expect(await ctx.db.words.get(w.id)).toBeDefined()
    expect(await ctx.db.deckWords.get([a.id, w.id])).toBeUndefined()
    expect(await ctx.db.deckWords.get([b.id, w.id])).toBeDefined()
    const events = await ctx.db.progressEvents.toArray()
    expect(events.map((e) => e.deckId)).toEqual([b.id])
    expect((await ctx.repos.outbox.all()).at(-1)?.type).toBe('deck.delete')
  })
})

describe('pertenencia a mazos', () => {
  it('BR-13: no permite dos palabras con el mismo término en un mazo, pero sí en otro (EC-17, EC-44)', async () => {
    const a = await ctx.repos.decks.create('A')
    const b = await ctx.repos.decks.create('B')
    const { word: w1 } = await ctx.repos.words.create(word('Apple'))
    const { word: w2 } = await ctx.repos.words.create(word('apple', 'otra'))
    await ctx.repos.deckWords.add(a.id, w1.id)
    const e = await rejection(ctx.repos.deckWords.add(a.id, w2.id))
    expect(e.code).toBe('duplicate-in-deck')
    expect(e.detail?.english).toBe('apple')
    await expect(ctx.repos.deckWords.add(b.id, w2.id)).resolves.toBeDefined()
  })

  it('BR-13: la misma palabra dos veces en el mismo mazo también se bloquea', async () => {
    const a = await ctx.repos.decks.create('A')
    const { word: w } = await ctx.repos.words.create(word('Apple'))
    await ctx.repos.deckWords.add(a.id, w.id)
    expect((await rejection(ctx.repos.deckWords.add(a.id, w.id))).code).toBe('duplicate-in-deck')
    expect(await ctx.db.deckWords.count()).toBe(1)
  })

  it('RF-30: una palabra en dos mazos tiene progreso independiente', async () => {
    const a = await ctx.repos.decks.create('A')
    const b = await ctx.repos.decks.create('B')
    const { word: w } = await ctx.repos.words.create(word('Apple'))
    await ctx.repos.deckWords.add(a.id, w.id)
    await ctx.repos.deckWords.add(b.id, w.id)
    for (let i = 0; i < 3; i++) await ctx.repos.progress.record(a.id, w.id, true)
    expect((await ctx.db.deckWords.get([a.id, w.id]))?.status).toBe('learned')
    expect((await ctx.db.deckWords.get([b.id, w.id]))?.status).toBe('pending')
  })

  it('BR-14: quitar de un mazo elimina su progreso allí y conserva la palabra; al reagregar vuelve a 0 (EC-23)', async () => {
    const a = await ctx.repos.decks.create('A')
    const b = await ctx.repos.decks.create('B')
    const { word: w } = await ctx.repos.words.create(word('Apple'))
    await ctx.repos.deckWords.add(a.id, w.id)
    await ctx.repos.deckWords.add(b.id, w.id)
    await ctx.repos.progress.record(a.id, w.id, true)
    await ctx.repos.progress.record(b.id, w.id, true)

    await ctx.repos.deckWords.remove(a.id, w.id)

    expect(await ctx.db.words.get(w.id)).toBeDefined()
    expect((await ctx.db.progressEvents.toArray()).map((e) => e.deckId)).toEqual([b.id])
    const again = await ctx.repos.deckWords.add(a.id, w.id)
    expect(again.consecutiveHits).toBe(0)
  })

  it('BR-15: borrar la palabra elimina sus pertenencias y eventos (EC-23)', async () => {
    const a = await ctx.repos.decks.create('A')
    const { word: w } = await ctx.repos.words.create(word('Apple'))
    const { word: keep } = await ctx.repos.words.create(word('Bread'))
    await ctx.repos.deckWords.add(a.id, w.id)
    await ctx.repos.deckWords.add(a.id, keep.id)
    await ctx.repos.progress.record(a.id, w.id, false)
    await ctx.repos.progress.record(a.id, keep.id, true)

    await ctx.repos.words.delete(w.id)

    expect(await ctx.db.words.get(w.id)).toBeUndefined()
    expect(await ctx.db.deckWords.where('wordId').equals(w.id).count()).toBe(0)
    expect((await ctx.db.progressEvents.toArray()).map((e) => e.wordId)).toEqual([keep.id])
    expect(await ctx.db.decks.get(a.id)).toBeDefined()
  })
})

describe('progreso (BR-03, BR-04, BR-08, BR-09)', () => {
  async function setup() {
    const deck = await ctx.repos.decks.create('D')
    const { word: w } = await ctx.repos.words.create(word('Apple'))
    await ctx.repos.deckWords.add(deck.id, w.id)
    return { deck, w }
  }

  it('guarda evento y recalcula contador y estado en una operación (EC-07, EC-08)', async () => {
    const { deck, w } = await setup()
    await ctx.repos.progress.record(deck.id, w.id, true)
    await ctx.repos.progress.record(deck.id, w.id, true)
    expect((await ctx.db.deckWords.get([deck.id, w.id]))?.consecutiveHits).toBe(2)
    await ctx.repos.progress.record(deck.id, w.id, false)
    expect((await ctx.db.deckWords.get([deck.id, w.id]))?.consecutiveHits).toBe(0)
    const final = await ctx.repos.progress.record(deck.id, w.id, true)
    expect(final).toMatchObject({ consecutiveHits: 1, status: 'pending' })
    expect(await ctx.db.progressEvents.count()).toBe(4)
  })

  it('los eventos llevan localOrder creciente', async () => {
    const { deck, w } = await setup()
    for (let i = 0; i < 3; i++) await ctx.repos.progress.record(deck.id, w.id, true)
    const orders = (await ctx.db.progressEvents.orderBy('localOrder').toArray()).map(
      (e) => e.localOrder,
    )
    expect(orders).toEqual([1, 2, 3])
  })

  it('BR-09: reactivar deja pendiente con contador 0 solo en ese mazo (EC-33, EC-34)', async () => {
    const { deck, w } = await setup()
    const other = await ctx.repos.decks.create('Otro')
    await ctx.repos.deckWords.add(other.id, w.id)
    for (let i = 0; i < 3; i++) {
      await ctx.repos.progress.record(deck.id, w.id, true)
      await ctx.repos.progress.record(other.id, w.id, true)
    }
    await ctx.repos.progress.reactivate(deck.id, w.id)
    expect(await ctx.db.deckWords.get([deck.id, w.id])).toMatchObject({
      status: 'pending',
      consecutiveHits: 0,
    })
    expect((await ctx.db.deckWords.get([other.id, w.id]))?.status).toBe('learned')
  })
})

describe('preferencias (BR-36)', () => {
  const defaults = { theme: 'white', backgroundPalette: 'neutral', cardPalette: 'neutral' } as const

  it('sin registro parte de los valores por defecto y de imageSide = back (RF-12)', async () => {
    const pref = await ctx.repos.preferences.update({ theme: 'dark' }, defaults)
    expect(pref).toMatchObject({ theme: 'dark', backgroundPalette: 'neutral', imageSide: 'back' })
  })
  it('encola solo el parche y conserva lo anterior', async () => {
    await ctx.repos.preferences.update({ theme: 'blue' }, defaults)
    await ctx.repos.preferences.update({ cardPalette: 'mint' }, defaults)
    expect(await ctx.repos.preferences.get()).toMatchObject({ theme: 'blue', cardPalette: 'mint' })
    expect((await ctx.repos.outbox.all()).at(-1)?.payload).toEqual({
      patch: { cardPalette: 'mint' },
    })
  })
})
