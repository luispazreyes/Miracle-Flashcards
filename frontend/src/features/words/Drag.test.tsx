// Arrastre y depósito (Fase 12): HU-17; EC-56 a EC-59; BR-27 a BR-30. La animación en sí no es verificable en
// jsdom: se valida a mano y en Playwright (Fase 14). Aquí se prueban el flujo, los estados y los avisos.
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { openApp } from '../../test/appHarness'

type App = Awaited<ReturnType<typeof openApp>>

async function seed(app: App) {
  const a = await app.repos.decks.create('Mazo A')
  const b = await app.repos.decks.create('Mazo B')
  const mk = async (english: string, spanish: string) =>
    (await app.repos.words.create({ english, spanish })).word
  const apple = await mk('Apple', 'manzana')
  const dog = await mk('Dog', 'perro')
  const cat = await mk('Cat', 'gato')
  await app.repos.deckWords.add(a.id, apple.id)
  return { a, b, apple, dog, cat }
}

const rowOf = (english: string) =>
  screen.getByText(english, { selector: 'p' }).closest('li') as HTMLElement
const handleOf = (english: string) =>
  rowOf(english).querySelector('[data-drag-handle]') as HTMLElement
const deckItem = (id: string) => document.querySelector(`[data-deck-id="${id}"]`) as HTMLElement

/** Simula el recorrido del puntero: baja en el asa, se mueve y suelta. */
function pointer(type: 'down' | 'move' | 'up', x: number, y: number, el?: Element | Window) {
  const target = (el ?? window) as Element
  const init = { pointerId: 1, clientX: x, clientY: y, button: 0, bubbles: true }
  if (type === 'down') fireEvent.pointerDown(target, init)
  else if (type === 'move') fireEvent.pointerMove(target, init)
  else fireEvent.pointerUp(target, init)
}

/** jsdom no implementa elementsFromPoint: se sustituye por un mazo concreto (o ninguno). */
function overDeck(item: HTMLElement | null) {
  Object.defineProperty(document, 'elementsFromPoint', {
    configurable: true,
    value: () => (item ? [item, document.body] : [document.body]),
  })
}

/** Los tokens de motion no se cargan en jsdom: se fijan a mano (300 ms; 0.01 ms = movimiento reducido). */
const setDeposit = (value: string) =>
  document.documentElement.style.setProperty('--mov-deposito', value)
beforeEach(() => setDeposit('5s')) // largo: la carga de CI no debe vencer el pulso antes de comprobarlo

afterEach(() => {
  document.documentElement.style.removeProperty('--mov-deposito')
  Reflect.deleteProperty(document, 'elementsFromPoint')
  vi.unstubAllGlobals()
})

async function setup(online = true) {
  const app = await openApp('/mazos', { heading: 'Mazos', online })
  const data = await seed(app)
  await app.render()
  await screen.findByText('Dog', { selector: 'p' })
  return { app, ...data }
}

describe('Arrastre de palabras a mazos (RF-18, RF-45)', () => {
  it('BR-27: la ficha sigue al puntero, el mazo bajo ella se resalta con texto y la fila de origen se atenúa', async () => {
    const { b } = await setup()
    const target = deckItem(b.id)
    overDeck(target)
    pointer('down', 10, 10, handleOf('Dog'))
    pointer('move', 12, 12) // bajo el umbral: aún no es un arrastre
    expect(screen.queryByText('Suelta aquí')).not.toBeInTheDocument()

    pointer('move', 200, 80)
    expect(
      await screen.findByText('Arrastrando «Dog». Suéltala sobre un mazo.'),
    ).toBeInTheDocument()
    const chip = document.body.querySelector('[data-drag-chip]') as HTMLElement
    expect(chip).toHaveTextContent('Dog')
    expect(chip).toHaveAttribute('aria-hidden', 'true')
    expect(chip.style.transform).toBe('translate(200px, 80px)')
    expect(within(target).getByText('Suelta aquí')).toBeInTheDocument() // texto, no solo color
    expect(rowOf('Dog')).toHaveClass('opacity-50')

    pointer('move', 220, 90)
    expect(chip.style.transform).toBe('translate(220px, 90px)')
    pointer('up', 220, 90)
    await waitFor(() => expect(document.body.querySelector('[data-drag-chip]')).toBeNull())
  })

  it('BR-27: soltar sobre un mazo agrega la palabra, avisa, pulsa el mazo y limpia el estado (EC-59)', async () => {
    const { app, b, dog } = await setup()
    overDeck(deckItem(b.id))
    pointer('down', 10, 10, handleOf('Dog'))
    pointer('move', 200, 80)
    pointer('up', 200, 80)

    expect(await screen.findByText('«Dog» agregada a «Mazo B».')).toBeInTheDocument()
    expect(await app.db.deckWords.get([b.id, dog.id])).toBeDefined()
    expect(deckItem(b.id).querySelector('.anim-pulso-anillo')).not.toBeNull()
    await waitFor(() => expect(screen.queryByText('Suelta aquí')).not.toBeInTheDocument())
    expect(rowOf('Dog')).not.toHaveClass('opacity-50')
  })

  it('BR-28: soltar fuera de un mazo no cambia nada y se anuncia (EC-56)', async () => {
    const { app } = await setup()
    overDeck(null)
    const before = await app.db.deckWords.count()
    pointer('down', 10, 10, handleOf('Dog'))
    pointer('move', 300, 300)
    pointer('up', 300, 300)
    expect(
      await screen.findByText('Arrastre cancelado. «Dog» no cambió de mazo.'),
    ).toBeInTheDocument()
    expect(await app.db.deckWords.count()).toBe(before)
    expect(screen.queryByText(/agregada a/)).not.toBeInTheDocument()
  })

  it('BR-28: Escape cancela el arrastre', async () => {
    const { app, b } = await setup()
    overDeck(deckItem(b.id))
    const before = await app.db.deckWords.count()
    pointer('down', 10, 10, handleOf('Dog'))
    pointer('move', 200, 80)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(
      await screen.findByText('Arrastre cancelado. «Dog» no cambió de mazo.'),
    ).toBeInTheDocument()
    pointer('up', 200, 80) // el arrastre ya terminó: soltar después no agrega
    expect(await app.db.deckWords.count()).toBe(before)
    await waitFor(() => expect(document.body.querySelector('[data-drag-chip]')).toBeNull())
  })

  it('BR-28, EC-56: un duplicado devuelve la palabra y avisa; no se duplica en el mazo', async () => {
    const { app, a } = await setup()
    overDeck(deckItem(a.id))
    pointer('down', 10, 10, handleOf('Apple'))
    pointer('move', 200, 80)
    pointer('up', 200, 80)
    expect(await screen.findByText('«Apple» ya está en este mazo.')).toBeInTheDocument()
    expect(await app.db.deckWords.where('deckId').equals(a.id).count()).toBe(1)
    await waitFor(() => expect(document.body.querySelector('[data-drag-chip]')).toBeNull())
  })

  it('arrastres consecutivos no pierden ninguna palabra', async () => {
    const { app, b, dog, cat } = await setup()
    overDeck(deckItem(b.id))
    for (const word of ['Dog', 'Cat']) {
      pointer('down', 10, 10, handleOf(word))
      pointer('move', 200, 80)
      pointer('up', 200, 80)
      await screen.findByText(`«${word}» agregada a «Mazo B».`)
      await waitFor(() => expect(document.body.querySelector('[data-drag-chip]')).toBeNull())
    }
    expect(await app.db.deckWords.get([b.id, dog.id])).toBeDefined()
    expect(await app.db.deckWords.get([b.id, cat.id])).toBeDefined()
  })

  it('BR-30, EC-57: sin conexión se puede arrastrar y el cambio queda en la cola', async () => {
    const { app, b } = await setup(false)
    overDeck(deckItem(b.id))
    pointer('down', 10, 10, handleOf('Dog'))
    pointer('move', 200, 80)
    pointer('up', 200, 80)
    await screen.findByText('«Dog» agregada a «Mazo B».')
    const types = (await app.repos.outbox.all()).map((o) => o.type)
    expect(types.at(-1)).toBe('deckWord.add')
    expect(app.services.isOnline()).toBe(false)
  })

  it('en pantallas estrechas no hay asa: solo el menú (WCAG 2.5.1)', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const app = await openApp('/mazos', { heading: 'Mazos' })
    await seed(app)
    await app.render()
    await userEvent.setup().click(await screen.findByRole('tab', { name: 'Palabras' }))
    await screen.findByText('Dog', { selector: 'p' })
    expect(document.querySelector('[data-drag-handle]')).toBeNull()
    expect(screen.getByRole('button', { name: 'Agregar «Dog» a un mazo' })).toBeInTheDocument()
  })
})

describe('Movimiento reducido (EC-58)', () => {
  it('el cambio es instantáneo, sin pulso, y se anuncia igualmente', async () => {
    setDeposit('0.01ms')
    const { app, b, dog } = await setup()
    overDeck(deckItem(b.id))
    pointer('down', 10, 10, handleOf('Dog'))
    pointer('move', 200, 80)
    pointer('up', 200, 80)
    expect(await screen.findByText('«Dog» agregada a «Mazo B».')).toBeInTheDocument()
    expect(await app.db.deckWords.get([b.id, dog.id])).toBeDefined()
    expect(document.querySelector('.anim-pulso-anillo')).toBeNull()
  })
})

describe('Agregar con el menú: depósito breve (BR-29, EC-58)', () => {
  it('pulsa el mazo y la fila y se anuncia el cambio', async () => {
    const { app, b, dog } = await setup()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Agregar «Dog» a un mazo' }))
    await user.click(screen.getByRole('option', { name: 'Mazo B' }))
    expect(await screen.findByText('«Dog» agregada a «Mazo B».')).toBeInTheDocument()
    expect(await app.db.deckWords.get([b.id, dog.id])).toBeDefined()
    expect(deckItem(b.id).querySelector('.anim-pulso-anillo')).not.toBeNull()
    expect(rowOf('Dog').querySelector('.anim-pulso-anillo')).not.toBeNull()
    await act(async () => {})
  })
})
