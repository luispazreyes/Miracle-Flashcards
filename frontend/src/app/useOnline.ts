import { useSyncExternalStore } from 'react'
import { useServices } from './context'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

/** Estado de conexión (RF-28). Lo decide `services.isOnline` (en pruebas se controla a mano). */
export function useOnline(): boolean {
  const { isOnline } = useServices()
  return useSyncExternalStore(subscribe, isOnline, () => true)
}
