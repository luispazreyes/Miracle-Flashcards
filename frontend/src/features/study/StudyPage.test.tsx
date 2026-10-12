// Sesión de estudio (Fase 8): HU-02 a HU-05; EC-04 a EC-12, EC-46, EC-53; BR-01 a BR-10.
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeViolations } from '../../test/axe'
import { openApp } from '../../test/appHarness'

type App = Awaited<ReturnType<typeof openApp>>

async function deckWith(
  app: App,
  words: [string, string][],
  opts: { example?: string; note?: string; imageUrl?: string } = {},
) {
  const deck = await app.repos.decks.create('Mazo 1')
  const ids: string[] = []
  for (const [english, spanish] of words) {
    const { word } = await app.repos.words.create({ english, spanish, ...opts })
    await app.repos.deckWords.add(deck.id, word.id)
    ids.push(word.id)
  }
  return { deck, ids }
}

async function start(app: App, deckId: string) {
  await app.render(`/estudio/${deckId}`)
  return screen.findByRole('button', { name: /^Tarjeta: / })
}

const shownWord = () =>
  /^Tarjeta: (.+)\. Pulsa/.exec(
    screen.getByRole('button', { name: /^Tarjeta: / }).getAttribute('aria-label') ?? '',
  )?.[1]

async function answer(user: ReturnType<typeof userEvent.setup>, hit: boolean) {
  await user.click(await screen.findByRole('button', { name: /^Tarjeta: / }))
  await user.click(await screen.findByRole('button', { name: hit ? 'Acerté' : 'No acerté' }))
}

describe('StudyPage: inicio y reglas (BR-02, BR-07)', () => {
  it('EC-09: un mazo sin palabras no inicia sesión y ofrece volver', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const deck = await app.repos.decks.create('Vacío')
    await app.render(`/estudio/${deck.id}`)
    expect(
      await screen.findByRole('heading', { name: 'Este mazo no tiene palabras', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Reactivar palabras' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a mazos' })).toHaveAttribute(
      'href',
      `/mazos?deck=${deck.id}`,
    )
    expect(screen.queryByRole('button', { name: /^Tarjeta/ })).not.toBeInTheDocument()
  })

  it('EC-10: un mazo sin pendientes muestra el aviso sin resumen y con las dos acciones, en orden', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck, ids } = await deckWith(app, [['Apple', 'manzana']])
    for (let i = 0; i < 3; i++) await app.repos.progress.record(deck.id, ids[0], true)
    await app.render(`/estudio/${deck.id}`)
    const title = await screen.findByRole('heading', {
      name: 'Este mazo no tiene palabras pendientes',
      level: 2,
    })
    await waitFor(() => expect(title).toHaveFocus())
    expect(title.parentElement).toHaveAttribute('role', 'status')
    expect(screen.queryByText(/Aciertos:/)).not.toBeInTheDocument()
    const links = screen
      .getAllByRole('link')
      .filter((l) => /Reactivar|Volver/.test(l.textContent ?? ''))
    expect(links.map((l) => l.textContent)).toEqual(['Reactivar palabras', 'Volver a mazos'])
    expect(links[0]).toHaveAttribute('href', `/progreso?deck=${deck.id}`)
  })

  it('un mazo que no existe vuelve a /mazos', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    await app.render('/estudio/no-existe')
    expect(await screen.findByRole('heading', { name: 'Mazos', level: 1 })).toBeInTheDocument()
  })

  it('error de carga: mensaje y "Reintentar"', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [['Apple', 'manzana']])
    const spy = vi.spyOn(app.repos.deckWords, 'studySet').mockRejectedValueOnce(new Error('x'))
    await app.render(`/estudio/${deck.id}`)
    expect(await screen.findByText('No se pudo cargar la sesión de estudio.')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('button', { name: /^Tarjeta: Apple/ })).toBeInTheDocument()
    spy.mockRestore()
  })
})

describe('StudyPage: la tarjeta (BR-01, BR-02, RF-02, RF-32)', () => {
  it('frente: inglés con lang="en", instrucción y sin botones de respuesta (EC-06)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [['Apple', 'manzana']])
    const card = await start(app, deck.id)
    expect(card).toHaveAccessibleName('Tarjeta: Apple. Pulsa para ver la traducción')
    expect(card).toHaveAttribute('aria-pressed', 'false')
    expect(within(card).getByText('Apple')).toHaveAttribute('lang', 'en')
    expect(
      within(card).getByText('Toca o pulsa Espacio para ver la traducción'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Acerté' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'No acerté' })).not.toBeInTheDocument()
    await waitFor(() => expect(card).toHaveFocus())
    expect(await app.db.progressEvents.count()).toBe(0)
  })

  it('voltear muestra el español con ejemplo y nota, cambia el nombre, anuncia y enfoca "Acerté" (EC-?)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [['Apple', 'manzana']], {
      example: 'An apple a day',
      note: 'fruta',
    })
    const card = await start(app, deck.id)
    await userEvent.setup().click(card)

    expect(card).toHaveAccessibleName('Traducción: manzana')
    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(within(card).getByText('manzana')).toBeInTheDocument()
    expect(within(card).getByText('An apple a day')).toBeInTheDocument()
    expect(within(card).getByText('fruta')).toBeInTheDocument()
    const hit = await screen.findByRole('button', { name: 'Acerté' })
    await waitFor(() => expect(hit).toHaveFocus())
    expect(screen.getByRole('button', { name: 'No acerté' })).toBeInTheDocument()
    const live = screen.getAllByRole('status').find((s) => s.textContent?.includes('Traducción'))
    expect(live).toHaveTextContent('Traducción: manzana. Ejemplo: An apple a day. Nota: fruta')
  })

  it('se voltea con el teclado (Espacio y Enter) y se responde sin ratón', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [['Apple', 'manzana']])
    await start(app, deck.id)
    const user = userEvent.setup()
    await user.keyboard(' ')
    const hit = await screen.findByRole('button', { name: 'Acerté' })
    expect(hit).toHaveFocus()
    await user.keyboard('{Enter}')
    await waitFor(async () => expect(await app.db.progressEvents.count()).toBe(1))
  })

  it('con la cara frontal visible solo la frontal está expuesta; al voltear, la trasera', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [['Apple', 'manzana']])
    const card = await start(app, deck.id)
    const faces = card.querySelectorAll('.flip-face')
    expect(faces[0]).not.toHaveAttribute('aria-hidden')
    expect(faces[1]).toHaveAttribute('aria-hidden', 'true')
    await userEvent.setup().click(card)
    expect(faces[0]).toHaveAttribute('aria-hidden', 'true')
    expect(faces[1]).not.toHaveAttribute('aria-hidden')
  })
})

describe('StudyPage: aciertos, fallos y fin (BR-03, BR-04, BR-07, BR-08)', () => {
  it('EC-07, EC-11, EC-46: con una palabra se repite hasta 3 aciertos seguidos y termina con resumen', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck, ids } = await deckWith(app, [['Apple', 'manzana']])
    await start(app, deck.id)
    const user = userEvent.setup()

    await answer(user, true)
    expect(await screen.findByText('Aciertos seguidos: 1 de 3')).toBeInTheDocument()
    expect(screen.getByText('¡Acierto!')).toBeInTheDocument()
    await answer(user, true)
    expect(await screen.findByText('Aciertos seguidos: 2 de 3')).toBeInTheDocument()
    await answer(user, true)

    const title = await screen.findByRole('heading', { name: '¡Sesión terminada!' })
    await waitFor(() => expect(title).toHaveFocus())
    expect(screen.getByText('Aciertos: 3')).toBeInTheDocument()
    expect(screen.getByText('Fallos: 0')).toBeInTheDocument()
    await waitFor(async () =>
      expect(await app.db.deckWords.get([deck.id, ids[0]])).toMatchObject({
        status: 'learned',
        consecutiveHits: 3,
      }),
    )
    expect(await app.db.progressEvents.count()).toBe(3)
  })

  it('EC-08: un fallo reinicia el contador y la palabra sigue pendiente', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck, ids } = await deckWith(app, [['Apple', 'manzana']])
    await start(app, deck.id)
    const user = userEvent.setup()
    await answer(user, true)
    await answer(user, true)
    await answer(user, false)
    expect(await screen.findByText('Aciertos seguidos: 0 de 3')).toBeInTheDocument()
    expect(screen.getByText('No acertaste. Vuelve en la siguiente ronda.')).toBeInTheDocument()
    await waitFor(async () =>
      expect(await app.db.deckWords.get([deck.id, ids[0]])).toMatchObject({
        status: 'pending',
        consecutiveHits: 0,
      }),
    )
  })

  it('al llegar a 3 se anuncia "¡Aprendida!" y sale de las pendientes (EC-07)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [
      ['Apple', 'manzana'],
      ['Bread', 'pan'],
    ])
    await start(app, deck.id)
    const user = userEvent.setup()
    const first = shownWord()!
    let learnedSeen = false
    for (let i = 0; i < 40 && !learnedSeen; i++) {
      const word = shownWord()
      await answer(user, word === first)
      learnedSeen = !!screen.queryByText(`«${first}»: ¡Aprendida!`)
      if (screen.queryByRole('heading', { name: '¡Sesión terminada!' })) break
    }
    expect(learnedSeen || !!screen.queryByText('Pendientes: 1')).toBe(true)
  })

  it('EC-12: con 2 o más pendientes nunca se muestra la misma tarjeta dos veces seguidas', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [
      ['Apple', 'manzana'],
      ['Bread', 'pan'],
      ['Cat', 'gato'],
    ])
    await start(app, deck.id)
    const user = userEvent.setup()
    const seen: string[] = []
    for (let i = 0; i < 9; i++) {
      seen.push(shownWord()!)
      await answer(user, false) // siempre fallar: las 3 siguen pendientes
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1])
    expect(new Set(seen.slice(0, 3)).size).toBe(3) // una pasada = cada tarjeta una vez
    expect(await screen.findByText('Pendientes: 3')).toBeInTheDocument()
  })

  it('EC-53: responder rápido no se bloquea y todas las respuestas quedan guardadas en orden', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [
      ['Apple', 'manzana'],
      ['Bread', 'pan'],
    ])
    await start(app, deck.id)
    const user = userEvent.setup({ delay: null })
    for (let i = 0; i < 6; i++) await answer(user, i % 2 === 0)
    await waitFor(async () => expect(await app.db.progressEvents.count()).toBe(6))
    const orders = (await app.db.progressEvents.orderBy('localOrder').toArray()).map((e) => e.hit)
    expect(orders).toEqual([true, false, true, false, true, false])
  })

  it('funciona sin conexión y deja todo en la cola de salida (RF-28, EC-30)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos', online: false })
    const { deck } = await deckWith(app, [['Apple', 'manzana']])
    await start(app, deck.id)
    await answer(userEvent.setup(), true)
    expect(await screen.findByText('Aciertos seguidos: 1 de 3')).toBeInTheDocument()
    await waitFor(async () => {
      const types = (await app.repos.outbox.all()).map((o) => o.type)
      expect(types).toContain('progress.record')
    })
  })

  it('"Salir" vuelve a los mazos sin pedir confirmación; el progreso ya está guardado (BR-06)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [['Apple', 'manzana']])
    await start(app, deck.id)
    const user = userEvent.setup()
    await answer(user, true)
    await user.click(screen.getByRole('link', { name: 'Salir' }))
    expect(await screen.findByRole('heading', { name: 'Mazos', level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(await app.db.progressEvents.count()).toBe(1)
  })
})

describe('StudyPage: imagen según preferencia (BR-10, RF-12, RF-14)', () => {
  const imageUrl = 'https://ejemplo.invalid/manzana.png'
  const defaults = { theme: 'white', backgroundPalette: 'neutral', cardPalette: 'neutral' } as const

  it('valor inicial: solo en el reverso (EC-04)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [['Apple', 'manzana']], { imageUrl })
    const card = await start(app, deck.id)
    expect(card.querySelector('.flip-face-front img')).toBeNull()
    expect(card.querySelector('.flip-face-back img')).not.toBeNull()
  })

  it.each([
    ['front', true, false],
    ['both', true, true],
  ] as const)('imageSide=%s', async (side, front, back) => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    await app.repos.preferences.update({ imageSide: side }, defaults)
    const { deck } = await deckWith(app, [['Apple', 'manzana']], { imageUrl })
    const card = await start(app, deck.id)
    await waitFor(() => expect(!!card.querySelector('.flip-face-front img')).toBe(front))
    expect(!!card.querySelector('.flip-face-back img')).toBe(back)
  })

  it('EC-05: si la imagen no carga, la tarjeta se estudia con normalidad y sin error', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [['Apple', 'manzana']], { imageUrl })
    const card = await start(app, deck.id)
    const img = card.querySelector('.flip-face-back img')!
    fireEvent.error(img)
    expect(card.querySelector('img')).toBeNull()
    expect(screen.queryByRole('alert')?.textContent ?? '').toBe('')
    await userEvent.setup().click(card)
    expect(await screen.findByRole('button', { name: 'Acerté' })).toBeInTheDocument()
  })
})

describe('StudyPage: accesibilidad', () => {
  it('axe: sin violaciones en el frente, el reverso y el final', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [['Apple', 'manzana']], { example: 'An apple', note: 'n' })
    const card = await start(app, deck.id)
    expect(await axeViolations(document.body)).toEqual([])
    const user = userEvent.setup()
    await user.click(card)
    await user.click(await screen.findByRole('button', { name: 'Acerté' }))
    expect(await axeViolations(document.body)).toEqual([])
    await answer(user, true)
    await answer(user, true)
    await screen.findByRole('heading', { name: '¡Sesión terminada!' })
    expect(await axeViolations(document.body)).toEqual([])
  })
})

describe('StudyPage: casos críticos del plan (NEC-07, NEC-14, NEC-17)', () => {
  it('NEC-07: un doble toque en "Acerté" cuenta un solo acierto', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [['Apple', 'manzana']])
    const card = await start(app, deck.id)
    const user = userEvent.setup({ delay: null })
    await user.click(card)
    await user.dblClick(await screen.findByRole('button', { name: 'Acerté' }))
    await waitFor(async () => expect(await app.db.progressEvents.count()).toBeGreaterThan(0))
    await new Promise((r) => setTimeout(r, 200))
    expect(await app.db.progressEvents.count()).toBe(1)
    expect(screen.getByText('Aciertos seguidos: 1 de 3')).toBeInTheDocument()
  })

  it('NEC-14: si la palabra en pantalla se borra durante la sesión, se pasa a otra sin error', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck } = await deckWith(app, [
      ['Apple', 'manzana'],
      ['Bread', 'pan'],
    ])
    await start(app, deck.id)
    const shown = shownWord()!
    const other = shown === 'Apple' ? 'Bread' : 'Apple'
    const toDelete = (await app.repos.words.list()).find((w) => w.english === shown)!
    await app.repos.words.delete(toDelete.id)

    expect(
      await screen.findByRole('button', { name: new RegExp(`^Tarjeta: ${other}`) }),
    ).toBeInTheDocument()
    expect(screen.getByText('Pendientes: 1')).toBeInTheDocument()
    expect(screen.queryByText(/No se pudo guardar/)).not.toBeInTheDocument()
  })

  it('NEC-14: si se quitan todas las palabras del mazo, la sesión termina con el aviso de mazo vacío', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { deck, ids } = await deckWith(app, [['Apple', 'manzana']])
    await start(app, deck.id)
    await app.repos.deckWords.remove(deck.id, ids[0])
    expect(
      await screen.findByRole('heading', { name: 'Este mazo no tiene palabras', level: 2 }),
    ).toBeInTheDocument()
  })

  it('NEC-17: el texto de la palabra nunca se interpreta como HTML y admite textos largos y unicode', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const html = '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>'
    const long = 'ñandú '.repeat(1700) // > 10 000 caracteres
    const { deck } = await deckWith(app, [[html, `canción ${long}😀`]])
    const card = await start(app, deck.id)
    expect(within(card).getByText(html)).toBeInTheDocument()
    await userEvent.setup().click(card)
    expect(within(card).getByText(/canción ñandú/)).toBeInTheDocument()
    expect(card.querySelector('script')).toBeNull()
    expect(card.querySelector('img[onerror]')).toBeNull()
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined()
  })
})
