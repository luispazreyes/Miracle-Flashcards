import { useSyncExternalStore } from 'react'

/** Ancho mínimo de dos paneles (prototype-spec §B.3: ≥ 768 px). */
const QUERY = '(min-width: 48rem)'

function subscribe(callback: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

/** `true` en ≥ 768 px (dos paneles); sin matchMedia (pruebas) se asume ancho. */
export function useIsWide(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(QUERY).matches : true),
    () => true,
  )
}
