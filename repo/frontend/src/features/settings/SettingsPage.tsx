// F-08 Apariencia y preferencias (RF-10, RF-11, RF-12, RF-41, RF-42; BR-35, BR-36, BR-37). Los cambios se aplican
// al instante, sin botón "Guardar" y sin mover el foco.
import { useEffect, useState } from 'react'
import { useAuth } from '../../app/context'
import { hasPendingPreferenceWrites, useUpdatePreferences } from '../../app/preferences'
import { usePreference } from '../../app/queries'
import { PageTitle } from '../../components/PageTitle'
import { ErrorState, LoadingState } from '../../components/StateViews'
import { useToast } from '../../components/Toast'
import {
  DEFAULT_IMAGE_SIDE,
  type ImageSide,
  type Palette,
  type PreferencePatch,
  type Theme,
} from '../../domain'
import { readStoredAppearance } from '../../lib/appearance'
import { common, settings as t } from '../../lib/messages.es'
import { CardPreview } from './CardPreview'
import { LogoutButton } from './LogoutButton'
import { ImageSidePicker, PalettePicker, ThemePicker } from './Pickers'

const SAVED_MS = 2500

interface Current {
  theme: Theme
  backgroundPalette: Palette
  cardPalette: Palette
  imageSide: ImageSide
}

export function SettingsPage() {
  const preference = usePreference()
  const update = useUpdatePreferences()
  const { session } = useAuth()
  const { notify } = useToast()
  const [saved, setSaved] = useState(false)
  // Lo que el usuario acaba de elegir se ve al instante, sin esperar a que la base lo confirme.
  const [chosen, setChosen] = useState<Partial<Record<keyof Current, string>>>({})
  const [seen, setSeen] = useState(preference)
  if (seen !== preference && !hasPendingPreferenceWrites()) {
    setSeen(preference)
    setChosen({})
  }

  useEffect(() => {
    if (!saved) return
    const id = setTimeout(() => setSaved(false), SAVED_MS)
    return () => clearTimeout(id)
  }, [saved])

  if (preference.status === 'loading')
    return (
      <div className="flex flex-col gap-4">
        <PageTitle>{t.title}</PageTitle>
        <LoadingState />
      </div>
    )
  if (preference.status === 'error')
    return (
      <div className="flex flex-col gap-4">
        <PageTitle>{t.title}</PageTitle>
        <ErrorState text={t.loadError} onRetry={preference.retry} />
      </div>
    )

  // Sin preferencia guardada rige el sistema (RF-42): se muestra lo que está aplicado ahora.
  const stored = readStoredAppearance()
  const fromStore = {
    theme: preference.data?.theme ?? stored.theme,
    backgroundPalette: preference.data?.backgroundPalette ?? stored.backgroundPalette,
    cardPalette: preference.data?.cardPalette ?? stored.cardPalette,
    imageSide: preference.data?.imageSide ?? DEFAULT_IMAGE_SIDE,
  }
  const current = { ...fromStore, ...chosen } as Current

  async function change(patch: PreferencePatch) {
    setChosen((c) => ({ ...c, ...patch }))
    try {
      await update(patch)
      setSaved(true)
    } catch {
      notify(common.genericError, 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{t.title}</PageTitle>

      <div className="grid items-start gap-8 md:grid-cols-2">
        <section aria-labelledby="ajustes-apariencia" className="flex flex-col gap-6">
          <h2 id="ajustes-apariencia" className="text-lg font-semibold">
            {t.appearance}
          </h2>
          <ThemePicker value={current.theme} onChange={(theme) => void change({ theme })} />
          <PalettePicker
            kind="background"
            value={current.backgroundPalette}
            onChange={(backgroundPalette) => void change({ backgroundPalette })}
          />
          <PalettePicker
            kind="card"
            value={current.cardPalette}
            onChange={(cardPalette) => void change({ cardPalette })}
          />
          <ImageSidePicker
            value={current.imageSide}
            onChange={(imageSide) => void change({ imageSide })}
          />
          <p role="status" className="min-h-6 font-semibold text-exito">
            {saved ? t.saved : ''}
          </p>
        </section>

        <CardPreview imageSide={current.imageSide} />
      </div>

      <section aria-labelledby="ajustes-cuenta" className="flex flex-col gap-3">
        <h2 id="ajustes-cuenta" className="text-lg font-semibold">
          {t.account}
        </h2>
        {session && <p>{t.signedInAs(session.email)}</p>}
        <div>
          <LogoutButton />
        </div>
      </section>
    </div>
  )
}
