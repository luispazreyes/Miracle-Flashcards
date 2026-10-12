// Preferencias de apariencia (RF-10, RF-11, RF-12, RF-42; BR-36): se aplican al instante, se guardan en Dexie y
// en el espejo `mf:prefs` (para pintar bien antes del primer render) y se sincronizan con la cola de salida.
import { useCallback, useEffect, useRef } from 'react'
import type { Preference, PreferencePatch } from '../domain'
import {
  applyAppearance,
  defaultAppearance,
  readStoredAppearance,
  storeAppearance,
} from '../lib/appearance'
import { useRepos } from './context'
import { usePreference } from './queries'

/** Cambios del usuario aún sin confirmar en la base: mientras haya alguno, la base no pisa lo que se ve. */
let pendingWrites = 0

/** ¿Hay cambios del usuario aún sin confirmar? (las pantallas no deben pisar lo elegido). */
export const hasPendingPreferenceWrites = () => pendingWrites > 0

const appearanceOf = (p: Preference) => ({
  theme: p.theme,
  backgroundPalette: p.backgroundPalette,
  cardPalette: p.cardPalette,
})

/**
 * Aplica la preferencia guardada (también la que llega de otro dispositivo). La primera aplicación no anima;
 * los cambios posteriores sí, con --mov-medio (RF-44).
 */
export function useApplyPreferences() {
  const preference = usePreference()
  const data = preference.status === 'ready' ? preference.data : null
  const applied = useRef(false)
  const theme = data?.theme
  const backgroundPalette = data?.backgroundPalette
  const cardPalette = data?.cardPalette

  useEffect(() => {
    if (!theme || !backgroundPalette || !cardPalette) return
    if (pendingWrites > 0) return // el usuario está cambiando cosas: manda lo que ve
    const next = { theme, backgroundPalette, cardPalette }
    applyAppearance(next, { animate: applied.current })
    storeAppearance(next)
    applied.current = true
  }, [theme, backgroundPalette, cardPalette])
}

/** Cambia una preferencia: se ve al instante y se persiste después (sin mover el foco). */
export function useUpdatePreferences() {
  const repos = useRepos()
  return useCallback(
    async (patch: PreferencePatch) => {
      const current = readStoredAppearance()
      const next = {
        theme: patch.theme ?? current.theme,
        backgroundPalette: patch.backgroundPalette ?? current.backgroundPalette,
        cardPalette: patch.cardPalette ?? current.cardPalette,
      }
      applyAppearance(next, { animate: true })
      storeAppearance(next)
      pendingWrites++
      try {
        await repos.preferences.update(patch, defaultAppearance())
      } finally {
        pendingWrites--
        // Con todo confirmado, lo guardado es lo que manda (también si llegaron cambios de otro dispositivo).
        if (pendingWrites === 0) {
          const saved = await repos.preferences.get()
          // Otro cambio pudo empezar mientras se leía: en ese caso manda lo que el usuario ve.
          if (saved && pendingWrites === 0) {
            applyAppearance(appearanceOf(saved))
            storeAppearance(appearanceOf(saved))
          }
        }
      }
    },
    [repos],
  )
}
