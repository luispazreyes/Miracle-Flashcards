// Pestañas (patrón tablist): flechas, Inicio y Fin; el panel lo pinta quien llama con aria-labelledby.
export interface TabItem {
  id: string
  label: string
}

interface Props {
  label: string
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  /** Prefijo para ids: `${prefix}-tab-${id}` y `${prefix}-panel-${id}`. */
  prefix: string
  className?: string
}

export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`

export function Tabs({ label, tabs, active, onChange, prefix, className = '' }: Props) {
  function onKeyDown(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === active)
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].id)
    requestAnimationFrame(() => document.getElementById(tabId(prefix, tabs[next].id))?.focus())
  }

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- el foco lo gestionan las pestañas (roving tabindex)
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex gap-1 ${className}`}
    >
      {tabs.map((t) => {
        const selected = t.id === active
        return (
          <button
            key={t.id}
            id={tabId(prefix, t.id)}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={panelId(prefix, t.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`objetivo-min flex-1 rounded-md border-2 px-4 font-semibold transition-colors ${
              selected
                ? 'border-primario bg-primario text-sobre-primario'
                : 'border-borde text-texto hover:bg-superficie'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
