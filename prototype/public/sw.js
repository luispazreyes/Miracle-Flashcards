// Service worker del prototipo (RF-28: funcionar sin conexión).
// Estrategia: red primero con copia en caché; si no hay red, se sirve la copia. Navegación: index.html.
const CACHE = 'mf-prototipo-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest'])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  e.respondWith(
    fetch(request)
      .then((res) => {
        const copia = res.clone()
        caches.open(CACHE).then((c) => c.put(request, copia))
        return res
      })
      .catch(() => caches.match(request).then((r) => r ?? (request.mode === 'navigate' ? caches.match('/') : Response.error()))),
  )
})
