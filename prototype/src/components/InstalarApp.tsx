// F-09: instalación PWA. El botón solo aparece cuando el navegador la permite.
import { useEffect, useState } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null)

  useEffect(() => {
    const alOfrecer = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalacion)
    }
    const alInstalar = () => setEvento(null)
    window.addEventListener('beforeinstallprompt', alOfrecer)
    window.addEventListener('appinstalled', alInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', alOfrecer)
      window.removeEventListener('appinstalled', alInstalar)
    }
  }, [])

  if (!evento) return null
  return (
    <Button
      variante="secundario"
      className="text-sm"
      onClick={async () => {
        await evento.prompt()
        await evento.userChoice
        setEvento(null)
      }}
    >
      <Icon name="instalar" className="size-4" />
      Instalar app
    </Button>
  )
}
