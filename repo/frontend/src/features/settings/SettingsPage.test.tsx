// Ajustes (Fase 10): HU-13, HU-14; EC-35, EC-36, EC-49; BR-36, BR-37.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeViolations } from '../../test/axe'
import { openApp } from '../../test/appHarness'
import { PREFS_MIRROR_KEY } from '../../lib/appearance'

const root = document.documentElement

function resetDocument() {
  delete root.dataset.theme
  delete root.dataset.backgroundPalette
  delete root.dataset.cardPalette
  localStorage.clear()
}
beforeEach(resetDocument)
afterEach(() => {
  resetDocument()
  vi.unstubAllGlobals()
})

const radio = (group: string, label: string) =>
  within(screen.getByRole('group', { name: group })).getByRole('radio', { name: label })

async function open(options: Parameters<typeof openApp>[1] = {}) {
  const app = await openApp('/ajustes', { heading: 'Ajustes', ...options })
  await app.render()
  await screen.findByRole('group', { name: 'Tema' })
  return app
}

describe('SettingsPage: contenido', () => {
  it('ofrece tema, paletas de fondo y de tarjeta (solo presets) y lado de la imagen', async () => {
    await open()
    expect(
      within(screen.getByRole('group', { name: 'Tema' }))
        .getAllByRole('radio')
        .map((r) => r.getAttribute('value')),
    ).toEqual(['white', 'blue', 'dark'])
    for (const group of ['Paleta de fondo', 'Paleta de tarjeta']) {
      const names = within(screen.getByRole('group', { name: group }))
        .getAllByRole('radio')
        .map((r) => r.getAttribute('value'))
      expect(names).toEqual(['neutral', 'mint', 'sand', 'lavender', 'graphite'])
    }
    expect(screen.queryByLabelText(/color/i)).not.toBeInTheDocument() // BR-37: sin color libre
    expect(screen.getByRole('heading', { name: 'Vista previa' })).toBeInTheDocument()
  })

  it('el lado de la imagen empieza en "Reverso" (RF-12, P-F1)', async () => {
    await open()
    expect(radio('Lado de la imagen', 'Reverso')).toBeChecked()
  })

  it('EC-36: sin preferencia guardada sigue al sistema (claro → Blanco; oscuro → Oscuro); Azul solo si se elige', async () => {
    await open()
    expect(radio('Tema', 'Blanco')).toBeChecked()
    expect(radio('Tema', 'Azul')).not.toBeChecked()
  })

  it('EC-36: con el sistema en oscuro, el tema inicial es Oscuro', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('dark'),
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    await open()
    expect(radio('Tema', 'Oscuro')).toBeChecked()
  })

  it('muestra la cuenta y la vista previa refleja el lado de la imagen', async () => {
    const app = await open()
    expect(screen.getByText(`Sesión iniciada como ${app.session.email}.`)).toBeInTheDocument()
    const preview = screen.getByRole('region', { name: 'Vista previa' })
    expect(within(preview).getAllByText('Imagen')).toHaveLength(1)
    await userEvent.setup().click(radio('Lado de la imagen', 'Ambos'))
    await waitFor(() => expect(within(preview).getAllByText('Imagen')).toHaveLength(2))
  })
})

describe('SettingsPage: cambios (BR-36)', () => {
  it('EC-35: el tema se aplica al instante, se guarda, se refleja en el espejo y se encola', async () => {
    const app = await open()
    const user = userEvent.setup()
    const dark = radio('Tema', 'Oscuro')
    await user.click(dark)

    expect(root.dataset.theme).toBe('dark')
    expect(await screen.findByText('Guardado')).toBeInTheDocument()
    expect(dark).toHaveFocus() // el cambio no mueve el foco
    expect(JSON.parse(localStorage.getItem(PREFS_MIRROR_KEY)!)).toMatchObject({ theme: 'dark' })
    await waitFor(async () => expect((await app.repos.preferences.get())?.theme).toBe('dark'))
    expect((await app.repos.outbox.all()).at(-1)).toMatchObject({
      type: 'preference.update',
      payload: { patch: { theme: 'dark' } },
    })
  })

  it('las paletas de fondo y de tarjeta se aplican por atributo; "Neutro" quita la de fondo', async () => {
    await open()
    const user = userEvent.setup()
    await user.click(radio('Paleta de fondo', 'Menta'))
    expect(root.dataset.backgroundPalette).toBe('mint')
    await user.click(radio('Paleta de tarjeta', 'Grafito'))
    expect(root.dataset.cardPalette).toBe('graphite')
    await user.click(radio('Paleta de fondo', 'Neutro'))
    expect(root.dataset.backgroundPalette).toBeUndefined()
    await user.click(radio('Paleta de tarjeta', 'Neutro'))
    expect(root.dataset.cardPalette).toBe('neutral')
  })

  it('el lado de la imagen se guarda en la preferencia', async () => {
    const app = await open()
    await userEvent.setup().click(radio('Lado de la imagen', 'Frente'))
    await waitFor(async () => expect((await app.repos.preferences.get())?.imageSide).toBe('front'))
  })

  it('una preferencia guardada se aplica al abrir la app y vuelve a escribir el espejo', async () => {
    const app = await openApp('/mazos', { heading: 'Mazos' })
    await app.repos.preferences.update(
      { theme: 'blue', backgroundPalette: 'sand', cardPalette: 'lavender' },
      { theme: 'white', backgroundPalette: 'neutral', cardPalette: 'neutral' },
    )
    await app.render()
    await waitFor(() => expect(root.dataset.theme).toBe('blue'))
    expect(root.dataset.backgroundPalette).toBe('sand')
    expect(root.dataset.cardPalette).toBe('lavender')
    expect(JSON.parse(localStorage.getItem(PREFS_MIRROR_KEY)!)).toMatchObject({
      theme: 'blue',
      backgroundPalette: 'sand',
      cardPalette: 'lavender',
    })
  })

  it('sin conexión se guarda en el dispositivo y queda para sincronizar (EC-30)', async () => {
    const app = await open({ online: false })
    await userEvent.setup().click(radio('Tema', 'Azul'))
    expect(root.dataset.theme).toBe('blue')
    await waitFor(async () => expect(await app.repos.outbox.unsynced()).toBe(1))
  })

  it('un cambio hecho en otro dispositivo llega por sincronización y se aplica', async () => {
    const app = await open()
    // Simula el estado que trae el pull de otro dispositivo.
    await app.db.preferences.put({
      userId: app.session.userId,
      theme: 'dark',
      backgroundPalette: 'graphite',
      cardPalette: 'neutral',
      imageSide: 'both',
      updatedAt: Date.now(),
    })
    await waitFor(() => expect(root.dataset.theme).toBe('dark'))
    expect(radio('Lado de la imagen', 'Ambos')).toBeChecked()
  })
})

describe('SettingsPage: cuenta y accesibilidad', () => {
  it('"Cerrar sesión" cierra directamente si no hay nada pendiente', async () => {
    const app = await open()
    const section = screen.getByRole('region', { name: 'Cuenta' })
    await userEvent.setup().click(within(section).getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(app.services.auth.getSession()).toBeNull()
  })

  it('axe: sin violaciones', async () => {
    await open()
    expect(await axeViolations(document.body)).toEqual([])
  })
})
