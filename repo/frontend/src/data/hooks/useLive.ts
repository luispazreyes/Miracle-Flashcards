// Lecturas reactivas de Dexie (frontend-specs.md §6.2): los datos no se duplican en Context, se leen con
// `useLiveQuery` y la pantalla se actualiza sola al escribir. Aquí además se captura el error de lectura para
// poder mostrar el estado de error con "Reintentar" (CLAUDE.md: vacío, carga y error).
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo, useState } from 'react'

export type Live<T> =
  { status: 'loading' } | { status: 'error'; retry: () => void } | { status: 'ready'; data: T }

type Outcome<T> = { ok: true; data: T } | { ok: false }

export function useLive<T>(querier: () => Promise<T>, deps: readonly unknown[]): Live<T> {
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const outcome = useLiveQuery<Outcome<T>>(
    () =>
      querier().then(
        (data) => ({ ok: true as const, data }),
        () => ({ ok: false as const }),
      ),
    [...deps, attempt],
  )
  // Resultado estable entre renders: se usa como dependencia de useMemo y useEffect en las pantallas.
  return useMemo<Live<T>>(() => {
    if (!outcome) return { status: 'loading' }
    return outcome.ok ? { status: 'ready', data: outcome.data } : { status: 'error', retry }
  }, [outcome, retry])
}
