// Diálogo modal (§A.7): role dialog/alertdialog, aria-modal, foco atrapado, Esc cierra,
// devuelve el foco al disparador. Entrada y salida animadas (RF-44).
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { duracionMs } from '../lib/motion'

interface Props {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  children: ReactNode
  /** alertdialog para confirmaciones destructivas. */
  alerta?: boolean
  /** Formularios: pantalla completa en móvil. */
  pantallaCompletaMovil?: boolean
  ancho?: 'md' | 'lg'
}

const FOCALIZABLES =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function Dialog({ abierto, onCerrar, titulo, children, alerta, pantallaCompletaMovil, ancho = 'md' }: Props) {
  const id = useId()
  const caja = useRef<HTMLDivElement>(null)
  const previo = useRef<HTMLElement | null>(null)
  // Durante la salida se sigue pintando el último contenido (el padre ya pudo vaciarlo).
  const ultimo = useRef({ titulo, children })
  if (abierto) ultimo.current = { titulo, children }
  const [saliendo, setSaliendo] = useState(false)
  const estabaAbierto = useRef(false)

  useEffect(() => {
    if (!abierto) return
    previo.current = document.activeElement as HTMLElement | null
    const raiz = document.getElementById('root')
    raiz?.setAttribute('inert', '')
    const inicial =
      caja.current?.querySelector<HTMLElement>('[data-autofocus]') ??
      caja.current?.querySelector<HTMLElement>(FOCALIZABLES) ??
      caja.current
    inicial?.focus()
    return () => {
      raiz?.removeAttribute('inert')
      // Solo se restaura si nadie movió el foco a propósito (p. ej. a la fila recién creada).
      const actual = document.activeElement
      const sinDestino = !actual || actual === document.body || caja.current?.contains(actual)
      const destino = previo.current
      if (sinDestino && destino && document.contains(destino)) destino.focus()
    }
  }, [abierto])

  // Salida: se mantiene montado lo que dura la transición; con movimiento reducido, de inmediato.
  useEffect(() => {
    if (abierto) {
      estabaAbierto.current = true
      setSaliendo(false)
      return
    }
    if (!estabaAbierto.current) return
    estabaAbierto.current = false
    const d = duracionMs('--mov-medio')
    if (d === 0) return
    setSaliendo(true)
    const t = setTimeout(() => setSaliendo(false), d)
    return () => clearTimeout(t)
  }, [abierto])

  if (!abierto && !saliendo) return null
  const { titulo: tituloMostrado, children: contenido } = ultimo.current

  function teclas(e: React.KeyboardEvent) {
    if (!abierto) return
    if (e.key === 'Escape') {
      e.stopPropagation()
      onCerrar()
      return
    }
    if (e.key !== 'Tab') return
    const els = [...(caja.current?.querySelectorAll<HTMLElement>(FOCALIZABLES) ?? [])]
    if (els.length === 0) return
    const primero = els[0]
    const ultimoEl = els[els.length - 1]
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault()
      ultimoEl.focus()
    } else if (!e.shiftKey && document.activeElement === ultimoEl) {
      e.preventDefault()
      primero.focus()
    }
  }

  return createPortal(
    <div
      data-estado={abierto ? 'abierto' : 'saliendo'}
      className={`fixed inset-0 z-30 flex items-center justify-center bg-texto/50 p-4 max-md:p-0 ${
        abierto ? 'anim-fundido' : 'anim-fundido-salida pointer-events-none'
      }`}
      onMouseDown={(e) => {
        if (abierto && e.target === e.currentTarget && !alerta) onCerrar()
      }}
    >
      <div
        ref={caja}
        role={alerta ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        tabIndex={-1}
        onKeyDown={teclas}
        className={`max-h-full w-full overflow-y-auto rounded-lg bg-superficie p-6 shadow-3 ${
          abierto ? 'anim-escala' : 'anim-escala-salida'
        } ${ancho === 'lg' ? 'max-w-lg' : 'max-w-md'} ${
          pantallaCompletaMovil ? 'max-md:h-dvh max-md:max-w-none max-md:rounded-none' : ''
        }`}
      >
        <h2 id={`${id}-t`} className="mb-4 text-lg font-semibold">
          {tituloMostrado}
        </h2>
        {contenido}
      </div>
    </div>,
    document.body,
  )
}
