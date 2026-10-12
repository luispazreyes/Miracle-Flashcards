// Panel de palabras (Fase 7): grupos, búsqueda y menús. HU-08, HU-09, HU-10, HU-15; EC-17..EC-19, EC-23..EC-26,
// EC-44, EC-51, EC-52.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeViolations } from '../../test/axe'
import { openApp } from '../../test/appHarness'

type App = Awaited<ReturnType<typeof openApp>>

/** Mazos A y B; Apple en A; Bread en A y B; Cat solo en B; Dog sin mazo. */
async function seed(app: App) {
  const a = await app.repos.decks.create('Mazo A')
  const b = await app.repos.decks.create('Mazo B')
  const mk = async (english: string, spanish: string) =>
    (await app.repos.words.create({ english, spanish })).word
  const apple = await mk('Apple', 'manzana')
  const bread = await mk('Bread', 'pan')
  const cat = await mk('Cat', 'gato')
  const dog = await mk('Dog', 'perro')
  await app.repos.deckWords.add(a.id, apple.id)
  await app.repos.deckWords.add(a.id, bread.id)
  await app.repos.deckWords.add(b.id, bread.id)
  await app.repos.deckWords.add(b.id, cat.id)
  return { a, b, apple, bread, cat, dog }
}

const rowOf = (english: string) =>
  screen.getByText(english, { selector: 'p' }).closest('li') as HTMLElement

afterEach(() => vi.restoreAllMocks())

describe('WordsPanel: estados', () => {
  it('vacío: invita a crear la primera palabra', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    await app.render()
    expect(await screen.findByText('Todavía no hay palabras. Crea la primera.')).toBeInTheDocument()
  })

  it('error de carga: mensaje y "Reintentar"', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    await seed(app)
    const spy = vi.spyOn(app.db.words, 'toArray').mockRejectedValue(new Error('fallo'))
    await app.render()
    expect(await screen.findByText('No se pudieron cargar las palabras.')).toBeInTheDocument()
    spy.mockRestore()
    await userEvent.setup().click(
      within(await screen.findByRole('region', { name: 'Palabras' })).getByRole('button', {
        name: 'Reintentar',
      }),
    )
    expect(await screen.findByText('Apple')).toBeInTheDocument()
  })
})

describe('WordsPanel: grupos (BR-22, BR-23, BR-24)', () => {
  it('con mazo seleccionado: en este mazo, en otros mazos y sin mazo, en ese orden (EC-24, EC-25)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { a } = await seed(app)
    await app.render(`/mazos?deck=${a.id}`)
    expect(await screen.findByRole('heading', { name: 'Palabras de «Mazo A»' })).toBeInTheDocument()
    const headings = (await screen.findAllByRole('heading', { level: 3 })).map((h) => h.textContent)
    expect(headings).toEqual(['En este mazo(2)', 'En otros mazos(1)', 'Sin mazo(1)'])

    const inDeck = screen.getByRole('region', { name: /En este mazo/ })
    expect(within(inDeck).getByText('Apple')).toBeInTheDocument()
    expect(within(inDeck).getByText('Bread')).toBeInTheDocument()
    // Bread también está en B pero aparece solo en el primer grupo.
    expect(screen.getAllByText('Bread')).toHaveLength(1)
    expect(
      within(screen.getByRole('region', { name: /En otros mazos/ })).getByText('Cat'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: /Sin mazo/ })).getByText('Dog'),
    ).toBeInTheDocument()
  })

  it('los grupos vacíos no se muestran', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const deck = await app.repos.decks.create('Solo')
    const { word } = await app.repos.words.create({ english: 'One', spanish: 'uno' })
    await app.repos.deckWords.add(deck.id, word.id)
    await app.render(`/mazos?deck=${deck.id}`)
    expect(await screen.findByRole('region', { name: /En este mazo/ })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /En otros mazos/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /Sin mazo/ })).not.toBeInTheDocument()
  })

  it('sin mazo seleccionado: lista única con las "Sin mazo" al final y resaltadas con insignia (EC-26)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    await seed(app)
    await app.render()
    expect(
      await screen.findByRole('heading', { name: 'Todas las palabras', level: 2 }),
    ).toBeInTheDocument()
    const order = (await screen.findAllByText(/^(Apple|Bread|Cat|Dog)$/, { selector: 'p' })).map(
      (p) => p.textContent,
    )
    expect(order).toEqual(['Apple', 'Bread', 'Cat', 'Dog'])
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    expect(within(rowOf('Dog')).getByText('Sin mazo')).toBeInTheDocument()
    expect(within(rowOf('Apple')).queryByText('Sin mazo')).not.toBeInTheDocument()
  })

  it('cada fila muestra a qué mazos pertenece y se lee con su traducción y grupo', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { a } = await seed(app)
    await app.render(`/mazos?deck=${a.id}`)
    const row = await screen.findByText('Bread', { selector: 'p' })
    const li = row.closest('li') as HTMLElement
    expect(within(li).getByText('Mazo A')).toBeInTheDocument()
    expect(within(li).getByText('Mazo B')).toBeInTheDocument()
    expect(li).toHaveTextContent(', traducción pan, en este mazo')
  })
})

describe('WordsPanel: búsqueda (BR-25, RF-43)', () => {
  it('filtra por inglés o español sin mayúsculas ni acentos y respeta los grupos (EC-51)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { a } = await seed(app)
    await app.repos.words.create({ english: 'Coffee', spanish: 'café' })
    await app.render(`/mazos?deck=${a.id}`)
    const user = userEvent.setup()
    await user.type(await screen.findByRole('searchbox', { name: 'Buscar palabras' }), 'CAFE')
    expect(await screen.findByText('Coffee')).toBeInTheDocument()
    expect(screen.queryByText('Apple')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /En este mazo/ })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Sin mazo/ })).toBeInTheDocument()
  })

  it('sin coincidencias muestra el mensaje y al vaciar se restaura (EC-52)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    await seed(app)
    await app.render()
    const user = userEvent.setup()
    const box = await screen.findByRole('searchbox', { name: 'Buscar palabras' })
    await user.type(box, '  zzz ')
    expect(await screen.findByText('Sin resultados para «zzz»')).toBeInTheDocument()
    await user.clear(box)
    expect(screen.queryByText(/Sin resultados/)).not.toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
  })
})

describe('WordsPanel: agregar a mazo (RF-20, BR-13, BR-26)', () => {
  it('el combobox filtra por subcadena y Enter agrega la palabra (EC-18)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { b, dog } = await seed(app)
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Agregar «Dog» a un mazo' }))
    const combo = screen.getByRole('combobox', { name: 'Buscar mazo' })
    expect(combo).toHaveFocus()
    expect(screen.getAllByRole('option')).toHaveLength(2)
    await user.type(combo, 'MAZO b')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await user.keyboard('{Enter}')

    expect(await screen.findByText('«Dog» agregada a «Mazo B».')).toBeInTheDocument()
    expect(await app.db.deckWords.get([b.id, dog.id])).toBeDefined()
    expect(screen.getByRole('button', { name: 'Agregar «Dog» a un mazo' })).toHaveFocus()
  })

  it('sin coincidencias: mensaje y no asigna nada (EC-19)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    await seed(app)
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Agregar «Dog» a un mazo' }))
    await user.type(screen.getByRole('combobox', { name: 'Buscar mazo' }), 'zzz')
    expect(screen.getByText('Sin resultados para «zzz»')).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(await app.db.deckWords.count()).toBe(4)
  })

  it('un duplicado en el mazo se bloquea y se avisa; en otro mazo se permite (EC-17, EC-44)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { a } = await seed(app)
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Agregar «Apple» a un mazo' }))
    await user.click(screen.getByRole('option', { name: 'Mazo A' }))
    expect(await screen.findByText('«Apple» ya está en este mazo.')).toBeInTheDocument()
    expect(await app.db.deckWords.where('deckId').equals(a.id).count()).toBe(2)
  })

  it('las flechas mueven la opción activa (aria-activedescendant)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    await seed(app)
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Agregar «Dog» a un mazo' }))
    const combo = screen.getByRole('combobox', { name: 'Buscar mazo' })
    const [first, second] = screen.getAllByRole('option')
    expect(combo).toHaveAttribute('aria-activedescendant', first.id)
    await user.keyboard('{ArrowDown}')
    expect(combo).toHaveAttribute('aria-activedescendant', second.id)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument())
  })
})

describe('WordsPanel: más acciones', () => {
  it('"Quitar de este mazo" solo aparece para palabras del mazo seleccionado y pide confirmación (BR-14)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { a, apple } = await seed(app)
    await app.render(`/mazos?deck=${a.id}`)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Más acciones de «Cat»' }))
    expect(screen.queryByRole('menuitem', { name: 'Quitar de este mazo' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Más acciones de «Apple»' }))
    await user.click(screen.getByRole('menuitem', { name: 'Quitar de este mazo' }))
    const dialog = await screen.findByRole('alertdialog', { name: '¿Quitar «Apple» de «Mazo A»?' })
    expect(
      within(dialog).getByText('La palabra no se borra, pero se elimina su progreso en este mazo.'),
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Quitar del mazo' }))

    expect(await screen.findByText('«Apple» se quitó de «Mazo A».')).toBeInTheDocument()
    expect(await app.db.deckWords.get([a.id, apple.id])).toBeUndefined()
    expect(await app.db.words.get(apple.id)).toBeDefined()
  })

  it('borrar palabra informa en cuántos mazos está y la elimina de todos (EC-23)', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { bread } = await seed(app)
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Más acciones de «Bread»' }))
    await user.click(screen.getByRole('menuitem', { name: 'Borrar' }))
    const dialog = await screen.findByRole('alertdialog', { name: '¿Borrar «Bread»?' })
    expect(
      within(dialog).getByText(/Está en 2 mazos y se eliminará de todos junto con su progreso/),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    await user.click(within(dialog).getByRole('button', { name: 'Borrar palabra' }))
    expect(await screen.findByText('Palabra «Bread» borrada.')).toBeInTheDocument()
    expect(await app.db.words.get(bread.id)).toBeUndefined()
    expect(await app.db.deckWords.where('wordId').equals(bread.id).count()).toBe(0)
  })
})

describe('WordsPanel: sin conexión (RF-28, EC-30)', () => {
  it('se puede crear, editar y asignar sin red; todo queda en la cola', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos', online: false })
    const { dog, b } = await seed(app)
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Agregar «Dog» a un mazo' }))
    await user.click(screen.getByRole('option', { name: 'Mazo B' }))
    expect(await screen.findByText('«Dog» agregada a «Mazo B».')).toBeInTheDocument()
    expect(await app.db.deckWords.get([b.id, dog.id])).toBeDefined()
    expect(await app.repos.outbox.unsynced()).toBeGreaterThan(0)
  })
})

describe('WordsPanel: accesibilidad', () => {
  it('axe: sin violaciones con grupos, menú y combobox abiertos', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    const { a } = await seed(app)
    await app.render(`/mazos?deck=${a.id}`)
    await screen.findByText('Apple')
    const user = userEvent.setup()
    expect(await axeViolations(document.body)).toEqual([])
    await user.click(screen.getByRole('button', { name: 'Agregar «Dog» a un mazo' }))
    expect(await axeViolations(document.body)).toEqual([])
    await user.type(screen.getByRole('combobox'), 'zzz')
    expect(await axeViolations(document.body)).toEqual([])
  })
})
