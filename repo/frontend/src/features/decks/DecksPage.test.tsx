// Mazos (Fase 6): HU-07, EC-20, EC-21, EC-22, EC-48, BR-19, BR-20, BR-21.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeViolations } from '../../test/axe'
import { openApp } from '../../test/appHarness'

const selectButton = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) })

async function setup(options: Parameters<typeof openApp>[1] = {}) {
  const app = await openApp('/mazos', { heading: 'Mazos', ...options })
  return app
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DecksPage: estados', () => {
  it('vacío: invita a crear el primer mazo y "Todas las palabras" está seleccionado', async () => {
    const app = await setup()
    await app.render()
    expect(await screen.findByText('Aún no tienes mazos. Crea el primero.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todas las palabras' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('error de carga: mensaje y "Reintentar" que recupera la lista', async () => {
    const app = await setup()
    await app.repos.decks.create('Mazo 1')
    const spy = vi.spyOn(app.db.decks, 'toArray').mockRejectedValue(new Error('fallo'))
    await app.render()
    expect(await screen.findByText('No se pudieron cargar los mazos.')).toBeInTheDocument()
    spy.mockRestore()
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Reintentar' })[0])
    expect(await screen.findByRole('button', { name: /^Mazo 1/ })).toBeInTheDocument()
  })

  it('lista los mazos con su número de palabras', async () => {
    const app = await setup()
    const deck = await app.repos.decks.create('Mazo 1')
    const { word } = await app.repos.words.create({ english: 'Apple', spanish: 'manzana' })
    await app.repos.deckWords.add(deck.id, word.id)
    await app.render()
    expect(await screen.findByText('1 palabra')).toBeInTheDocument()
  })
})

describe('DecksPage: crear, renombrar, seleccionar (RF-16, BR-19)', () => {
  it('crea un mazo, lo selecciona y avisa', async () => {
    const app = await setup()
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Nuevo mazo', hidden: false }))
    const input = screen.getByLabelText('Nombre del mazo')
    expect(input).toHaveFocus()
    await user.type(input, 'Verbos')
    expect(screen.getByText('6/60')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Crear mazo' }))

    expect(await screen.findByText('Mazo «Verbos» creado.')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /^Verbos/, current: true }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre del mazo')).not.toBeInTheDocument()
  })

  it('EC-48: vacío, más de 60 y duplicado (sin mayúsculas ni acentos) no se guardan y se explica por qué', async () => {
    const app = await setup()
    await app.repos.decks.create('Café')
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Nuevo mazo' }))
    const input = screen.getByLabelText('Nombre del mazo')

    await user.click(screen.getByRole('button', { name: 'Crear mazo' }))
    expect(await screen.findByText('Escribe un nombre para el mazo.')).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')

    await user.type(input, 'a'.repeat(61))
    expect(screen.getByText('61/60')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Crear mazo' }))
    expect(
      await screen.findByText('El nombre no puede pasar de 60 caracteres.'),
    ).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'CAFE')
    await user.click(screen.getByRole('button', { name: 'Crear mazo' }))
    expect(
      await screen.findByText('Ya tienes un mazo con ese nombre. Elige otro.'),
    ).toBeInTheDocument()
    expect(await app.repos.decks.list()).toHaveLength(1)
  })

  it('Esc cancela el formulario', async () => {
    const app = await setup()
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Nuevo mazo' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByLabelText('Nombre del mazo')).not.toBeInTheDocument()
  })

  it('renombra en línea desde el menú de acciones', async () => {
    const app = await setup()
    await app.repos.decks.create('Viejo')
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Más acciones de «Viejo»' }))
    await user.click(screen.getByRole('menuitem', { name: 'Renombrar' }))
    const input = screen.getByLabelText('Nombre del mazo')
    expect(input).toHaveValue('Viejo')
    await user.clear(input)
    await user.type(input, 'Nuevo')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('button', { name: /^Nuevo/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Viejo/ })).not.toBeInTheDocument()
  })

  it('seleccionar anuncia el mazo y marca aria-current (EC-20)', async () => {
    const app = await setup()
    await app.repos.decks.create('Mazo 1')
    await app.repos.decks.create('Mazo 2')
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /^Mazo 2/ }))
    await waitFor(() => expect(selectButton('Mazo 2')).toHaveAttribute('aria-current', 'true'))
    expect(selectButton('Mazo 1')).not.toHaveAttribute('aria-current')
    expect(screen.getByText('Mazo «Mazo 2» seleccionado.')).toBeInTheDocument()
  })

  it('las flechas arriba y abajo recorren la lista', async () => {
    const app = await setup()
    await app.repos.decks.create('Mazo 1')
    await app.repos.decks.create('Mazo 2')
    await app.render()
    const user = userEvent.setup()
    ;(await screen.findByRole('button', { name: 'Todas las palabras' })).focus()
    await screen.findByRole('button', { name: /^Mazo 2/ })
    await user.keyboard('{ArrowDown}')
    expect(selectButton('Mazo 1')).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(selectButton('Mazo 2')).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(selectButton('Mazo 1')).toHaveFocus()
  })
})

describe('DecksPage: borrar (RF-19, RF-24, BR-20)', () => {
  it('EC-21, EC-22: confirma, conserva las palabras y quedan "Sin mazo"', async () => {
    const app = await setup()
    const deck = await app.repos.decks.create('Mazo 1')
    const { word } = await app.repos.words.create({ english: 'Apple', spanish: 'manzana' })
    await app.repos.deckWords.add(deck.id, word.id)
    await app.render()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Más acciones de «Mazo 1»' }))
    await user.click(screen.getByRole('menuitem', { name: 'Borrar' }))
    const dialog = await screen.findByRole('alertdialog', { name: '¿Borrar «Mazo 1»?' })
    expect(
      within(dialog).getByText(
        'Sus palabras se conservan y quedarán sin mazo. Esta acción no se puede deshacer.',
      ),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: 'Borrar mazo' }))
    expect(await screen.findByText('Mazo «Mazo 1» borrado.')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /^Mazo 1/ })).not.toBeInTheDocument(),
    )
    expect(await app.db.words.get(word.id)).toBeDefined()
    expect(await app.db.deckWords.count()).toBe(0)
  })

  it('cancelar no borra nada', async () => {
    const app = await setup()
    await app.repos.decks.create('Mazo 1')
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Más acciones de «Mazo 1»' }))
    await user.click(screen.getByRole('menuitem', { name: 'Borrar' }))
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }),
    )
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(await app.repos.decks.list()).toHaveLength(1)
  })
})

describe('DecksPage: Estudiar (BR-21, RF-35)', () => {
  it('en un mazo sin palabras queda deshabilitado con la razón accesible y no navega', async () => {
    const app = await setup()
    await app.repos.decks.create('Vacío')
    await app.render()
    const study = await screen.findByRole('button', { name: 'Estudiar «Vacío»' })
    expect(study).toHaveAttribute('aria-disabled', 'true')
    expect(study).toHaveAccessibleDescription('Este mazo no tiene palabras')
    await userEvent.setup().click(study)
    expect(screen.getByRole('heading', { name: 'Mazos' })).toBeInTheDocument()
  })

  it('con palabras lleva a la sesión de estudio', async () => {
    const app = await setup()
    const deck = await app.repos.decks.create('Mazo 1')
    const { word } = await app.repos.words.create({ english: 'Apple', spanish: 'manzana' })
    await app.repos.deckWords.add(deck.id, word.id)
    await app.render()
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Estudiar «Mazo 1»' }))
    expect(await screen.findByRole('heading', { name: 'Mazo 1', level: 1 })).toBeInTheDocument()
  })
})

describe('DecksPage: diseño adaptable', () => {
  it('en móvil muestra pestañas y elegir un mazo lleva a sus palabras', async () => {
    const mq = (matches: boolean) =>
      ({
        matches,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
    vi.stubGlobal('matchMedia', () => mq(false))
    try {
      const app = await setup()
      await app.repos.decks.create('Mazo 1')
      await app.render()
      const tabs = await screen.findByRole('tablist', { name: 'Secciones' })
      expect(within(tabs).getByRole('tab', { name: 'Mazos', selected: true })).toBeInTheDocument()
      await userEvent.setup().click(await screen.findByRole('button', { name: /^Mazo 1/ }))
      expect(
        within(tabs).getByRole('tab', { name: 'Palabras', selected: true }),
      ).toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('DecksPage: accesibilidad', () => {
  it('axe: sin violaciones con mazos, formulario y menú', async () => {
    const app = await setup()
    const deck = await app.repos.decks.create('Mazo 1')
    await app.repos.decks.create('Vacío')
    const { word } = await app.repos.words.create({ english: 'Apple', spanish: 'manzana' })
    await app.repos.deckWords.add(deck.id, word.id)
    const { container } = await app.render()
    const user = userEvent.setup()
    await screen.findByRole('button', { name: /^Mazo 1/ })
    expect(await axeViolations(container)).toEqual([])
    await user.click(screen.getByRole('button', { name: 'Nuevo mazo' }))
    expect(await axeViolations(container)).toEqual([])
  })
})
