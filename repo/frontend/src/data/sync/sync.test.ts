// Motor de sincronización contra el servidor simulado (Fase 4): EC-28, EC-29, EC-37 a EC-41.
import { SYNC_BACKOFF_S } from '../../domain'
import { makeDevice, makeServer, type Device } from '../../test/devices'
import { word } from '../../test/repos'

const USER = 'user-1'
let devices: Device[] = []
const device = (server: ReturnType<typeof makeServer>, opts?: Parameters<typeof makeDevice>[2]) => {
  const d = makeDevice(server, USER, opts)
  devices.push(d)
  return d
}
afterEach(async () => {
  await Promise.all(devices.map((d) => d.cleanup()))
  devices = []
})

/** Sincroniza y espera a que termine. */
async function sync(d: Device) {
  await d.engine.run()
  await d.engine.idle()
}

describe('envío básico (RF-22)', () => {
  it('envía la cola, la vacía y queda sincronizado', async () => {
    const server = makeServer()
    const a = device(server)
    const deck = await a.repos.decks.create('Mazo 1')
    const { word: w } = await a.repos.words.create(word('Apple'))
    await a.repos.deckWords.add(deck.id, w.id)
    await sync(a)

    expect(await a.repos.outbox.unsynced()).toBe(0)
    expect(a.engine.getSnapshot()).toEqual({ state: 'synced', pending: 0 })
    const snap = server.snapshot(USER)
    expect(snap.decks.map((d) => d.name)).toEqual(['Mazo 1'])
    expect(snap.words.map((x) => x.english)).toEqual(['Apple'])
    expect(snap.deckWords).toHaveLength(1)
  })

  it('el servidor asigna las marcas de tiempo y el cliente las adopta', async () => {
    const server = makeServer()
    const a = device(server)
    const { word: w } = await a.repos.words.create(word('Apple'))
    await sync(a)
    const local = await a.db.words.get(w.id)
    const remote = server.snapshot(USER).words[0]
    expect(local?.englishUpdatedAt).toBe(remote.englishUpdatedAt)
  })

  it('un segundo dispositivo recibe los datos con pull', async () => {
    const server = makeServer()
    const a = device(server)
    const b = device(server)
    const deck = await a.repos.decks.create('Mazo 1')
    const { word: w } = await a.repos.words.create(word('Apple'))
    await a.repos.deckWords.add(deck.id, w.id)
    await sync(a)
    await sync(b)
    expect((await b.repos.decks.list()).map((d) => d.name)).toEqual(['Mazo 1'])
    expect((await b.repos.words.list()).map((x) => x.english)).toEqual(['Apple'])
    expect(await b.repos.deckWords.listAll()).toHaveLength(1)
  })
})

describe('idempotencia (EC-37)', () => {
  it('reintentar tras perder la respuesta no duplica palabras ni suma contadores dos veces', async () => {
    const server = makeServer()
    const a = device(server)
    const deck = await a.repos.decks.create('D')
    const { word: w } = await a.repos.words.create(word('Apple'))
    await a.repos.deckWords.add(deck.id, w.id)
    await sync(a)
    await a.repos.progress.record(deck.id, w.id, true)
    await a.repos.progress.record(deck.id, w.id, true)
    await a.engine.idle()

    // Nuevas respuestas: el servidor las aplica pero la respuesta se pierde (corte a mitad).
    a.remote.controls.loseResponseNext = 1
    await a.repos.progress.record(deck.id, w.id, false)
    await a.repos.progress.record(deck.id, w.id, true)
    await a.engine.idle()
    expect(a.engine.getSnapshot().state).toBe('unsynced')
    expect(await a.repos.outbox.unsynced()).toBe(2)

    await a.fireTimer() // reintento: el servidor responde `alreadyApplied`
    expect(a.engine.getSnapshot().state).toBe('synced')
    expect(server.snapshot(USER).words).toHaveLength(1)
    const entry = server.snapshot(USER).deckWords[0]
    // 2 aciertos, fallo, 1 acierto → contador 1 (no 3 ni 0).
    expect(entry).toMatchObject({ consecutiveHits: 1, status: 'pending' })
    expect(server.snapshot(USER).events).toBe(4)
  })

  it('el mismo opId enviado dos veces se aplica una sola vez', async () => {
    const server = makeServer()
    const op = {
      opId: 'op-1',
      createdAt: 1,
      op: { type: 'deck.create' as const, payload: { id: 'd1', name: 'A', normalizedName: 'a' } },
    }
    const first = server.push(USER, [op])
    const second = server.push(USER, [op])
    expect(first.results[0].outcome).toBe('applied')
    expect(second.results[0].outcome).toBe('alreadyApplied')
    expect(server.snapshot(USER).decks).toHaveLength(1)
  })
})

describe('dos dispositivos (RF-29, EC-38 a EC-41)', () => {
  async function shared() {
    const server = makeServer()
    const a = device(server)
    const b = device(server)
    const deck = await a.repos.decks.create('Mazo')
    const { word: w } = await a.repos.words.create({ ...word('Apple', 'manzana'), note: 'n1' })
    await a.repos.deckWords.add(deck.id, w.id)
    await sync(a)
    await sync(b)
    return { server, a, b, deck, w }
  }

  it('ediciones de campos distintos se combinan (EC-39)', async () => {
    const { server, a, b, w } = await shared()
    a.net.online = false
    b.net.online = false
    await a.repos.words.update(w.id, { english: 'Apple', spanish: 'manzana roja', note: 'n1' })
    await b.repos.words.update(w.id, { english: 'Apple', spanish: 'manzana', note: 'nota de B' })
    a.net.online = true
    b.net.online = true
    await sync(a)
    await sync(b)
    await sync(a)

    const final = server.snapshot(USER).words[0]
    expect(final).toMatchObject({ spanish: 'manzana roja', note: 'nota de B' })
    for (const d of [a, b])
      expect(await d.db.words.get(w.id)).toMatchObject({
        spanish: 'manzana roja',
        note: 'nota de B',
      })
  })

  it('en el mismo campo gana el cambio más reciente según el servidor (EC-38)', async () => {
    const { server, a, b, w } = await shared()
    a.net.online = false
    await a.repos.words.update(w.id, { english: 'Apple', spanish: 'de A', note: 'n1' })
    await b.repos.words.update(w.id, { english: 'Apple', spanish: 'de B', note: 'n1' })
    await sync(b) // B llega primero
    a.net.online = true
    await sync(a) // A llega después → gana A
    expect(server.snapshot(USER).words[0].spanish).toBe('de A')
    await sync(b)
    expect((await b.db.words.get(w.id))?.spanish).toBe('de A')
  })

  it('el progreso de ambos dispositivos se combina (EC-40)', async () => {
    const { server, a, b, deck, w } = await shared()
    a.net.online = false
    b.net.online = false
    await a.repos.progress.record(deck.id, w.id, true)
    await a.repos.progress.record(deck.id, w.id, true)
    await b.repos.progress.record(deck.id, w.id, true)
    a.net.online = true
    b.net.online = true
    await sync(a)
    await sync(b)
    await sync(a)

    expect(server.snapshot(USER).deckWords[0]).toMatchObject({
      consecutiveHits: 3,
      status: 'learned',
    })
    for (const d of [a, b])
      expect(await d.db.deckWords.get([deck.id, w.id])).toMatchObject({
        consecutiveHits: 3,
        status: 'learned',
      })
  })

  it('el borrado prevalece y el otro dispositivo es avisado (EC-41)', async () => {
    const { server, a, b, deck, w } = await shared()
    b.net.online = false
    await a.repos.words.delete(w.id)
    await sync(a)
    // B edita y responde la palabra que ya no existe en el servidor.
    await b.repos.words.update(w.id, { english: 'Apple', spanish: 'editada', note: 'n1' })
    await b.repos.progress.record(deck.id, w.id, true)
    b.net.online = true
    await sync(b)

    expect(server.snapshot(USER).words).toEqual([])
    expect(await b.db.words.get(w.id)).toBeUndefined()
    expect(await b.db.deckWords.get([deck.id, w.id])).toBeUndefined()
    expect(await b.repos.outbox.unsynced()).toBe(0)
    expect(b.notices).toContainEqual({ kind: 'remote-deleted', entity: 'word', name: 'Apple' })
  })

  it('borrar un mazo en un dispositivo lo elimina en el otro conservando las palabras', async () => {
    const { a, b, deck, w } = await shared()
    await a.repos.decks.delete(deck.id)
    await sync(a)
    await sync(b)
    expect(await b.repos.decks.list()).toEqual([])
    expect(await b.db.words.get(w.id)).toBeDefined()
    expect(b.notices).toContainEqual({ kind: 'remote-deleted', entity: 'deck', name: 'Mazo' })
  })

  it('quitar una palabra de un mazo se propaga con su progreso', async () => {
    const { a, b, deck, w } = await shared()
    await a.repos.deckWords.remove(deck.id, w.id)
    await sync(a)
    await sync(b)
    expect(await b.db.deckWords.get([deck.id, w.id])).toBeUndefined()
    expect(await b.db.words.get(w.id)).toBeDefined()
  })

  it('las preferencias se sincronizan entre dispositivos (BR-36)', async () => {
    const { a, b } = await shared()
    await a.repos.preferences.update(
      { theme: 'blue' },
      { theme: 'white', backgroundPalette: 'neutral', cardPalette: 'neutral' },
    )
    await sync(a)
    await sync(b)
    expect((await b.repos.preferences.get())?.theme).toBe('blue')
  })

  it('un cambio local pendiente no se sobrescribe con el estado anterior del servidor', async () => {
    const { server, a, b, w } = await shared()
    a.net.online = false
    await a.repos.words.update(w.id, { english: 'Apple', spanish: 'local', note: 'n1' })
    await b.repos.words.update(w.id, { english: 'Apple', spanish: 'de B', note: 'n1' })
    await sync(b)
    a.net.online = true
    await sync(a)
    expect(server.snapshot(USER).words[0].spanish).toBe('local')
    expect((await a.db.words.get(w.id))?.spanish).toBe('local')
  })
})

describe('reintentos y fallos (EC-29, BR-41)', () => {
  it('usa espera creciente 2, 4, 8, 16 y 32 s y se detiene tras 5 reintentos', async () => {
    const server = makeServer()
    const a = device(server)
    a.remote.controls.failNext = 100
    await a.repos.decks.create('D')
    await a.engine.idle()

    const waits: number[] = []
    for (;;) {
      const next = a.timers.find((t) => !t.cancelled)
      if (!next) break
      waits.push(next.ms / 1000)
      await a.fireTimer()
    }
    expect(waits).toEqual([...SYNC_BACKOFF_S])
    expect(a.remote.calls.push).toBe(6) // 1 intento + 5 reintentos
    expect(a.engine.getSnapshot()).toEqual({ state: 'unsynced', pending: 1 })
  })

  it('tras agotarlos no se pierde nada local y "Reintentar" reanuda (EC-29)', async () => {
    const server = makeServer()
    const a = device(server)
    a.remote.controls.failNext = 100
    const deck = await a.repos.decks.create('D')
    await a.engine.idle()
    while (await a.fireTimer());

    expect(await a.repos.decks.get(deck.id)).toBeDefined()
    expect((await a.repos.outbox.all()).map((o) => o.status)).toEqual(['failed'])

    // Una nueva escritura no reanuda automáticamente lo agotado.
    const calls = a.remote.calls.push
    await a.repos.decks.create('E')
    await a.engine.idle()
    expect(a.remote.calls.push).toBe(calls)

    a.remote.controls.failNext = 0
    await a.engine.retry()
    expect(a.engine.getSnapshot()).toEqual({ state: 'synced', pending: 0 })
    expect(
      server
        .snapshot(USER)
        .decks.map((d) => d.name)
        .sort(),
    ).toEqual(['D', 'E'])
  })

  it('un fallo suelto se recupera solo en el reintento', async () => {
    const server = makeServer()
    const a = device(server)
    a.remote.controls.failNext = 1
    await a.repos.decks.create('D')
    await a.engine.idle()
    expect(a.engine.getSnapshot().state).toBe('unsynced')
    await a.fireTimer()
    expect(a.engine.getSnapshot().state).toBe('synced')
  })
})

describe('conexión (RF-28, BR-39)', () => {
  it('sin conexión todo queda local y el estado es offline', async () => {
    const server = makeServer()
    const a = device(server)
    a.net.online = false
    await a.repos.decks.create('D')
    await a.engine.idle()
    expect(a.engine.getSnapshot()).toEqual({ state: 'offline', pending: 1 })
    expect(server.snapshot(USER).decks).toEqual([])
  })

  it('al volver la conexión sincroniza automáticamente (EC-30)', async () => {
    const server = makeServer()
    const a = device(server)
    a.engine.start()
    a.net.online = false
    await a.repos.decks.create('D')
    await a.engine.idle()
    a.net.online = true
    a.events.dispatchEvent(new Event('online'))
    await vi.waitFor(() => expect(a.engine.getSnapshot()).toEqual({ state: 'synced', pending: 0 }))
    expect(server.snapshot(USER).decks).toHaveLength(1)
  })

  it('al volver la conexión también reanuda reintentos agotados', async () => {
    const server = makeServer()
    const a = device(server)
    a.engine.start()
    a.remote.controls.failNext = 100
    await a.repos.decks.create('D')
    await a.engine.idle()
    while (await a.fireTimer());
    a.remote.controls.failNext = 0
    a.events.dispatchEvent(new Event('online'))
    await vi.waitFor(() => expect(a.engine.getSnapshot().state).toBe('synced'))
  })
})

describe('imágenes sin verificar (BR-17, EC-16)', () => {
  it('al reconectar se comprueban: la válida se verifica y la inválida se retira con aviso', async () => {
    const server = makeServer()
    const a = device(server, { verifyImage: async (url) => url.includes('good') })
    a.net.online = false
    const good = await a.repos.words.create({
      ...word('Good'),
      imageUrl: 'https://img.invalid/good.png',
      imageVerified: false,
    })
    const bad = await a.repos.words.create({
      ...word('Bad'),
      imageUrl: 'https://img.invalid/bad.png',
      imageVerified: false,
    })
    await a.engine.idle()
    a.net.online = true
    await sync(a)

    expect((await a.db.words.get(good.word.id))?.imageVerified).toBe(true)
    expect((await a.db.words.get(bad.word.id))?.imageUrl).toBeUndefined()
    expect(a.notices).toContainEqual({ kind: 'image-removed', name: 'Bad' })
    expect(await a.db.outbox.where('type').equals('image.verify').count()).toBe(0)
    expect(server.snapshot(USER).words.find((x) => x.english === 'Bad')?.imageUrl).toBeUndefined()
  })
})

describe('casos críticos del plan de pruebas (NEC-01, NEC-05)', () => {
  it('EC-38 / NEC-01: un dispositivo con el reloj un día adelantado no gana por eso; manda la hora del servidor', async () => {
    const server = makeServer()
    const DAY = 24 * 60 * 60 * 1000
    const ahead = device(server, { now: () => Date.now() + DAY })
    const normal = device(server)
    const { word: w } = await ahead.repos.words.create(word('Apple', 'manzana'))
    await sync(ahead)
    await sync(normal)

    ahead.net.online = false
    normal.net.online = false
    await ahead.repos.words.update(w.id, { english: 'Apple', spanish: 'del adelantado' })
    await normal.repos.words.update(w.id, { english: 'Apple', spanish: 'del normal' })
    normal.net.online = true
    ahead.net.online = true
    await sync(ahead) // el del reloj adelantado llega primero
    await sync(normal) // el otro llega después: prevalece, aunque su reloj local sea anterior
    expect(server.snapshot(USER).words[0].spanish).toBe('del normal')
  })

  it('NEC-05: dos dispositivos añaden la misma palabra al mismo mazo sin conexión → una sola fila', async () => {
    const server = makeServer()
    const a = device(server)
    const b = device(server)
    const deck = await a.repos.decks.create('Mazo')
    const { word: w } = await a.repos.words.create(word('Apple', 'manzana'))
    await sync(a)
    await sync(b)
    a.net.online = false
    b.net.online = false
    await a.repos.deckWords.add(deck.id, w.id)
    await b.repos.deckWords.add(deck.id, w.id)
    a.net.online = true
    b.net.online = true
    await sync(a)
    await sync(b)
    await sync(a)
    expect(server.snapshot(USER).deckWords).toHaveLength(1)
    expect(await a.db.deckWords.count()).toBe(1)
    expect(await b.db.deckWords.count()).toBe(1)
  })
})
