// Sin conexión, reconexión, caché de imágenes e instalación de la PWA (HU-12; RF-14, RF-28, RF-22).
import { expect, test } from '@playwright/test'
import {
  addToDeck,
  createDeck,
  createWord,
  serveImages,
  signIn,
  waitForServiceWorker,
} from './helpers'

test('sin conexión se crea y se estudia; al volver la red se sincroniza (EC-30, EC-28)', async ({
  page,
  context,
}) => {
  await signIn(page)
  await createDeck(page, 'Verbos')
  await expect(page.getByText('Sincronizado')).toBeVisible()

  await context.setOffline(true)
  await expect(
    page.getByText('Sin conexión. Tus cambios se guardan en este dispositivo.'),
  ).toBeVisible()

  // Crear, editar y asignar sin red: nada se bloquea.
  await createWord(page, { english: 'Run', spanish: 'correr' })
  await addToDeck(page, 'Run', 'Verbos')
  await expect(page.getByText('Sin conexión', { exact: false }).first()).toBeVisible()

  // Estudiar sin red.
  await page.getByRole('button', { name: 'Estudiar «Verbos»' }).click()
  await page.getByRole('button', { name: /^Tarjeta: Run/ }).click()
  await page.getByRole('button', { name: 'Acerté', exact: true }).click()
  await expect(page.getByText('Aciertos seguidos: 1 de 3')).toBeVisible()

  // Reconexión: se sincroniza solo.
  await context.setOffline(false)
  await expect(page.getByText('Sincronizado')).toBeVisible({ timeout: 20_000 })
  await expect(
    page.getByText('Sin conexión. Tus cambios se guardan en este dispositivo.'),
  ).toBeHidden()
})

test('con el service worker activo la app abre y se usa sin red, y las imágenes ya vistas se muestran (BR-43)', async ({
  page,
  context,
}) => {
  await serveImages(context, 'imagenes.test')
  await signIn(page)
  await waitForServiceWorker(page)

  await createDeck(page, 'Animales')
  await createWord(page, {
    english: 'Cat',
    spanish: 'gato',
    imageUrl: 'https://imagenes.test/gato.png',
  })
  await addToDeck(page, 'Cat', 'Animales')

  // La imagen ya se vio (la comprobación del formulario la descargó a través del service worker).
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('images-v1')
    return (await cache.keys()).map((r) => r.url)
  })
  expect(cached).toContain('https://imagenes.test/gato.png')

  // Sin red y recargando: el shell sale del precaché y los datos de Dexie.
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mazos', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Estudiar «Animales»' }).click()
  await page.getByRole('button', { name: /^Tarjeta: Cat/ }).click()
  const image = page.locator('.flip-face-back img')
  await expect(image).toBeVisible()
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
})

test('una imagen nunca vista y sin conexión se omite sin error y la tarjeta se estudia (EC-31)', async ({
  page,
  context,
}) => {
  await serveImages(context, 'imagenes.test')
  await signIn(page)
  await waitForServiceWorker(page)
  await createDeck(page, 'Animales')
  await createWord(page, {
    english: 'Dog',
    spanish: 'perro',
    imageUrl: 'https://imagenes.test/perro.png',
  })
  await addToDeck(page, 'Dog', 'Animales')
  // Se vacía la caché para simular una imagen que este dispositivo nunca vio.
  await page.evaluate(async () => {
    await caches.delete('images-v1')
  })
  await context.unroute('https://imagenes.test/**')
  await context.setOffline(true)
  await page.reload() // sin memoria de imágenes de esta sesión: la de este dispositivo "nunca se vio"

  await page.getByRole('button', { name: 'Estudiar «Animales»' }).click()
  await page.getByRole('button', { name: /^Tarjeta: Dog/ }).click()
  await expect(page.getByRole('button', { name: 'Traducción: perro' })).toBeVisible()
  await expect(page.locator('.flip-face-back img')).toHaveCount(0) // omitida
  await page.getByRole('button', { name: 'Acerté', exact: true }).click()
  await expect(page.getByText('Aciertos seguidos: 1 de 3')).toBeVisible()
})

test('es instalable: manifiesto válido, iconos y service worker registrado (HU-12)', async ({
  page,
  request,
}) => {
  await page.goto('/acceso')
  await waitForServiceWorker(page)
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(manifestHref).toBeTruthy()
  const manifest = await (await request.get(manifestHref!)).json()
  expect(manifest).toMatchObject({ name: 'Miracle Flashcards', display: 'standalone', lang: 'es' })
  for (const icon of manifest.icons as { src: string }[]) {
    const res = await request.get(icon.src)
    expect(res.ok(), icon.src).toBe(true)
    expect(res.headers()['content-type']).toContain('image/png')
  }
  const registration = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration()
    return { scope: r?.scope, active: !!r?.active }
  })
  expect(registration.active).toBe(true)
})
