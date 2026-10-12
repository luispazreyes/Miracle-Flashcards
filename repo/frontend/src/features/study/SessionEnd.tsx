// F-06 Fin de sesión y mazo sin pendientes (RF-38, BR-07): nunca una sesión vacía ni un callejón sin salida.
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { study as t } from '../../lib/messages.es'
import type { EndReason } from './useStudySession'

interface Props {
  reason: EndReason
  deckId: string
  hits: number
  misses: number
}

const titles: Record<EndReason, string> = {
  completed: t.endTitle,
  noPending: t.noPendingTitle,
  noWords: t.noWordsTitle,
}

const linkClass =
  'flex objetivo-min items-center justify-center rounded-md border-2 px-4 font-semibold transition'

export function SessionEnd({ reason, deckId, hits, misses }: Props) {
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => title.current?.focus(), [])

  return (
    <section className="mx-auto flex w-full max-w-xl anim-entrada flex-col gap-6 rounded-lg bg-superficie p-6 text-center shadow-2">
      {/* El foco va al título al aparecer y se anuncia como estado. */}
      <div role="status">
        <h2 ref={title} tabIndex={-1} className="text-xl font-semibold outline-none">
          {titles[reason]}
        </h2>
      </div>

      {reason === 'completed' && (
        <p className="flex items-center justify-center gap-6 text-xl">
          <span className="flex items-center gap-2 text-exito">
            <Icon name="checkCircle" className="size-6" />
            {t.summaryHits(hits)}
          </span>
          <span className="flex items-center gap-2 text-error">
            <Icon name="error" className="size-6" />
            {t.summaryMisses(misses)}
          </span>
        </p>
      )}
      {reason === 'noWords' && <p>{t.noWordsText}</p>}

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        {reason !== 'noWords' && (
          <Link
            to={`/progreso?deck=${deckId}`}
            className={`${linkClass} border-primario bg-primario text-sobre-primario hover:opacity-90`}
          >
            {t.reactivate}
          </Link>
        )}
        <Link
          to={`/mazos?deck=${deckId}`}
          className={`${linkClass} border-borde text-texto hover:bg-fondo`}
        >
          {t.backToDecks}
        </Link>
      </div>
    </section>
  )
}
