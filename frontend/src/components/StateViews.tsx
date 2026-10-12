// Estados obligatorios de lista y pantalla (CLAUDE.md): carga, error y vacío.
import type { ReactNode } from 'react'
import { Button } from './Button'

export function LoadingState({ rows = 3, height = 'h-14' }: { rows?: number; height?: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      <p role="status" className="sr-only">
        Cargando…
      </p>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`${height} animate-pulse rounded-md bg-borde/30`}
        />
      ))}
    </div>
  )
}

export function ErrorState({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex anim-entrada flex-col items-start gap-3 rounded-md border-2 border-error p-4"
    >
      <p className="font-semibold text-error">{text}</p>
      <Button variant="secondary" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}

export function EmptyState({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="flex anim-entrada flex-col items-start gap-3 rounded-md border border-dashed border-borde p-4">
      <p>{text}</p>
      {children}
    </div>
  )
}
