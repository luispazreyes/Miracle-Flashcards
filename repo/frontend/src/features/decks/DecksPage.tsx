// F-02 + F-03: mazos a la izquierda y palabras a la derecha (≥ 768 px); en móvil, pestañas "Mazos | Palabras"
// (prototype-spec §B.3). El mazo seleccionado vive en la URL (`?deck=`).
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { DragProvider } from '../../app/DragContext'
import { PageTitle } from '../../components/PageTitle'
import { Tabs, panelId, tabId } from '../../components/Tabs'
import { decks as t } from '../../lib/messages.es'
import { useIsWide } from '../../lib/useIsWide'
import { WordsPanel } from '../words/WordsPanel'
import { DecksPane } from './DecksPane'

type Tab = 'decks' | 'words'
const PREFIX = 'mazos'

export function DecksPage() {
  const wide = useIsWide()
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('deck')
  const [tab, setTab] = useState<Tab>('decks')

  function select(id: string | null) {
    setParams(id ? { deck: id } : {}, { replace: true })
    // En móvil, elegir un mazo lleva a sus palabras.
    if (!wide) setTab('words')
  }

  const decksPane = <DecksPane selectedId={selectedId} onSelect={select} />
  const wordsPane = <WordsPanel selectedDeckId={selectedId} />

  return (
    <DragProvider>
      <div className="flex flex-col gap-4">
        <PageTitle>{t.title}</PageTitle>
        {wide ? (
          <div className="grid grid-cols-[var(--ancho-panel-mazos)_1fr] items-start gap-6">
            <section aria-label={t.tabDecks}>{decksPane}</section>
            <section aria-label={t.tabWords}>{wordsPane}</section>
          </div>
        ) : (
          <>
            <Tabs
              label={t.tabsLabel}
              prefix={PREFIX}
              active={tab}
              onChange={(id) => setTab(id as Tab)}
              tabs={[
                { id: 'decks', label: t.tabDecks },
                { id: 'words', label: t.tabWords },
              ]}
            />
            <div role="tabpanel" id={panelId(PREFIX, tab)} aria-labelledby={tabId(PREFIX, tab)}>
              {tab === 'decks' ? decksPane : wordsPane}
            </div>
          </>
        )}
      </div>
    </DragProvider>
  )
}
