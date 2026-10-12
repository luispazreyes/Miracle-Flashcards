// F-05 Sesión de estudio (RF-01 a RF-07, RF-12, RF-13, RF-25, RF-31, RF-35).
import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { usePreference } from '../../app/queries'
import { Icon } from '../../components/Icon'
import { PageTitle } from '../../components/PageTitle'
import { ErrorState, LoadingState } from '../../components/StateViews'
import { DEFAULT_IMAGE_SIDE } from '../../domain'
import { study as t } from '../../lib/messages.es'
import { Flashcard } from './Flashcard'
import { SessionEnd } from './SessionEnd'
import { AnswerButtons, StreakIndicator } from './StudyParts'
import { useStudySession } from './useStudySession'

export function StudyPage() {
  const { deckId = '' } = useParams()
  const { view, flip, answer } = useStudySession(deckId)
  const preference = usePreference()
  const imageSide =
    (preference.status === 'ready' && preference.data?.imageSide) || DEFAULT_IMAGE_SIDE

  const card = useRef<HTMLButtonElement>(null)
  const hit = useRef<HTMLButtonElement>(null)
  const cardId = view.phase === 'front' || view.phase === 'back' ? view.word.id : null
  const phase = view.phase

  // Al voltear, el foco pasa a "Acerté" (F-05); con una tarjeta nueva, vuelve a la tarjeta para seguir con teclado.
  useEffect(() => {
    if (phase === 'back') hit.current?.focus()
    else if (phase === 'front') card.current?.focus()
  }, [phase, cardId])

  if (view.phase === 'loading')
    return (
      <div className="flex flex-col gap-4">
        <PageTitle>{t.title}</PageTitle>
        <LoadingState rows={1} height="h-64" />
      </div>
    )

  if (view.phase === 'error')
    return (
      <div className="flex flex-col gap-4">
        <PageTitle>{t.title}</PageTitle>
        <ErrorState text={t.loadError} onRetry={view.retry} />
      </div>
    )

  const header = (name: string, pending?: number) => (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <PageTitle>{name}</PageTitle>
      <div className="flex items-center gap-3">
        {pending !== undefined && <p className="font-semibold">{t.pending(pending)}</p>}
        <Link
          to={`/mazos?deck=${deckId}`}
          className="flex objetivo-min items-center rounded-md border-2 border-borde px-4 font-semibold transition hover:bg-superficie"
        >
          {t.exit}
        </Link>
      </div>
    </div>
  )

  if (view.phase === 'end')
    return (
      <div className="flex flex-col gap-6">
        {header(view.deckName)}
        <SessionEnd reason={view.reason} deckId={deckId} hits={view.hits} misses={view.misses} />
      </div>
    )

  const flipped = view.phase === 'back'
  return (
    <div className="flex flex-col gap-6">
      {header(view.deckName, view.pendingCount)}

      <p
        role="status"
        className={`flex min-h-6 items-center justify-center gap-2 font-semibold ${
          view.last?.hit ? 'text-exito' : 'text-aviso'
        }`}
      >
        {view.last && (
          <>
            <Icon name={view.last.hit ? 'checkCircle' : 'alert'} />
            {view.last.learned
              ? `«${view.last.english}»: ${t.learned}`
              : view.last.hit
                ? t.resultHit
                : t.resultMiss}
          </>
        )}
      </p>
      {/* Al voltear, la traducción se anuncia (el foco pasa a "Acerté"). */}
      <p role="status" className="sr-only">
        {flipped
          ? [
              t.cardBack(view.word.spanish),
              view.word.example && `${t.example}: ${view.word.example}`,
              view.word.note && `${t.note}: ${view.word.note}`,
            ]
              .filter(Boolean)
              .join('. ')
          : ''}
      </p>

      <div key={view.word.id} className="anim-entrada">
        <Flashcard
          word={view.word}
          flipped={flipped}
          imageSide={imageSide}
          onFlip={flip}
          buttonRef={card}
        />
      </div>

      <StreakIndicator hits={view.entry.consecutiveHits} />

      {flipped && <AnswerButtons onAnswer={answer} hitRef={hit} />}
    </div>
  )
}
