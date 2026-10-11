// RF-44: duraciones de motion leídas de los tokens (nunca números fijos en los componentes).

/** "240ms" → 240, "0.4s" → 400. Valores < 1 ms (movimiento reducido: 0.01ms) o ilegibles → 0. */
export function parsearDuracion(valor: string): number {
  const m = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(valor)
  if (!m) return 0
  const ms = m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1])
  return ms < 1 ? 0 : ms
}

export function duracionMs(token: '--mov-rapido' | '--mov-medio' | '--mov-volteo' | '--mov-deposito' = '--mov-medio'): number {
  return parsearDuracion(getComputedStyle(document.documentElement).getPropertyValue(token))
}

/**
 * Ejecuta `fn` cuando termina la animación de salida. Con movimiento reducido (duración 0)
 * se ejecuta de inmediato: el resultado final es el mismo, solo sin espera.
 */
export function esperarSalida(fn: () => void, token: Parameters<typeof duracionMs>[0] = '--mov-medio') {
  const d = duracionMs(token)
  if (d === 0) fn()
  else setTimeout(fn, d)
}

interface Punto {
  x: number
  y: number
}

/**
 * RF-45: una "ficha" con la palabra viaja desde `desde` (coordenadas de pantalla) hasta el centro de
 * `hacia`. Si `entrar` es true se encoge al llegar (la palabra entra en el mazo); si es false llega
 * a tamaño completo (la palabra vuelve a su sitio). Es decorativa: el resultado ya está aplicado en
 * los datos y anunciado con texto. Con movimiento reducido (duración 0) o sin la API de animaciones
 * se resuelve de inmediato, sin crear nada.
 */
export function volarFicha(texto: string, desde: Punto, hacia: HTMLElement | null, entrar: boolean): Promise<void> {
  const duracion = duracionMs(entrar ? '--mov-deposito' : '--mov-medio')
  if (!hacia || duracion === 0 || typeof HTMLElement.prototype.animate !== 'function') return Promise.resolve()
  const ficha = document.createElement('div')
  ficha.setAttribute('aria-hidden', 'true')
  ficha.className =
    'pointer-events-none fixed left-0 top-0 z-40 rounded-md border border-borde bg-superficie px-3 py-2 font-semibold shadow-2'
  ficha.textContent = texto
  document.body.appendChild(ficha)
  const r = hacia.getBoundingClientRect()
  const w = ficha.offsetWidth
  const h = ficha.offsetHeight
  const a = (p: Punto, escala: number) => `translate(${p.x - w / 2}px, ${p.y - h / 2}px) scale(${escala})`
  const destino = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  const curva = getComputedStyle(document.documentElement).getPropertyValue('--mov-curva').trim() || 'ease'
  const anim = ficha.animate(
    [
      { transform: a(desde, 1), opacity: 1 },
      { transform: a(destino, entrar ? 0.2 : 1), opacity: entrar ? 0 : 1 },
    ],
    { duration: duracion, easing: curva, fill: 'forwards' },
  )
  return new Promise((resolver) => {
    const fin = () => {
      ficha.remove()
      resolver()
    }
    anim.onfinish = fin
    anim.oncancel = fin
  })
}
