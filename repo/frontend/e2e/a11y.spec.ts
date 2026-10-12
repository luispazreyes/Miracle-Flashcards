// Accesibilidad global en navegador real (WCAG 2.1 AA): axe por pantalla × tema × preset (con contraste real),
// movimiento reducido, 320/768/1152 px, espaciado de texto, objetivos táctiles ≥ 44 px (prototype-spec §B.2).
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { addToDeck, createDeck, createWord, signIn } from './helpers'

const THEMES = ['white', 'blue', 'dark'] as const
const PALETTES = ['neutral', 'mint', 'sand', 'lavender', 'graphite'] as const
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function appearance(page: Page, theme: string, background: string, card: string) {
  await page.evaluate(
    ({ theme, background, card }) => {
      const root = document.documentElement
      root.dataset.theme = theme
      if (background === 'neutral') delete root.dataset.backgroundPalette
      else root.dataset.backgroundPalette = background
      root.dataset.cardPalette = card
    },
    { theme, background, card },
  )
}

async function expectNoViolations(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  )
  expect(summary, label).toEqual([])
}

/** Recorre tema × paleta de fondo con la tarjeta neutra. */
async function scanThemes(page: Page, screen: string) {
  for (const theme of THEMES)
    for (const background of PALETTES) {
      await appearance(page, theme, background, 'neutral')
      await expectNoViolations(page, `${screen} · tema ${theme} · fondo ${background}`)
    }
}

async function seeded(browser: Browser, options: Parameters<Browser['newContext']>[0] = {}) {
  const context = await browser.newContext({ locale: 'es-ES', ...options })
  const page = await context.newPage()
  await signIn(page)
  await createDeck(page, 'Mazo 1')
  await createDeck(page, 'Vacío')
  await createWord(page, {
    english: 'Apple',
    spanish: 'manzana',
    example: 'An apple a day',
    note: 'fruta',
  })
  await createWord(page, { english: 'Bread', spanish: 'pan' })
  await createWord(page, { english: 'Cat', spanish: 'gato' })
  await addToDeck(page, 'Apple', 'Mazo 1')
  await addToDeck(page, 'Bread', 'Mazo 1')
  const deckId = await page
    .locator('[data-deck-id]')
    .filter({ hasText: 'Mazo 1' })
    .getAttribute('data-deck-id')
  return { context, page, deckId: deckId! }
}

test.describe('axe por pantalla × tema × preset', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(300_000)

  let page: Page
  let deckId: string

  test.beforeAll(async ({ browser }) => {
    const s = await seeded(browser)
    page = s.page
    deckId = s.deckId
  })
  test.afterAll(async () => page.context().close())

  test('mazos y panel de palabras con grupos', async () => {
    await page.goto(`/mazos?deck=${deckId}`)
    await expect(page.getByRole('heading', { name: 'Palabras de «Mazo 1»' })).toBeVisible()
    await scanThemes(page, 'mazos')
  })

  test('mazos: formulario de mazo, menú y combobox abiertos', async () => {
    await page.goto('/mazos')
    await page.getByRole('button', { name: 'Más acciones de «Mazo 1»' }).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await scanThemes(page, 'menú de acciones')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Agregar «Cat» a un mazo' }).click()
    await expect(page.getByRole('combobox', { name: 'Buscar mazo' })).toBeVisible()
    await scanThemes(page, 'combobox agregar a mazo')
    await page.keyboard.press('Escape')
  })

  test('formulario de palabra (diálogo) con y sin errores', async () => {
    await page.goto('/mazos')
    await page.getByRole('button', { name: 'Nueva palabra' }).click()
    await expect(page.getByRole('dialog', { name: 'Nueva palabra' })).toBeVisible()
    await scanThemes(page, 'formulario de palabra')
    await page.getByRole('button', { name: 'Guardar palabra' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Corrige estos campos' })).toBeVisible()
    await scanThemes(page, 'formulario de palabra con errores')
    await page.keyboard.press('Escape')
  })

  test('confirmación de borrado (alertdialog)', async () => {
    await page.goto('/mazos')
    await page.getByRole('button', { name: 'Más acciones de «Vacío»' }).click()
    await page.getByRole('menuitem', { name: 'Borrar' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await scanThemes(page, 'diálogo de borrado')
    await page.getByRole('button', { name: 'Cancelar' }).click()
  })

  test('sesión de estudio: frente y reverso con cada paleta de tarjeta', async () => {
    await page.goto(`/estudio/${deckId}`)
    const card = page.getByRole('button', { name: /^Tarjeta: / })
    await expect(card).toBeVisible()
    for (const theme of THEMES)
      for (const cardPalette of PALETTES) {
        await appearance(page, theme, 'neutral', cardPalette)
        await expectNoViolations(page, `estudio frente · tema ${theme} · tarjeta ${cardPalette}`)
      }
    await card.click()
    await expect(page.getByRole('button', { name: 'Acerté', exact: true })).toBeVisible()
    for (const theme of THEMES)
      for (const cardPalette of PALETTES) {
        await appearance(page, theme, 'neutral', cardPalette)
        await expectNoViolations(page, `estudio reverso · tema ${theme} · tarjeta ${cardPalette}`)
      }
  })

  test('progreso con pendientes y aprendidas', async () => {
    // Una palabra aprendida: 3 aciertos seguidos con el mazo de 2 palabras.
    await page.goto(`/estudio/${deckId}`)
    for (let i = 0; i < 12; i++) {
      const done = await page.getByRole('heading', { name: '¡Sesión terminada!' }).isVisible()
      if (done) break
      await page.getByRole('button', { name: /^Tarjeta: / }).click()
      await page.getByRole('button', { name: 'Acerté', exact: true }).click()
    }
    await expect(page.getByRole('heading', { name: '¡Sesión terminada!' })).toBeVisible()
    await scanThemes(page, 'fin de sesión')
    await page.goto(`/progreso?deck=${deckId}`)
    await expect(page.getByText(/Aprendidas: 2/)).toBeVisible()
    await scanThemes(page, 'progreso · pendientes')
    await page.getByRole('tab', { name: /Aprendidas/ }).click()
    await scanThemes(page, 'progreso · aprendidas')
  })

  test('ajustes', async () => {
    await page.goto('/ajustes')
    await expect(page.getByRole('heading', { name: 'Apariencia' })).toBeVisible()
    await scanThemes(page, 'ajustes')
  })
})

test('acceso: formulario, enlace enviado y enlace inválido, en los tres temas', async ({
  page,
}) => {
  await page.goto('/acceso')
  await expect(page.getByLabel('Correo electrónico')).toBeVisible()
  await scanThemes(page, 'acceso')
  await page.getByLabel('Correo electrónico').fill('ana@example.com')
  await page.getByRole('button', { name: 'Enviar enlace de acceso' }).click()
  await expect(page.getByText(/Revisa tu correo/)).toBeVisible()
  await scanThemes(page, 'acceso · enlace enviado')
  await page.goto('/acceso?token=alterado')
  await expect(page.getByText('Este enlace ya no es válido.')).toBeVisible()
  await scanThemes(page, 'acceso · enlace inválido')
})

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' })

  test('los tokens valen ~0, el volteo no rota y los cambios son instantáneos (RF-02, RF-44)', async ({
    browser,
  }) => {
    const { page, deckId, context } = await seeded(browser, { reducedMotion: 'reduce' })
    const tokens = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement)
      return ['--mov-rapido', '--mov-medio', '--mov-volteo', '--mov-deposito'].map((t) =>
        parseFloat(css.getPropertyValue(t)),
      )
    })
    expect(tokens).toEqual([0.01, 0.01, 0.01, 0.01])

    await page.goto(`/estudio/${deckId}`)
    await page.getByRole('button', { name: /^Tarjeta: / }).click()
    await expect(page.getByRole('button', { name: 'Acerté', exact: true })).toBeVisible()
    const transform = await page
      .locator('.flip-inner')
      .evaluate((el) => getComputedStyle(el).transform)
    expect(transform).toBe('none') // sin rotación 3D
    const visibility = await page.evaluate(() => ({
      front: getComputedStyle(document.querySelector('.flip-face-front')!).visibility,
      back: getComputedStyle(document.querySelector('.flip-face-back')!).visibility,
    }))
    expect(visibility).toEqual({ front: 'hidden', back: 'visible' })

    // El depósito con el menú es instantáneo, sin pulso, y se anuncia igual (EC-58).
    await page.goto('/mazos')
    await page.getByRole('button', { name: 'Agregar «Cat» a un mazo' }).click()
    await page.getByRole('combobox', { name: 'Buscar mazo' }).fill('Mazo 1')
    await page.keyboard.press('Enter')
    await expect(page.getByText('«Cat» agregada a «Mazo 1».')).toBeVisible()
    await expect(page.locator('.anim-pulso-anillo')).toHaveCount(0)
    await context.close()
  })
})

test.describe('diseño adaptable', () => {
  test.setTimeout(240_000)

  for (const [width, height] of [
    [320, 640],
    [768, 900],
    [1152, 900],
  ] as const) {
    test(`${width} px: sin desplazamiento horizontal y con la disposición correcta`, async ({
      browser,
    }) => {
      const { page, deckId, context } = await seeded(browser)
      await page.setViewportSize({ width, height })
      const noOverflow = async (label: string) => {
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow, `${label} a ${width} px`).toBeLessThanOrEqual(0)
      }

      await page.goto('/mazos')
      await expect(page.getByRole('heading', { name: 'Mazos', level: 1 })).toBeVisible()
      if (width < 768) {
        await expect(page.getByRole('tablist', { name: 'Secciones' })).toBeVisible()
        await expect(page.locator('[data-drag-handle]')).toHaveCount(0) // solo menú
      } else {
        await expect(page.getByRole('tablist', { name: 'Secciones' })).toHaveCount(0)
        await expect(page.getByRole('region', { name: 'Mazos' })).toBeVisible()
        await expect(page.getByRole('region', { name: 'Palabras' })).toBeVisible()
      }
      await noOverflow('mazos')

      for (const route of [
        `/mazos?deck=${deckId}`,
        `/estudio/${deckId}`,
        `/progreso?deck=${deckId}`,
        '/ajustes',
      ]) {
        await page.goto(route)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await noOverflow(route)
      }
      await context.close()
    })
  }

  test('espaciado de texto ampliado (WCAG 1.4.12) y 200 % de zoom: sin pérdida de contenido', async ({
    browser,
  }) => {
    const { page, deckId, context } = await seeded(browser)
    // 320 px de ancho CSS equivalen a un zoom del 200 % sobre 640 px.
    await page.setViewportSize({ width: 320, height: 640 })
    await page.addStyleTag({
      content:
        '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }',
    })
    for (const route of ['/mazos', `/estudio/${deckId}`, '/ajustes']) {
      await page.goto(route)
      await page.addStyleTag({
        content:
          '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }',
      })
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, route).toBeLessThanOrEqual(0)
    }
    await context.close()
  })

  test('objetivos táctiles ≥ 44×44 px (WCAG 2.5.5)', async ({ browser }) => {
    const { page, deckId, context } = await seeded(browser)
    for (const [width, height] of [
      [320, 640],
      [1152, 900],
    ] as const) {
      await page.setViewportSize({ width, height })
      for (const route of [
        '/mazos',
        `/estudio/${deckId}`,
        `/progreso?deck=${deckId}`,
        '/ajustes',
      ]) {
        await page.goto(route)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        const small = await page.evaluate(() => {
          const targets = document.querySelectorAll<HTMLElement>(
            'button, a[href], [role="tab"], select, input[type="text"], input[type="search"], input[type="email"], input[type="url"]',
          )
          return [...targets]
            .filter(
              (el) => !el.closest('.sr-only') && el.textContent?.trim() !== 'Saltar al contenido',
            )
            .map((el) => ({ el, box: el.getBoundingClientRect() }))
            .filter(({ box }) => box.width > 0 && box.height > 0)
            .filter(({ box }) => box.width < 43.5 || box.height < 43.5)
            .map(
              ({ el, box }) =>
                `${el.tagName} "${el.getAttribute('aria-label') ?? el.textContent?.trim()}" ${Math.round(box.width)}×${Math.round(box.height)}`,
            )
        })
        expect(small, `${route} a ${width} px`).toEqual([])
      }
    }
    await context.close()
  })
})
