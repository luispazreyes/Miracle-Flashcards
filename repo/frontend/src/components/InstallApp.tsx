// Botón "Instalar app" (F-09): solo aparece cuando el navegador permite instalar la PWA.
import { Button } from './Button'
import { Icon } from './Icon'

interface Props {
  canInstall: boolean
  onInstall: () => void
}

export function InstallApp({ canInstall, onInstall }: Props) {
  if (!canInstall) return null
  return (
    <Button variant="secondary" onClick={onInstall} className="py-1 text-sm">
      <Icon name="install" />
      Instalar app
    </Button>
  )
}
