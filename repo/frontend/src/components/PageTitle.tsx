import type { ReactNode } from 'react'

/** Título de pantalla: recibe el foco al navegar (prototype-spec §A.5, RF-44) y lo lee el lector de pantalla. */
export function PageTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h1
      id="titulo-pagina"
      tabIndex={-1}
      className={`text-xl font-semibold outline-none focus-visible:outline-solid ${className}`}
    >
      {children}
    </h1>
  )
}
