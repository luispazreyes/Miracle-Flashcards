import { useState } from 'react'
import { ComboboxMazos } from '../../components/ComboboxMazos'
import { Icon } from '../../components/Icon'
import { ImagenPalabra } from '../../components/ImagenPalabra'
import { MenuAcciones, type ItemMenu } from '../../components/MenuAcciones'
import { volarFicha } from '../../lib/motion'
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
  /** Contador que sube al agregar con el menú (RF-45): cada cambio dispara un pulso breve de la fila. */
  pulso?: number
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
  pulso = 0,
}: Props) {
  const sinMazo = mazosDePalabra.length === 0
  const [enArrastre, setEnArrastre] = useState(false)
  return (
    <li
      data-palabra-id={palabra.id}
      tabIndex={-1}
      draggable={arrastrable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', palabra.id)
        e.dataTransfer.effectAllowed = 'copy'
        // RF-45: la imagen que sigue al puntero es una copia elevada (sombra y ligera escala).
        const el = e.currentTarget
        const copia = el.cloneNode(true) as HTMLElement
        copia.removeAttribute('data-palabra-id')
        copia.className += ' shadow-3 scale-[var(--mov-escala-elevada)] fixed -left-[999px] top-0'
        copia.style.width = `${el.offsetWidth}px`
        document.body.appendChild(copia)
        e.dataTransfer.setDragImage?.(copia, 16, 16)
        setTimeout(() => copia.remove(), 0)
        // La fila original queda atenuada como hueco (después de que el navegador tome la imagen).
        setTimeout(() => setEnArrastre(true), 0)
        onArrastreInicio()
      }}
      onDragEnd={(e) => {
        setEnArrastre(false)
        // Soltada fuera de un mazo válido, o cancelada con Escape: vuelve animada a su sitio (RF-45).
        if (e.dataTransfer.dropEffect === 'none' && (e.clientX || e.clientY)) {
          void volarFicha(palabra.ingles, { x: e.clientX, y: e.clientY }, e.currentTarget, false)
        }
        onArrastreFin()
      }}
      data-arrastrando={enArrastre || undefined}
      className={`${saliendo ? "anim-salida pointer-events-none" : "anim-entrada"} relative flex min-h-14 transition-[opacity,border-color,background-color] ${
        enArrastre ? 'opacity-40' : ''
      } hover:border-primario flex-wrap items-center gap-3 rounded-md border border-borde p-2 ${
        resaltarSinMazo && sinMazo ? 'bg-grupo-sin' : 'bg-superficie'
      }`}
    >
      {pulso > 0 && (
        <span
          key={pulso}
          aria-hidden="true"
          className="anim-pulso-anillo pointer-events-none absolute inset-0 rounded-md border-2 border-exito"
        />
      )}
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
