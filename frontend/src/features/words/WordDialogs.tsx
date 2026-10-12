// Confirmaciones del panel de palabras: borrar palabra (RF-19, BR-15) y quitar de un mazo (RF-40, BR-14).
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import type { Deck, Word } from '../../domain'
import { common, words as t } from '../../lib/messages.es'

interface DeleteProps {
  word: Word | null
  /** En cuántos mazos está (se informa antes de borrar). */
  deckCount: number
  onCancel: () => void
  onConfirm: (word: Word) => void
}

export function DeleteWordDialog({ word, deckCount, onCancel, onConfirm }: DeleteProps) {
  return (
    <Dialog
      open={word !== null}
      onClose={onCancel}
      title={t.deleteTitle(word?.english ?? '')}
      alert
    >
      <p className="mb-6">{t.deleteText(deckCount)}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" data-autofocus onClick={onCancel}>
          {common.cancel}
        </Button>
        <Button variant="danger" onClick={() => word && onConfirm(word)}>
          {t.deleteConfirm}
        </Button>
      </div>
    </Dialog>
  )
}

interface RemoveProps {
  target: { word: Word; deck: Deck } | null
  onCancel: () => void
  onConfirm: (word: Word, deck: Deck) => void
}

export function RemoveFromDeckDialog({ target, onCancel, onConfirm }: RemoveProps) {
  return (
    <Dialog
      open={target !== null}
      onClose={onCancel}
      title={t.removeTitle(target?.word.english ?? '', target?.deck.name ?? '')}
      alert
    >
      <p className="mb-6">{t.removeText}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" data-autofocus onClick={onCancel}>
          {common.cancel}
        </Button>
        <Button variant="danger" onClick={() => target && onConfirm(target.word, target.deck)}>
          {t.removeConfirm}
        </Button>
      </div>
    </Dialog>
  )
}
