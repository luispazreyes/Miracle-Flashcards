// Estados obligatorios de lista/pantalla (§B.3): carga, error, vacío.
import type { ReactNode } from 'react'
import { Button } from './Button'

export function Esqueleto({ filas = 3, alto = 'h-14' }: { filas?: number; alto?: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      <p role="status" className="sr-only">
        Cargando…
      </p>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} aria-hidden="true" className={`${alto} animate-pulse rounded-md bg-borde/30`} />
      ))}
    </div>
  )
}

export function EstadoError({ texto, onReintentar }: { texto: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-md border-2 border-error p-4">
      <p className="font-semibold text-error">{texto}</p>
      <Button variante="secundario" onClick={onReintentar}>
        Reintentar
      </Button>
    </div>
  )
}

export function EstadoVacio({ texto, children }: { texto: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-borde p-4">
      <p>{texto}</p>
      {children}
    </div>
  )
}
