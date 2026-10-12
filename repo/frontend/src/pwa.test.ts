// PWA (Fase 11): configuración del manifiesto y del service worker. HU-12; RF-14, RF-28; BR-43; P-F6, P-F8.
// El comportamiento real con el service worker activo se verifica en el navegador (Fase 14, Playwright).
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MANIFEST_BACKGROUND, MANIFEST_THEME, pwaOptions } from '../vite.config'
import { IMAGE_CACHE_MAX_ENTRIES } from './domain'

const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')
const token = (name: string) => new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)?.[1]

describe('manifiesto', () => {
  const manifest = pwaOptions.manifest as Record<string, unknown>

  it('es instalable: nombre, idioma, modo standalone e iconos existentes', () => {
    expect(manifest).toMatchObject({
      name: 'Miracle Flashcards',
      lang: 'es',
      display: 'standalone',
      start_url: '/mazos',
    })
    const icons = manifest.icons as { src: string; sizes: string }[]
    expect(icons.map((i) => i.sizes)).toEqual(['192x192', '512x512'])
    for (const icon of icons) expect(existsSync(join(process.cwd(), 'public', icon.src))).toBe(true)
  })

  it('los colores repiten los tokens del tema blanco', () => {
    expect(MANIFEST_BACKGROUND).toBe(token('--color-fondo'))
    expect(MANIFEST_THEME).toBe(token('--color-primario'))
    expect(manifest.background_color).toBe(MANIFEST_BACKGROUND)
    expect(manifest.theme_color).toBe(MANIFEST_THEME)
  })
})

describe('service worker', () => {
  const workbox = pwaOptions.workbox!

  it('P-F8: actualización por aviso y sin interfaz (la nueva versión espera)', () => {
    expect(pwaOptions.registerType).toBe('prompt')
  })

  it('precachea el shell y cae a index.html en la navegación sin red', () => {
    expect(workbox.navigateFallback).toBe('/index.html')
    expect(workbox.globPatterns).toEqual(expect.arrayContaining([expect.stringContaining('html')]))
    expect(workbox.navigateFallbackDenylist?.some((r) => r.test('/auth/v1/verify'))).toBe(true)
  })

  it('BR-43, P-F6: imágenes de cualquier origen con CacheFirst, caché images-v1, tope de 200 y respuestas opacas', () => {
    const rule = workbox.runtimeCaching![0]
    expect(rule.handler).toBe('CacheFirst')
    expect(rule.options?.cacheName).toBe('images-v1')
    expect(rule.options?.expiration?.maxEntries).toBe(IMAGE_CACHE_MAX_ENTRIES)
    expect(rule.options?.cacheableResponse?.statuses).toEqual([0, 200])
    const match = rule.urlPattern as (ctx: { request: { destination: string } }) => boolean
    expect(match({ request: { destination: 'image' } })).toBe(true)
    expect(match({ request: { destination: 'script' } })).toBe(false)
  })

  it('el service worker no corre en desarrollo (oculta cambios)', () => {
    expect(pwaOptions.devOptions?.enabled).toBe(false)
  })
})
