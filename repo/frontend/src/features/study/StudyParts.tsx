// Piezas de la sesión de estudio: botones de respuesta (RF-04) e indicador de racha (RF-06, RF-07).
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { LEARNED_THRESHOLD } from '../../domain'
import { study as t } from '../../lib/messages.es'
import type { Ref } from 'react'

/** "Acerté" / "No acerté": icono + texto, nunca solo color (RF-04). Solo existen tras voltear (BR-02). */
export function AnswerButtons({
  onAnswer,
  hitRef,
}: {
  onAnswer: (hit: boolean) => void
  hitRef?: Ref<HTMLButtonElement>
}) {
  return (
    <div role="group" aria-label={t.answerLabel} className="grid grid-cols-2 gap-3">
      <Button ref={hitRef} onClick={() => onAnswer(true)} className="min-h-14">
        <Icon name="check" />
        {t.hit}
      </Button>
      <Button variant="secondary" onClick={() => onAnswer(false)} className="min-h-14">
        <Icon name="close" />
        {t.miss}
      </Button>
    </div>
  )
}

/** "Aciertos seguidos: 1 de 3" como texto y puntos con icono. */
export function StreakIndicator({ hits }: { hits: number }) {
  return (
    <p className="flex items-center justify-center gap-2 text-sm">
      <span>{t.streak(hits, LEARNED_THRESHOLD)}</span>
      <span aria-hidden="true" className="flex gap-1">
        {Array.from({ length: LEARNED_THRESHOLD }, (_, i) => (
          <Icon key={i} name={i < hits ? 'checkCircle' : 'circle'} className="size-4" />
        ))}
      </span>
    </p>
  )
}
