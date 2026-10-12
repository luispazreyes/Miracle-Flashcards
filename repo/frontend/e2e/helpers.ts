// Ayudas comunes de los E2E: acceso con el enlace simulado y acciones frecuentes por la interfaz.
import { expect, type BrowserContext, type Page } from '@playwright/test'

let counter = 0
export const uniqueEmail = () => `ana${Date.now()}-${++counter}@example.com`

/** Acceso con enlace mágico en modo mock: pide el enlace, lo abre y espera la pantalla de mazos. */
export async function signIn(page: Page, email = uniqueEmail()) {
  await page.goto('/')
  await expect(page).toHaveURL(/\/acceso$/)
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByRole('button', { name: 'Enviar enlace de acceso' }).click()
  await page.getByRole('link', { name: 'Abrir el enlace de acceso' }).click()
  await expect(page.getByRole('heading', { name: 'Mazos', level: 1 })).toBeVisible()
  return email
}

export async function createDeck(page: Page, name: string) {
  await page.getByRole('button', { name: 'Nuevo mazo' }).first().click()
  await page.getByLabel('Nombre del mazo').fill(name)
  await page.getByRole('button', { name: 'Crear mazo' }).click()
  await expect(page.getByText(`Mazo «${name}» creado.`)).toBeVisible()
}

export async function createWord(
  page: Page,
  word: { english: string; spanish: string; imageUrl?: string; example?: string; note?: string },
) {
  await page.getByRole('button', { name: 'Nueva palabra' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Nueva palabra' })
  await dialog.getByLabel('Inglés (obligatorio)').fill(word.english)
  await dialog.getByLabel('Español (obligatorio)').fill(word.spanish)
  if (word.imageUrl) await dialog.getByLabel('Enlace de imagen').fill(word.imageUrl)
  if (word.example) await dialog.getByLabel('Ejemplo de uso').fill(word.example)
  if (word.note) await dialog.getByLabel('Nota').fill(word.note)
  await dialog.getByRole('button', { name: 'Guardar palabra' }).click()
  await expect(page.getByText('Palabra guardada').first()).toBeVisible()
  await expect(dialog).toBeHidden()
}

/** "Agregar a mazo" con el combobox, solo con teclado dentro del menú. */
export async function addToDeck(page: Page, english: string, deck: string) {
  await page.getByRole('button', { name: `Agregar «${english}» a un mazo` }).click()
  await page.getByRole('combobox', { name: 'Buscar mazo' }).fill(deck)
  await page.keyboard.press('Enter')
  await expect(page.getByText(`«${english}» agregada a «${deck}».`)).toBeVisible()
}

/** Espera a que el service worker controle la página (necesario para probar sin conexión). */
export async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
}

/** PNG de 1×1 para servir como imagen de prueba. */
export const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/** Sirve una imagen de prueba para cualquier URL de `host` (también a las peticiones del service worker). */
export async function serveImages(context: BrowserContext, host: string) {
  await context.route(`https://${host}/**`, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }),
  )
}

/** Recorre con Tab hasta que el foco cae en el elemento con ese nombre accesible (máx. `max` pulsaciones). */
export async function tabTo(page: Page, name: RegExp | string, max = 60) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el) return ''
      return el.getAttribute('aria-label') ?? el.textContent ?? ''
    })
    if (typeof name === 'string' ? label.trim().startsWith(name) : name.test(label)) return
  }
  throw new Error(`El foco no llegó a «${String(name)}» con el teclado`)
}
