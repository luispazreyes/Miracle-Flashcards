// Arrastre y depósito con ratón y con dedo, y recorrido solo con teclado (HU-17; EC-56 a EC-59; WCAG 2.1.1, 2.5.1).
import { expect, test, type Page } from '@playwright/test'
import { addToDeck, createDeck, createWord, signIn, tabTo } from './helpers'

async function seed(page: Page) {
  await signIn(page)
  await createDeck(page, 'Mazo A')
  await createDeck(page, 'Mazo B')
  await createWord(page, { english: 'Dog', spanish: 'perro' })
  await createWord(page, { english: 'Cat', spanish: 'gato' })
}

const center = async (page: Page, selector: string) => {
  const box = await page.locator(selector).first().boundingBox()
  if (!box) throw new Error(`Sin caja para ${selector}`)
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
const handle = (english: string) => `[data-word-id]:has(p:text-is("${english}")) [data-drag-handle]`
const deckSelector = (name: string) => `[data-deck-id]:has(span:text-is("${name}"))`

test('arrastrar con el ratón deposita la palabra, avisa y el mazo pulsa (BR-27)', async ({
  page,
}) => {
  await seed(page)
  const from = await center(page, handle('Dog'))
  const to = await center(page, deckSelector('Mazo B'))

  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 20, from.y + 10, { steps: 4 })
  await page.mouse.move(to.x, to.y, { steps: 12 })
  // Mientras se arrastra: la ficha sigue al puntero y el mazo destino dice "Suelta aquí" (no solo color).
  await expect(page.locator('[data-drag-chip]')).toHaveText('Dog')
  await expect(page.locator(deckSelector('Mazo B')).getByText('Suelta aquí')).toBeVisible()
  await page.mouse.up()

  await expect(page.getByText('«Dog» agregada a «Mazo B».')).toBeVisible()
  await expect(page.locator(deckSelector('Mazo B')).getByText('1 palabra')).toBeVisible()
  await expect(page.locator('[data-drag-chip]')).toHaveCount(0)
})

test('soltar fuera de un mazo o con Escape no cambia nada y se anuncia (BR-28, EC-56)', async ({
  page,
}) => {
  await seed(page)
  const from = await center(page, handle('Dog'))
  const to = await center(page, deckSelector('Mazo A'))

  // Soltar en un hueco sin mazo.
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 300, from.y + 200, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByText('Arrastre cancelado. «Dog» no cambió de mazo.')).toBeVisible()

  // Escape durante el arrastre.
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 8 })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(page.locator(deckSelector('Mazo A')).getByText('0 palabras')).toBeVisible()
})

test('un duplicado devuelve la palabra y avisa (BR-28)', async ({ page }) => {
  await seed(page)
  await addToDeck(page, 'Dog', 'Mazo A')
  const from = await center(page, handle('Dog'))
  const to = await center(page, deckSelector('Mazo A'))
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 10 })
  await page.mouse.up()
  await expect(page.getByText('«Dog» ya está en este mazo.')).toBeVisible()
  await expect(page.locator(deckSelector('Mazo A')).getByText('1 palabra')).toBeVisible()
})

test('arrastres consecutivos no pierden palabras (EC-59)', async ({ page }) => {
  await seed(page)
  const to = await center(page, deckSelector('Mazo B'))
  for (const word of ['Dog', 'Cat']) {
    const from = await center(page, handle(word))
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 10 })
    await page.mouse.up()
    await expect(page.getByText(`«${word}» agregada a «Mazo B».`)).toBeVisible()
  }
  await expect(page.locator(deckSelector('Mazo B')).getByText('2 palabras')).toBeVisible()
})

test.describe('con dedo (táctil)', () => {
  test.use({ hasTouch: true })

  test('arrastrar con el dedo deposita la palabra (HU-17, EC-57)', async ({ page, context }) => {
    await seed(page)
    const from = await center(page, handle('Cat'))
    const to = await center(page, deckSelector('Mazo B'))
    const cdp = await context.newCDPSession(page)
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
      })

    await touch('touchStart', from.x, from.y)
    for (let i = 1; i <= 10; i++)
      await touch(
        'touchMove',
        from.x + ((to.x - from.x) * i) / 10,
        from.y + ((to.y - from.y) * i) / 10,
      )
    await touch('touchEnd', to.x, to.y)

    await expect(page.getByText('«Cat» agregada a «Mazo B».')).toBeVisible()
    // El arrastre no desplazó la página: el asa lleva touch-action: none.
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })
})

test('todo se puede hacer solo con teclado: crear mazo y asignar una palabra (WCAG 2.1.1, 2.5.1)', async ({
  page,
}) => {
  await signIn(page)
  await createDeck(page, 'Teclado')
  await createWord(page, { english: 'Key', spanish: 'tecla' })

  // "Agregar a mazo" alcanzable con Tab, abre con Enter, se filtra escribiendo y se elige con Enter.
  await page.locator('body').click({ position: { x: 1, y: 1 } })
  await tabTo(page, 'Agregar «Key» a un mazo')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('combobox', { name: 'Buscar mazo' })).toBeFocused()
  await page.keyboard.type('tecl')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('Enter')
  await expect(page.getByText('«Key» agregada a «Teclado».')).toBeVisible()
  // El foco vuelve al botón sin esperas.
  await expect(page.getByRole('button', { name: 'Agregar «Key» a un mazo' })).toBeFocused()

  // Estudiar y responder con teclado.
  await tabTo(page, 'Estudiar «Teclado»')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: /^Tarjeta: Key/ })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Acerté', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Aciertos seguidos: 1 de 3')).toBeVisible()
})
