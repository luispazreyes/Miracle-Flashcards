// Página de revisión interna (solo en desarrollo, ruta /__ui): todos los componentes base y sus estados,
// sin datos. No forma parte del producto; la sustituye la ruta real en la Fase 5.
import { useState } from 'react'
import { ActionMenu } from '../../components/ActionMenu'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { SkipLink } from '../../components/SkipLink'
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews'
import { panelId, Tabs, tabId } from '../../components/Tabs'
import { TextField } from '../../components/TextField'
import { ToastProvider, useToast } from '../../components/Toast'
import {
  IMAGE_SIDE_LABELS,
  PALETTES,
  PALETTE_LABELS,
  THEMES,
  THEME_LABELS,
  type Palette,
  type Theme,
} from '../../domain/appearance'
import { applyAppearance, readStoredAppearance, storeAppearance } from '../../lib/appearance'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`s-${title}`} className="flex flex-col gap-3">
      <h2 id={`s-${title}`} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Gallery() {
  const { notify } = useToast()
  const [appearance, setAppearance] = useState(readStoredAppearance)
  const [dialog, setDialog] = useState<'none' | 'form' | 'confirm'>('none')
  const [tab, setTab] = useState('one')

  function change(next: Partial<typeof appearance>) {
    const a = { ...appearance, ...next }
    setAppearance(a)
    applyAppearance(a, { animate: true })
    storeAppearance(a)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-4">
      <SkipLink />
      <h1 className="text-xl font-semibold">Componentes base (solo desarrollo)</h1>

      <Section title="Apariencia">
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t: Theme) => (
            <Button
              key={t}
              variant={appearance.theme === t ? 'primary' : 'secondary'}
              aria-pressed={appearance.theme === t}
              onClick={() => change({ theme: t })}
            >
              {THEME_LABELS[t]}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((p: Palette) => (
            <Button
              key={p}
              variant={appearance.backgroundPalette === p ? 'primary' : 'secondary'}
              aria-pressed={appearance.backgroundPalette === p}
              onClick={() => change({ backgroundPalette: p })}
            >
              Fondo {PALETTE_LABELS[p]}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((p: Palette) => (
            <Button
              key={p}
              variant={appearance.cardPalette === p ? 'primary' : 'secondary'}
              aria-pressed={appearance.cardPalette === p}
              onClick={() => change({ cardPalette: p })}
            >
              Tarjeta {PALETTE_LABELS[p]}
            </Button>
          ))}
        </div>
        <p className="rounded-lg bg-tarjeta p-6 text-center text-palabra font-semibold text-sobre-tarjeta shadow-2">
          Palabra de ejemplo
        </p>
        <p className="text-sm text-texto-suave">
          Lado de la imagen: {Object.values(IMAGE_SIDE_LABELS).join(' · ')}
        </p>
      </Section>

      <Section title="Botones">
        <div className="flex flex-wrap gap-2">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="danger">Peligro</Button>
          <Button variant="text">Texto</Button>
          <Button disabled>Deshabilitado</Button>
          <Button loading>Cargando</Button>
        </div>
      </Section>

      <Section title="Campos">
        <TextField label="Correo electrónico" help="Te enviaremos un enlace." />
        <TextField label="Con error" defaultValue="abc" error="Escribe un correo válido." />
      </Section>

      <Section title="Avisos y alertas">
        <Alert kind="info">Información</Alert>
        <Alert kind="success">Hecho</Alert>
        <Alert kind="warning">Imagen sin verificar</Alert>
        <Alert kind="error">No se pudo completar la acción.</Alert>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => notify('Palabra guardada', 'success')}>
            Aviso
          </Button>
          <Button variant="secondary" onClick={() => notify('Error de ejemplo', 'error')}>
            Aviso de error
          </Button>
        </div>
      </Section>

      <Section title="Diálogos y menú">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setDialog('form')}>Abrir diálogo</Button>
          <Button variant="danger" onClick={() => setDialog('confirm')}>
            Confirmar borrado
          </Button>
          <ActionMenu
            label="Más acciones de «Mazo 1»"
            items={[
              { text: 'Renombrar', onSelect: () => notify('Renombrar') },
              { text: 'Borrar', danger: true, onSelect: () => setDialog('confirm') },
            ]}
          />
        </div>
        <Dialog
          open={dialog === 'form'}
          onClose={() => setDialog('none')}
          title="Diálogo de ejemplo"
        >
          <TextField label="Nombre" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialog('none')}>
              Cancelar
            </Button>
            <Button onClick={() => setDialog('none')}>Guardar</Button>
          </div>
        </Dialog>
        <Dialog
          open={dialog === 'confirm'}
          onClose={() => setDialog('none')}
          title="¿Borrar «Mazo 1»?"
          alert
        >
          <p>Esta acción no se puede deshacer.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button data-autofocus variant="secondary" onClick={() => setDialog('none')}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => setDialog('none')}>
              Borrar mazo
            </Button>
          </div>
        </Dialog>
      </Section>

      <Section title="Pestañas">
        <Tabs
          label="Ejemplo"
          prefix="ui"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'one', label: 'Pendientes' },
            { id: 'two', label: 'Aprendidas' },
          ]}
        />
        <div
          role="tabpanel"
          id={panelId('ui', tab)}
          aria-labelledby={tabId('ui', tab)}
          className="p-2"
        >
          Contenido de «{tab === 'one' ? 'Pendientes' : 'Aprendidas'}»
        </div>
      </Section>

      <Section title="Estados">
        <LoadingState rows={2} />
        <ErrorState
          text="No se pudieron cargar los mazos."
          onRetry={() => notify('Reintentando')}
        />
        <EmptyState text="Aún no tienes mazos. Crea el primero.">
          <Button>
            <Icon name="plusCircle" /> Nuevo mazo
          </Button>
        </EmptyState>
      </Section>
    </div>
  )
}

export default function UiGallery() {
  return (
    <ToastProvider>
      <Gallery />
    </ToastProvider>
  )
}
