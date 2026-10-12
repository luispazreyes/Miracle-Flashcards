// F-07 Progreso y reactivación (RF-26, RF-27, RF-30; BR-09, BR-38): contadores, barra, pestañas y "Reactivar".
import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useRepos } from '../../app/context'
import { useDeckWords, useDecks, useWords } from '../../app/queries'
import { Button } from '../../components/Button'
import { PageTitle } from '../../components/PageTitle'
import { ProgressBar } from '../../components/ProgressBar'
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews'
import { Tabs, panelId, tabId } from '../../components/Tabs'
import { useToast } from '../../components/Toast'
import { counters, LEARNED_THRESHOLD, type DeckWord, type Word } from '../../domain'
import { common, progress as t } from '../../lib/messages.es'
import { useAnimatedList } from '../../lib/useAnimatedList'

type Tab = 'pending' | 'learned'
type Entry = DeckWord & { word: Word }
const PREFIX = 'progreso'

export function ProgressPage() {
  const decks = useDecks()
  const words = useWords()
  const deckWords = useDeckWords()
  const repos = useRepos()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('pending')
  const panel = useRef<HTMLDivElement>(null)

  const deckList = useMemo(() => (decks.status === 'ready' ? decks.data : []), [decks])
  const requested = params.get('deck')
  const deck = deckList.find((d) => d.id === requested) ?? deckList[0] ?? null
  const deckId = deck?.id ?? null

  const wordById = useMemo(
    () => new Map((words.status === 'ready' ? words.data : []).map((w) => [w.id, w])),
    [words],
  )
  const entries = useMemo<Entry[]>(
    () =>
      (deckWords.status === 'ready' ? deckWords.data : [])
        .filter((d) => d.deckId === deckId && wordById.has(d.wordId))
        .map((d) => ({ ...d, word: wordById.get(d.wordId) as Word }))
        .sort((a, b) => a.word.normalizedEnglish.localeCompare(b.word.normalizedEnglish, 'es')),
    [deckWords, deckId, wordById],
  )
  const pending = useMemo(() => entries.filter((e) => e.status === 'pending'), [entries])
  const learned = useMemo(() => entries.filter((e) => e.status === 'learned'), [entries])
  const pendingRows = useAnimatedList(pending, (e) => e.wordId)
  const learnedRows = useAnimatedList(learned, (e) => e.wordId)

  if (decks.status === 'loading' || words.status === 'loading' || deckWords.status === 'loading')
    return (
      <div className="flex flex-col gap-4">
        <PageTitle>{t.title}</PageTitle>
        <LoadingState />
      </div>
    )
  if (decks.status === 'error' || words.status === 'error' || deckWords.status === 'error')
    return (
      <div className="flex flex-col gap-4">
        <PageTitle>{t.title}</PageTitle>
        <ErrorState
          text={t.loadError}
          onRetry={() => {
            for (const q of [decks, words, deckWords]) if (q.status === 'error') q.retry()
          }}
        />
      </div>
    )

  if (deckList.length === 0)
    return (
      <div className="flex flex-col gap-4">
        <PageTitle>{t.title}</PageTitle>
        <EmptyState text={t.noDecks}>
          <Link
            to="/mazos"
            className="flex objetivo-min items-center rounded-md border-2 border-borde px-4 font-semibold hover:bg-superficie"
          >
            {t.goToDecks}
          </Link>
        </EmptyState>
      </div>
    )

  const c = counters(entries)

  async function reactivate(entry: Entry) {
    try {
      await repos.progress.reactivate(entry.deckId, entry.wordId)
      notify(t.reactivated(entry.word.english, deck?.name ?? ''))
      panel.current?.focus()
    } catch {
      notify(common.genericError, 'error')
    }
  }

  const rows = tab === 'pending' ? pendingRows : learnedRows
  const visible = tab === 'pending' ? pending : learned

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>{t.title}</PageTitle>

      <div className="flex max-w-sm flex-col gap-1">
        <label htmlFor="progreso-mazo" className="font-semibold">
          {t.deckLabel}
        </label>
        <select
          id="progreso-mazo"
          value={deckId ?? ''}
          onChange={(e) => setParams({ deck: e.target.value }, { replace: true })}
          className="objetivo-min rounded-md border border-borde bg-fondo px-3 text-base text-texto"
        >
          {deckList.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {c.total === 0 ? (
        <EmptyState text={t.noWords} />
      ) : (
        <>
          <ul aria-label={t.countersLabel} className="flex flex-wrap gap-6 text-lg font-semibold">
            <li>{t.pendingCount(c.pending)}</li>
            <li>{t.learnedCount(c.learned)}</li>
          </ul>
          <ProgressBar
            percent={c.percent}
            label={t.barLabel}
            text={t.barText(c.percent, c.learned, c.total)}
          />

          <Tabs
            label={t.tabsLabel}
            prefix={PREFIX}
            active={tab}
            onChange={(id) => setTab(id as Tab)}
            tabs={[
              { id: 'pending', label: `${t.tabPending} (${c.pending})` },
              { id: 'learned', label: `${t.tabLearned} (${c.learned})` },
            ]}
          />
          <div
            ref={panel}
            role="tabpanel"
            tabIndex={-1}
            id={panelId(PREFIX, tab)}
            aria-labelledby={tabId(PREFIX, tab)}
            className="flex flex-col gap-2 outline-none"
          >
            {visible.length === 0 && (
              <EmptyState text={tab === 'pending' ? t.emptyPending : t.emptyLearned} />
            )}
            <ul className="flex flex-col gap-2">
              {rows.map(({ item, leaving }) => (
                <li
                  key={item.wordId}
                  inert={leaving || undefined}
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-md border border-borde bg-superficie p-2 ${
                    leaving ? 'anim-salida' : 'anim-entrada'
                  }`}
                >
                  <div className="min-w-0">
                    <p lang="en" className="truncate font-semibold">
                      {item.word.english}
                    </p>
                    <p className="truncate text-texto-suave">{item.word.spanish}</p>
                    {item.status === 'pending' && (
                      <p className="text-sm">{t.streak(item.consecutiveHits, LEARNED_THRESHOLD)}</p>
                    )}
                  </div>
                  {item.status === 'learned' && (
                    <Button
                      variant="secondary"
                      aria-label={t.reactivateAria(item.word.english)}
                      onClick={() => void reactivate(item)}
                    >
                      {t.reactivate}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
