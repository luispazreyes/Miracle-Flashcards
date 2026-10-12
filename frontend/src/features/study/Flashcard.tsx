// Flashcard (F-05, RF-01, RF-02, RF-25, RF-32, RF-12; BR-01, BR-10). Es un botón; las dos caras están en el DOM y
// su nombre accesible cambia al voltearla. La cara no visible va oculta a los lectores de pantalla.
import type { Ref } from 'react'
import { WordImage } from '../../components/WordImage'
import type { ImageSide, Word } from '../../domain'
import { study as t } from '../../lib/messages.es'

interface Props {
  word: Word
  flipped: boolean
  imageSide: ImageSide
  onFlip: () => void
  buttonRef?: Ref<HTMLButtonElement>
}

const showsImage = (side: ImageSide, face: 'front' | 'back') => side === 'both' || side === face

export function Flashcard({ word, flipped, imageSide, onFlip, buttonRef }: Props) {
  const image = word.imageUrl ? (
    <WordImage src={word.imageUrl} className="h-24 w-full max-w-48" alt="" />
  ) : null

  return (
    <div className="flip mx-auto w-full max-w-xl" data-flipped={flipped}>
      <button
        ref={buttonRef}
        type="button"
        aria-pressed={flipped}
        aria-label={flipped ? t.cardBack(word.spanish) : t.cardFront(word.english)}
        onClick={onFlip}
        className="relative flex min-h-64 w-full rounded-lg border-2 border-borde bg-tarjeta text-sobre-tarjeta shadow-2 transition-shadow hover:shadow-3"
      >
        <span className="flip-inner flex-1">
          <span
            aria-hidden={flipped || undefined}
            className="flip-face flip-face-front flex flex-col items-center justify-center gap-3 rounded-lg p-6 text-center"
          >
            {showsImage(imageSide, 'front') && image}
            <span lang="en" className="text-palabra font-semibold">
              {word.english}
            </span>
            <span className="text-sm opacity-80">{t.flipHint}</span>
          </span>
          <span
            aria-hidden={!flipped || undefined}
            className="flip-face flip-face-back flex flex-col items-center justify-center gap-3 rounded-lg p-6 text-center"
          >
            {showsImage(imageSide, 'back') && image}
            <span className="text-palabra font-semibold">{word.spanish}</span>
            {word.example && (
              <span className="text-base">
                <span className="font-semibold">{t.example}: </span>
                <span lang="en">{word.example}</span>
              </span>
            )}
            {word.note && (
              <span className="text-base">
                <span className="font-semibold">{t.note}: </span>
                {word.note}
              </span>
            )}
          </span>
        </span>
      </button>
    </div>
  )
}
