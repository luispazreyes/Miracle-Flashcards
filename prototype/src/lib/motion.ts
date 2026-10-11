// RF-44: duraciones de motion leídas de los tokens (nunca números fijos en los componentes).

/** "240ms" → 240, "0.4s" → 400. Valores < 1 ms (movimiento reducido: 0.01ms) o ilegibles → 0. */
export function parsearDuracion(valor: string): number {
  const m = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(valor)
  if (!m) return 0
  const ms = m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1])
  return ms < 1 ? 0 : ms
}

export function duracionMs(token: '--mov-rapido' | '--mov-medio' | '--mov-volteo' = '--mov-medio'): number {
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
