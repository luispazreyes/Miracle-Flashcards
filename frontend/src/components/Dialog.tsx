// Diálogo modal (prototype-spec §A.7): role dialog/alertdialog, aria-modal, foco atrapado, Esc cierra,
// devuelve el foco al disparador. Entrada y salida animadas (RF-44).
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { durationMs } from '../lib/motion'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** alertdialog para confirmaciones destructivas. */
  alert?: boolean
  /** Formularios: pantalla completa en móvil. */
  fullScreenOnMobile?: boolean
  width?: 'md' | 'lg'
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function Dialog({
  open,
  onClose,
  title,
  children,
  alert,
  fullScreenOnMobile,
  width = 'md',
}: Props) {
  const id = useId()
  const box = useRef<HTMLDivElement>(null)
  const previous = useRef<HTMLElement | null>(null)
  // Durante la salida se sigue pintando el último contenido (el padre ya pudo vaciarlo).
  const [shown, setShown] = useState({ title, children })
  if (open && (shown.title !== title || shown.children !== children)) setShown({ title, children })
  const [leaving, setLeaving] = useState(false)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (!open) return
    previous.current = document.activeElement as HTMLElement | null
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    const initial =
      box.current?.querySelector<HTMLElement>('[data-autofocus]') ??
      box.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      box.current
    initial?.focus()
    const node = box.current
    return () => {
      root?.removeAttribute('inert')
      // Solo se restaura si nadie movió el foco a propósito (p. ej. a la fila recién creada).
      const current = document.activeElement
      const noTarget = !current || current === document.body || node?.contains(current)
      const target = previous.current
      if (noTarget && target && document.contains(target)) target.focus()
    }
  }, [open])

  // Salida: se mantiene montado lo que dura la transición; con movimiento reducido, de inmediato.
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza la animación de salida con `open`
      setLeaving(false)
      return
    }
    if (!wasOpen.current) return
    wasOpen.current = false
    const d = durationMs('--mov-medio')
    if (d === 0) return
    setLeaving(true)
    const t = setTimeout(() => setLeaving(false), d)
    return () => clearTimeout(t)
  }, [open])

  if (!open && !leaving) return null
  const { title: shownTitle, children: content } = shown

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const els = [...(box.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
    if (els.length === 0) return
    const first = els[0]
    const lastEl = els[els.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      lastEl.focus()
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- cierre con el ratón; el teclado cierra con Esc
    <div
      data-state={open ? 'open' : 'leaving'}
      className={`fixed inset-0 z-30 flex items-center justify-center bg-texto/50 p-4 max-md:p-0 ${
        open ? 'anim-fundido' : 'pointer-events-none anim-fundido-salida'
      }`}
      onMouseDown={(e) => {
        if (open && e.target === e.currentTarget && !alert) onClose()
      }}
    >
      <div
        ref={box}
        role={alert ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`max-h-full w-full overflow-y-auto rounded-lg bg-superficie p-6 shadow-3 ${
          open ? 'anim-escala' : 'anim-escala-salida'
        } ${width === 'lg' ? 'max-w-lg' : 'max-w-md'} ${
          fullScreenOnMobile ? 'max-md:h-dvh max-md:max-w-none max-md:rounded-none' : ''
        }`}
      >
        <h2 id={`${id}-t`} className="mb-4 text-lg font-semibold">
          {shownTitle}
        </h2>
        {content}
      </div>
    </div>,
    document.body,
  )
}
