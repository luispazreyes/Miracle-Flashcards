// Barra de avance (F-07): valor numérico y texto además de la barra, nunca solo visual (WCAG 1.4.1).
interface Props {
  percent: number
  label: string
  /** Texto visible y valor accesible, p. ej. "40 % aprendidas (2 de 5)". */
  text: string
}

export function ProgressBar({ percent, label, text }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={text}
        className="h-3 w-full overflow-hidden rounded-pill border border-borde bg-fondo"
      >
        <div
          style={{ width: `${percent}%` }}
          className="h-full bg-primario transition-[width] duration-(--mov-medio) ease-(--mov-curva)"
        />
      </div>
      <p className="text-sm text-texto-suave">{text}</p>
    </div>
  )
}
