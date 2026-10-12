// Progreso (Fase 9): HU-11; EC-32 a EC-34, EC-47; BR-09, BR-38.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeViolations } from '../../test/axe'
import { openApp } from '../../test/appHarness'

type App = Awaited<ReturnType<typeof openApp>>

async function seed(app: App) {
  const a = await app.repos.decks.create('Mazo A')
  const b = await app.repos.decks.create('Mazo B')
  const mk = async (english: string, spanish: string) =>
    (await app.repos.words.create({ english, spanish })).word
  const apple = await mk('Apple', 'manzana')
  const bread = await mk('Bread', 'pan')
  const cat = await mk('Cat', 'gato')
  await mk('Dog', 'perro') // sin mazo: no tiene progreso
  for (const w of [apple, bread, cat]) await app.repos.deckWords.add(a.id, w.id)
  await app.repos.deckWords.add(b.id, apple.id)
  for (let i = 0; i < 3; i++) {
    await app.repos.progress.record(a.id, apple.id, true)
    await app.repos.progress.record(b.id, apple.id, true)
  }
  await app.repos.progress.record(a.id, bread.id, true)
  return { a, b, apple, bread, cat }
}

afterEach(() => vi.restoreAllMocks())

describe('ProgressPage: estados', () => {
  it('sin mazos: invita a crear uno', async () => {
    const app = await openApp('/progreso', { heading: 'Progreso' })
    await app.render()
    expect(await screen.findByText('Crea un mazo para ver tu progreso.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a mazos' })).toHaveAttribute('href', '/mazos')
  })

  it('mazo sin palabras', async () => {
    const app = await openApp('/progreso', { heading: 'Progreso' })
    await app.repos.decks.create('Vacío')
    await app.render()
    expect(await screen.findByText('Este mazo no tiene palabras.')).toBeInTheDocument()
  })

  it('error de carga con "Reintentar"', async () => {
    const app = await openApp('/progreso', { heading: 'Progreso' })
    await seed(app)
    const spy = vi.spyOn(app.db.deckWords, 'toArray').mockRejectedValue(new Error('x'))
    await app.render()
    expect(await screen.findByText('No se pudo cargar el progreso.')).toBeInTheDocument()
    spy.mockRestore()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Pendientes: 2')).toBeInTheDocument()
  })
})

describe('ProgressPage: contadores y listas (RF-26, BR-38)', () => {
  it('EC-32: contadores por mazo, barra con valor textual y listas por estado', async () => {
    const app = await openApp('/progreso', { heading: 'Progreso' })
    await seed(app)
    await app.render()
    expect(await screen.findByText('Pendientes: 2')).toBeInTheDocument()
    expect(screen.getByText('Aprendidas: 1')).toBeInTheDocument()
    const bar = screen.getByRole('progressbar', { name: 'Avance del mazo' })
    expect(bar).toHaveAttribute('aria-valuenow', '33')
    expect(bar).toHaveAttribute('aria-valuetext', '33 % aprendidas (1 de 3)')
    expect(screen.getByText('33 % aprendidas (1 de 3)')).toBeInTheDocument()

    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByText('Bread')).toBeInTheDocument()
    expect(within(panel).getByText('Aciertos seguidos: 1 de 3')).toBeInTheDocument()
    expect(within(panel).getByText('Aciertos seguidos: 0 de 3')).toBeInTheDocument()
    expect(within(panel).queryByText('Apple')).not.toBeInTheDocument()
    expect(within(panel).queryByText('Dog')).not.toBeInTheDocument() // sin mazo: sin progreso
  })

  it('pestaña Aprendidas: lista las aprendidas con "Reactivar"; vacía muestra su mensaje', async () => {
    const app = await openApp('/progreso', { heading: 'Progreso' })
    await seed(app)
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('tab', { name: 'Aprendidas (1)' }))
    expect(within(screen.getByRole('tabpanel')).getByText('Apple')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reactivar «Apple»' })).toBeInTheDocument()
  })

  it('las flechas cambian de pestaña', async () => {
    const app = await openApp('/progreso', { heading: 'Progreso' })
    await seed(app)
    await app.render()
    const user = userEvent.setup()
    const pendingTab = await screen.findByRole('tab', { name: /Pendientes/ })
    pendingTab.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /Aprendidas/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('EC-47: una palabra en dos mazos cuenta en cada uno con su propio estado; el selector cambia de mazo', async () => {
    const app = await openApp('/progreso', { heading: 'Progreso' })
    const { b } = await seed(app)
    await app.render()
    const user = userEvent.setup()
    expect(await screen.findByText('Aprendidas: 1')).toBeInTheDocument() // A: Apple aprendida
    await user.selectOptions(screen.getByLabelText('Mazo'), b.id)
    expect(await screen.findByText('Pendientes: 0')).toBeInTheDocument()
    expect(screen.getByText('Aprendidas: 1')).toBeInTheDocument() // B: Apple aprendida también
    expect(screen.getByText('100 % aprendidas (1 de 1)')).toBeInTheDocument()
    expect(screen.getByText('No quedan palabras pendientes.')).toBeInTheDocument()
  })

  it('?deck= elige el mazo (enlace desde el fin de sesión)', async () => {
    const app = await openApp('/progreso', { heading: 'Progreso' })
    const { b } = await seed(app)
    await app.render(`/progreso?deck=${b.id}`)
    expect(await screen.findByLabelText('Mazo')).toHaveValue(b.id)
  })
})

describe('ProgressPage: reactivar (RF-27, BR-09)', () => {
  it('EC-33, EC-34: vuelve a pendientes con contador 0, solo en ese mazo, y se anuncia', async () => {
    const app = await openApp('/progreso', { heading: 'Progreso' })
    const { a, b, apple } = await seed(app)
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('tab', { name: 'Aprendidas (1)' }))
    await user.click(screen.getByRole('button', { name: 'Reactivar «Apple»' }))

    expect(await screen.findByText('«Apple» vuelve a pendientes de «Mazo A».')).toBeInTheDocument()
    expect(await screen.findByText('Aprendidas: 0')).toBeInTheDocument()
    expect(screen.getByText('Pendientes: 3')).toBeInTheDocument()
    expect(await app.db.deckWords.get([a.id, apple.id])).toMatchObject({
      status: 'pending',
      consecutiveHits: 0,
    })
    expect((await app.db.deckWords.get([b.id, apple.id]))?.status).toBe('learned')
    await waitFor(() => expect(screen.getByRole('tabpanel')).toHaveFocus())
    await user.click(screen.getByRole('tab', { name: 'Pendientes (3)' }))
    expect(within(screen.getByRole('tabpanel')).getByText('Apple')).toBeInTheDocument()
  })
})

describe('ProgressPage: accesibilidad', () => {
  it('axe: sin violaciones', async () => {
    const app = await openApp('/progreso', { heading: 'Progreso' })
    await seed(app)
    await app.render()
    await screen.findByText('Pendientes: 2')
    expect(await axeViolations(document.body)).toEqual([])
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Aprendidas (1)' }))
    expect(await axeViolations(document.body)).toEqual([])
  })
})
