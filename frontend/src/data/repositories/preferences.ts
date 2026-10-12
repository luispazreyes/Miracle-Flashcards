import { DEFAULT_IMAGE_SIDE, type Preference, type PreferencePatch } from '../../domain'
import { enqueue, writeTx, type RepoDeps } from './context'

type Defaults = Pick<Preference, 'theme' | 'backgroundPalette' | 'cardPalette'>

export function createPreferenceRepository(deps: RepoDeps) {
  const { db } = deps

  return {
    get: () => db.preferences.get(deps.userId),

    /**
     * BR-36: aplica el parche, lo guarda y lo encola. Si aún no había preferencia, se parte de `defaults`
     * (tema del sistema y presets neutros, RF-42) y del lado de imagen inicial (RF-12).
     */
    async update(patch: PreferencePatch, defaults: Defaults): Promise<Preference> {
      return writeTx(deps, async () => {
        const current = await db.preferences.get(deps.userId)
        const base: Preference = current ?? {
          userId: deps.userId,
          ...defaults,
          imageSide: DEFAULT_IMAGE_SIDE,
          updatedAt: deps.now(),
        }
        const next: Preference = { ...base, ...patch, updatedAt: deps.now() }
        await db.preferences.put(next)
        await enqueue(deps, { type: 'preference.update', payload: { patch } })
        return next
      })
    },
  }
}

export type PreferenceRepository = ReturnType<typeof createPreferenceRepository>
