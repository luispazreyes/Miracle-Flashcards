// Cerrar sesión (RF-41, BR-35): sin pendientes cierra directamente; con ellos pide confirmación.
import { useLogout } from '../../app/useLogout'
import { Button } from '../../components/Button'
import { shell } from '../../lib/messages.es'

export function LogoutButton() {
  const { requestLogout, dialog } = useLogout()
  return (
    <>
      <Button variant="secondary" onClick={() => void requestLogout()}>
        {shell.logout}
      </Button>
      {dialog}
    </>
  )
}
