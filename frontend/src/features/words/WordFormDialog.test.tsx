// Formulario de palabra (Fase 7, F-04): HU-06, HU-10; EC-13 a EC-16, EC-45, EC-30.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeViolations } from '../../test/axe'
import { openApp } from '../../test/appHarness'

async function openForm(options: Parameters<typeof openApp>[1] = {}) {
  const app = await openApp('/mazos', { heading: 'Mazos', ...options })
  return app
}

async function startNew(app: Awaited<ReturnType<typeof openForm>>) {
  await app.render()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nueva palabra' }))
  const dialog = await screen.findByRole('dialog', { name: 'Nueva palabra' })
  return { user, dialog }
}

const field = (name: RegExp | string) => screen.getByLabelText(name)

afterEach(() => vi.restoreAllMocks())

describe('WordFormDialog: crear', () => {
  it('abre con el foco en "Inglés" y los obligatorios marcados con texto', async () => {
    const app = await openForm()
    const { dialog } = await startNew(app)
    expect(within(dialog).getByLabelText('Inglés (obligatorio)')).toHaveFocus()
    expect(within(dialog).getByLabelText('Inglés (obligatorio)')).toHaveAttribute('lang', 'en')
    expect(within(dialog).getByLabelText('Español (obligatorio)')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Enlace de imagen')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Ejemplo de uso')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Nota')).toBeInTheDocument()
  })

  it('EC-13: sin los obligatorios no se crea; resumen en alerta, error en línea y foco al primer campo', async () => {
    const app = await openForm()
    const { user, dialog } = await startNew(app)
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))

    const alert = await within(dialog).findByRole('alert')
    expect(alert).toHaveTextContent('Corrige estos campos para guardar la palabra:')
    expect(alert).toHaveTextContent('Inglés')
    expect(alert).toHaveTextContent('Español')
    expect(
      within(dialog).getByText('Falta el campo «Inglés». Escríbelo para guardar la palabra.'),
    ).toBeInTheDocument()
    expect(field('Inglés (obligatorio)')).toHaveAttribute('aria-invalid', 'true')
    expect(field('Inglés (obligatorio)')).toHaveFocus()
    expect(await app.db.words.count()).toBe(0)
  })

  it('EC-13: si solo falta el español se nombra ese campo', async () => {
    const app = await openForm()
    const { user, dialog } = await startNew(app)
    await user.type(field('Inglés (obligatorio)'), 'Hello')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))
    expect(
      await within(dialog).findByText(
        'Falta el campo «Español». Escríbelo para guardar la palabra.',
      ),
    ).toBeInTheDocument()
    expect(field('Español (obligatorio)')).toHaveFocus()
    expect(await app.db.words.count()).toBe(0)
  })

  it('guarda, cierra, avisa y lleva el foco a la fila creada (EC-?, F-04)', async () => {
    const app = await openForm()
    const { user, dialog } = await startNew(app)
    await user.type(field('Inglés (obligatorio)'), 'Hello')
    await user.type(field('Español (obligatorio)'), 'Hola')
    await user.type(field('Ejemplo de uso'), 'Hello, world')
    await user.type(field('Nota'), 'saludo')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))

    expect(await screen.findByText('Palabra guardada')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const saved = (await app.db.words.toArray())[0]
    expect(saved).toMatchObject({
      english: 'Hello',
      normalizedEnglish: 'hello',
      spanish: 'Hola',
      example: 'Hello, world',
      note: 'saludo',
      imageVerified: true,
    })
    const row = await screen.findByText('Hello', { selector: 'p' })
    await waitFor(() => expect(row.closest('[data-word-main]')).toHaveFocus())
  })

  it('EC-45: un inglés repetido avisa sin bloquear y se puede continuar', async () => {
    const app = await openForm()
    await app.repos.words.create({ english: 'Apple', spanish: 'manzana' })
    const { user, dialog } = await startNew(app)
    expect(within(dialog).queryByText(/Ya existe una palabra/)).not.toBeInTheDocument()
    await user.type(field('Inglés (obligatorio)'), '  APPLE ')
    expect(
      await within(dialog).findByText('Ya existe una palabra con ese inglés. Puedes continuar.'),
    ).toBeInTheDocument()
    await user.type(field('Español (obligatorio)'), 'manzana verde')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await app.db.words.count()).toBe(2)
  })

  it('Cancelar y Esc cierran sin crear y devuelven el foco al botón', async () => {
    const app = await openForm()
    const { user, dialog } = await startNew(app)
    await user.type(field('Inglés (obligatorio)'), 'Hello')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await app.db.words.count()).toBe(0)
    expect(screen.getByRole('button', { name: 'Nueva palabra' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Nueva palabra' }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('error al guardar: se conserva lo escrito y se ofrece reintentar', async () => {
    const app = await openForm()
    const { user, dialog } = await startNew(app)
    await user.type(field('Inglés (obligatorio)'), 'Hello')
    await user.type(field('Español (obligatorio)'), 'Hola')
    const spy = vi.spyOn(app.repos.words, 'create').mockRejectedValueOnce(new Error('fallo'))
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))
    expect(
      await within(dialog).findByText('No se pudo guardar la palabra. Inténtalo de nuevo.'),
    ).toBeInTheDocument()
    expect(field('Inglés (obligatorio)')).toHaveValue('Hello')
    spy.mockRestore()
    await user.click(within(dialog).getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Palabra guardada')).toBeInTheDocument()
  })
})

describe('WordFormDialog: imagen (RF-15, BR-17)', () => {
  it('EC-14: un enlace que no es http(s) se rechaza', async () => {
    const app = await openForm()
    const { user, dialog } = await startNew(app)
    await user.type(field('Inglés (obligatorio)'), 'Cat')
    await user.type(field('Español (obligatorio)'), 'gato')
    await user.type(field('Enlace de imagen'), 'ftp://ejemplo.invalid/gato.png')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))
    expect(
      (await within(dialog).findAllByText('El enlace no es http(s) o no carga como imagen.'))
        .length,
    ).toBeGreaterThan(0)
    expect(field('Enlace de imagen')).toHaveFocus()
    expect(await app.db.words.count()).toBe(0)
  })

  it('EC-15: un enlace http(s) que no carga como imagen se rechaza en línea', async () => {
    const app = await openForm({ services: { checkImage: async () => false } })
    const { user, dialog } = await startNew(app)
    await user.type(field('Inglés (obligatorio)'), 'Cat')
    await user.type(field('Español (obligatorio)'), 'gato')
    await user.type(field('Enlace de imagen'), 'https://ejemplo.invalid/no-imagen')
    expect(await screen.findByText('Comprobando imagen…')).toBeInTheDocument()
    expect(
      await within(dialog).findByText('El enlace no es http(s) o no carga como imagen.'),
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))
    await waitFor(() => expect(field('Enlace de imagen')).toHaveFocus())
    expect(await app.db.words.count()).toBe(0)
  })

  it('una imagen válida muestra vista previa y se guarda verificada', async () => {
    const app = await openForm()
    const { user, dialog } = await startNew(app)
    await user.type(field('Inglés (obligatorio)'), 'Cat')
    await user.type(field('Español (obligatorio)'), 'gato')
    await user.type(field('Enlace de imagen'), 'https://ejemplo.invalid/gato.png')
    expect(
      await within(dialog).findByRole('img', { name: 'Imagen de la palabra' }),
    ).toHaveAttribute('src', 'https://ejemplo.invalid/gato.png')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect((await app.db.words.toArray())[0]).toMatchObject({
      imageUrl: 'https://ejemplo.invalid/gato.png',
      imageVerified: true,
    })
  })

  it('EC-16: sin conexión se guarda "sin verificar", con aviso visible y comprobación pendiente', async () => {
    const app = await openForm({ online: false })
    const { user, dialog } = await startNew(app)
    await user.type(field('Inglés (obligatorio)'), 'Cat')
    await user.type(field('Español (obligatorio)'), 'gato')
    await user.type(field('Enlace de imagen'), 'https://ejemplo.invalid/gato.png')
    expect(await within(dialog).findByText('Imagen sin verificar')).toBeInTheDocument()
    expect(
      within(dialog).getByText(/Sin conexión: la imagen se guardará sin verificar/),
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    expect((await app.db.words.toArray())[0].imageVerified).toBe(false)
    const types = (await app.repos.outbox.all()).map((o) => o.type)
    expect(types).toEqual(['word.create', 'image.verify'])
    expect(await screen.findByText('Imagen sin verificar')).toBeInTheDocument()
  })
})

describe('WordFormDialog: editar (BR-16)', () => {
  it('precarga los datos y la operación lleva solo los campos modificados', async () => {
    const app = await openForm({ online: false })
    await app.repos.words.create({ english: 'Apple', spanish: 'manzana', note: 'fruta' })
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Más acciones de «Apple»' }))
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar palabra' })
    expect(within(dialog).getByLabelText('Inglés (obligatorio)')).toHaveValue('Apple')
    expect(within(dialog).getByLabelText('Nota')).toHaveValue('fruta')

    await user.clear(within(dialog).getByLabelText('Español (obligatorio)'))
    await user.type(within(dialog).getByLabelText('Español (obligatorio)'), 'manzana roja')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))
    expect(await screen.findByText('Palabra guardada')).toBeInTheDocument()

    const last = (await app.repos.outbox.all()).at(-1)!
    expect(last.type).toBe('word.update')
    expect((last.payload as { patch: object }).patch).toEqual({ spanish: 'manzana roja' })
    expect(
      await screen.findByText('manzana roja', { selector: 'span[aria-hidden="true"]' }),
    ).toBeInTheDocument()
  })

  it('el aviso de inglés repetido no aparece al editar la misma palabra', async () => {
    const app = await openForm()
    await app.repos.words.create({ english: 'Apple', spanish: 'manzana' })
    await app.render()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Más acciones de «Apple»' }))
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar palabra' })
    expect(within(dialog).queryByText(/Ya existe una palabra/)).not.toBeInTheDocument()
  })
})

describe('WordFormDialog: accesibilidad', () => {
  it('axe: sin violaciones con el formulario vacío y con errores', async () => {
    const app = await openForm()
    const { user, dialog } = await startNew(app)
    expect(await axeViolations(document.body)).toEqual([])
    await user.click(within(dialog).getByRole('button', { name: 'Guardar palabra' }))
    await within(dialog).findByRole('alert')
    expect(await axeViolations(document.body)).toEqual([])
  })
})
