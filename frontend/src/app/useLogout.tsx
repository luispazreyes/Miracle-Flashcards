// Cierre de sesión (RF-41, BR-35): sin cambios pendientes cierra directamente; con ellos pide confirmación
// advirtiendo la pérdida de datos. Al cerrar se borra la base local de la cuenta.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { shell, common } from '../lib/messages.es'
import { useAuth, useRepos, useServices } from './context'

export function useLogout() {
  const services = useServices()
  const { session } = useAuth()
  const repos = useRepos()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  async function perform() {
    const userId = session?.userId
    setConfirming(false)
    await services.auth.signOut()
    navigate('/acceso', { replace: true })
    // Tras la navegación nada lee ya la base de esta cuenta.
    if (userId) setTimeout(() => void services.disposeRuntime(userId, { deleteData: true }), 0)
  }

  async function requestLogout() {
    if ((await repos.outbox.unsynced()) > 0) setConfirming(true)
    else await perform()
  }

  const dialog = (
    <Dialog open={confirming} onClose={() => setConfirming(false)} title={shell.logoutTitle} alert>
      <p className="mb-6">{shell.logoutUnsynced}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" data-autofocus onClick={() => setConfirming(false)}>
          {common.cancel}
        </Button>
        <Button variant="danger" onClick={() => void perform()}>
          {shell.logoutAnyway}
        </Button>
      </div>
    </Dialog>
  )

  return { requestLogout, dialog }
}
