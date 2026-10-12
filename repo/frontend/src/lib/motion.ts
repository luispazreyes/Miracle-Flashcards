// RF-44: duraciones de motion leídas de los tokens (nunca números fijos en los componentes).
// flyChip (RF-45) anima la ficha de una palabra al depositarla en un mazo o al volver a su sitio.

export type MotionToken = '--mov-rapido' | '--mov-medio' | '--mov-volteo' | '--mov-deposito'

/** "240ms" → 240, "0.4s" → 400. Valores < 1 ms (movimiento reducido: 0.01ms) o ilegibles → 0. */
export function parseDuration(value: string): number {
  const m = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(value)
  if (!m) return 0
  const ms = m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1])
  return ms < 1 ? 0 : ms
}

export function durationMs(token: MotionToken = '--mov-medio'): number {
  return parseDuration(getComputedStyle(document.documentElement).getPropertyValue(token))
}

/**
 * Ejecuta `fn` cuando termina la animación de salida. Con movimiento reducido (duración 0)
 * se ejecuta de inmediato: el resultado final es el mismo, solo sin espera.
 */
export function waitForExit(fn: () => void, token: MotionToken = '--mov-medio'): void {
  const d = durationMs(token)
  if (d === 0) fn()
  else setTimeout(fn, d)
}

export interface Point {
  x: number
  y: number
}

/**
 * Anima la ficha (Web Animations API) desde `from` hasta `to` (esquinas superiores izquierdas, en px de
 * ventana), encogiéndola y desvaneciéndola si `shrink`. Usa el token de motion indicado: `--mov-deposito` al
 * entrar en un mazo y `--mov-medio` al volver (RF-45). Con movimiento reducido (duración 0), o sin soporte de
 * `animate` (jsdom), no anima y resuelve de inmediato: el cambio es instantáneo.
 */
export async function flyChip(
  chip: HTMLElement,
  from: Point,
  to: Point,
  { token, shrink }: { token: MotionToken; shrink: boolean },
): Promise<void> {
  const duration = durationMs(token)
  if (duration === 0 || typeof chip.animate !== 'function') return
  const easing =
    getComputedStyle(document.documentElement).getPropertyValue('--mov-curva').trim() || 'ease'
  const animation = chip.animate(
    [
      { transform: `translate(${from.x}px, ${from.y}px) scale(1)`, opacity: 1 },
      {
        transform: `translate(${to.x}px, ${to.y}px) scale(${shrink ? 0.2 : 1})`,
        opacity: shrink ? 0 : 1,
      },
    ],
    { duration, easing, fill: 'forwards' },
  )
  try {
    await animation.finished
  } catch {
    // Animación cancelada (p. ej. el componente se desmontó): no hay nada que esperar.
  }
}
