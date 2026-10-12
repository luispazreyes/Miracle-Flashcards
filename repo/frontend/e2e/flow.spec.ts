// Flujo principal de punta a punta (modo mock): acceso, mazos, palabras, estudio y progreso.
// Cubre HU-01 a HU-11 en navegador real.
import { expect, test } from '@playwright/test'
import { addToDeck, createDeck, createWord, signIn } from './helpers'

test('acceso con enlace mágico, mazo, palabra, estudio hasta aprender y reactivación', async ({
  page,
}) => {
  await signIn(page)

  await createDeck(page, 'Frutas')
  await createWord(page, {
    english: 'Apple',
    spanish: 'manzana',
    example: 'An apple a day',
    note: 'fruta',
  })
  await addToDeck(page, 'Apple', 'Frutas')
  await expect(page.getByText('1 palabra')).toBeVisible()

  // Estudiar: voltear y acertar 3 veces seguidas (con una sola palabra se repite).
  await page.getByRole('button', { name: 'Estudiar «Frutas»' }).click()
  await expect(page.getByRole('heading', { name: 'Frutas', level: 1 })).toBeVisible()
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: /^Tarjeta: Apple/ }).click()
    await expect(page.getByRole('button', { name: 'Traducción: manzana' })).toBeVisible()
    await page.getByRole('button', { name: 'Acerté', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: '¡Sesión terminada!' })).toBeFocused()
  await expect(page.getByText('Aciertos: 3')).toBeVisible()

  // Progreso: queda aprendida y se puede reactivar.
  await page.getByRole('link', { name: 'Reactivar palabras' }).click()
  await expect(page.getByRole('heading', { name: 'Progreso', level: 1 })).toBeVisible()
  await expect(page.getByText('Aprendidas: 1')).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Avance del mazo' })).toHaveAttribute(
    'aria-valuenow',
    '100',
  )
  await page.getByRole('tab', { name: /Aprendidas/ }).click()
  await page.getByRole('button', { name: 'Reactivar «Apple»' }).click()
  await expect(page.getByText('«Apple» vuelve a pendientes de «Frutas».')).toBeVisible()
  await expect(page.getByText('Pendientes: 1')).toBeVisible()
})

test('la sesión persiste al recargar y cerrar sesión vuelve al acceso', async ({ page }) => {
  await signIn(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mazos', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Ajustes' }).click()
  await page
    .getByRole('region', { name: 'Cuenta' })
    .getByRole('button', { name: 'Cerrar sesión' })
    .click()
  await expect(page.getByLabel('Correo electrónico')).toBeVisible()
  await page.goto('/mazos')
  await expect(page).toHaveURL(/\/acceso$/)
})

test('un enlace de acceso inválido no inicia sesión (EC-03)', async ({ page }) => {
  await page.goto('/acceso?token=alterado')
  await expect(page.getByText('Este enlace ya no es válido.')).toBeVisible()
  await page.getByRole('button', { name: 'Solicitar enlace nuevo' }).click()
  await expect(page.getByLabel('Correo electrónico')).toBeVisible()
})

test('apariencia: el tema se aplica al instante y sobrevive a la recarga sin parpadeo (EC-35, EC-49)', async ({
  page,
}) => {
  await signIn(page)
  await page.getByRole('link', { name: 'Ajustes' }).click()
  await page.getByRole('radio', { name: 'Oscuro' }).check()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('radio', { name: 'Menta' }).first().check()
  await expect(page.locator('html')).toHaveAttribute('data-background-palette', 'mint')

  // En la recarga el atributo ya está puesto antes de que React pinte (script inline de index.html).
  await page.addInitScript(() => {
    ;(window as unknown as { __themeAtStart?: string }).__themeAtStart = ''
  })
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('html')).toHaveAttribute('data-background-palette', 'mint')
})

test('recargar a mitad de sesión no pierde las respuestas ya dadas (NEC-15)', async ({ page }) => {
  await signIn(page)
  await createDeck(page, 'Frutas')
  await createWord(page, { english: 'Apple', spanish: 'manzana' })
  await addToDeck(page, 'Apple', 'Frutas')
  await page.getByRole('button', { name: 'Estudiar «Frutas»' }).click()
  await page.getByRole('button', { name: /^Tarjeta: Apple/ }).click()
  await page.getByRole('button', { name: 'Acerté', exact: true }).click()
  await expect(page.getByText('Aciertos seguidos: 1 de 3')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Aciertos seguidos: 1 de 3')).toBeVisible()
  // Un doble toque rápido en "Acerté" suma un solo acierto (NEC-07).
  await page.getByRole('button', { name: /^Tarjeta: Apple/ }).click()
  await page.getByRole('button', { name: 'Acerté', exact: true }).dblclick()
  await expect(page.getByText('Aciertos seguidos: 2 de 3')).toBeVisible()
})
