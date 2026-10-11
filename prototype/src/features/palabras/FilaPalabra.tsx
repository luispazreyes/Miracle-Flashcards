import { ComboboxMazos } from '../../components/ComboboxMazos'
import { Icon } from '../../components/Icon'
import { ImagenPalabra } from '../../components/ImagenPalabra'
import { MenuAcciones, type ItemMenu } from '../../components/MenuAcciones'
import type { Mazo, Palabra } from '../../state/DataContext'

interface Props {
  palabra: Palabra
  /** Mazos a los que pertenece. */
  mazosDePalabra: Mazo[]
  todosLosMazos: Mazo[]
  /** Se muestra la insignia "Sin mazo" resaltada (lista única, RF-34). */
  resaltarSinMazo?: boolean
  arrastrable: boolean
  onArrastreInicio: () => void
  onArrastreFin: () => void
  onAgregar: (mazo: Mazo) => void
  acciones: ItemMenu[]
  /** Borrada o quitada del mazo: la fila sale con transición antes de desaparecer (RF-44). */
  saliendo?: boolean
}

export function FilaPalabra({
  palabra,
  mazosDePalabra,
  todosLosMazos,
  resaltarSinMazo,
  arrastrable,
  onArrastreInicio,
  onArrastreFin,
  onAgregar,
  acciones,
  saliendo,
}: Props) {
  const sinMazo = mazosDePalabra.length === 0
  return (
    <li
      data-palabra-id={palabra.id}
      tabIndex={-1}
      draggable={arrastrable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', palabra.id)
        e.dataTransfer.effectAllowed = 'copy'
        onArrastreInicio()
      }}
      onDragEnd={onArrastreFin}
      className={`${saliendo ? "anim-salida pointer-events-none" : "anim-entrada"} flex min-h-14 flex-wrap items-center gap-3 rounded-md border border-borde p-2 ${
        resaltarSinMazo && sinMazo ? 'bg-grupo-sin' : 'bg-superficie'
      }`}
    >
      {arrastrable && (
        // Decorativa: el arrastre siempre tiene alternativa con "Agregar a mazo" (WCAG 2.5.1).
        <span aria-hidden="true" className="cursor-grab text-texto-suave">
          <Icon name="asa" className="size-6" />
        </span>
      )}
      {palabra.imagen && <ImagenPalabra url={palabra.imagen.url} className="size-12" />}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          <span lang="en">{palabra.ingles}</span>
        </p>
        <p className="text-sm text-texto-suave">
          <span className="sr-only">traducción: </span>
          {palabra.espanol}
        </p>
        <ul className="mt-1 flex flex-wrap gap-1" aria-label="Mazos de la palabra">
          {mazosDePalabra.map((m) => (
            <li key={m.id} className="flex items-center gap-1 rounded-pill border border-borde px-2 text-xs">
              <Icon name="carpeta" className="size-3" />
              {m.nombre}
            </li>
          ))}
          {sinMazo && resaltarSinMazo && (
            <li className="flex items-center gap-1 rounded-pill border border-borde px-2 text-xs">
              <Icon name="guion" className="size-3" />
              Sin mazo
            </li>
          )}
        </ul>
      </div>
      <div className="flex items-center gap-1">
        <ComboboxMazos etiqueta={`Agregar «${palabra.ingles}» a mazo`} mazos={todosLosMazos} onElegir={onAgregar} />
        <MenuAcciones etiqueta={`Más acciones de «${palabra.ingles}»`} items={acciones} />
      </div>
    </li>
  )
}
