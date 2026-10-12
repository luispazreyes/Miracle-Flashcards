// Confirmación de borrado de mazo (RF-19, RF-24, BR-20): las palabras se conservan y quedan "Sin mazo".
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import type { Deck } from '../../domain'
import { common, decks as t } from '../../lib/messages.es'

interface Props {
  deck: Deck | null
  onCancel: () => void
  onConfirm: (deck: Deck) => void
}

export function DeleteDeckDialog({ deck, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={deck !== null} onClose={onCancel} title={t.deleteTitle(deck?.name ?? '')} alert>
      <p className="mb-6">{t.deleteText}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" data-autofocus onClick={onCancel}>
          {common.cancel}
        </Button>
        <Button variant="danger" onClick={() => deck && onConfirm(deck)}>
          {t.deleteConfirm}
        </Button>
      </div>
    </Dialog>
  )
}
