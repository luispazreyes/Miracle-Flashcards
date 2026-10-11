// Flashcard (F-05): un botón accesible que voltea. RF-01, RF-02, RF-12, RF-14, RF-32.
import { forwardRef } from 'react'
import { ImagenPalabra } from '../../components/ImagenPalabra'
import type { Palabra } from '../../state/DataContext'
import type { LadoImagen } from '../../state/PrefsContext'

interface Props {
  palabra: Palabra
  volteada: boolean
  onVoltear: () => void
  ladoImagen: LadoImagen
  /** RF-14: sin conexión, las imágenes no vistas se omiten sin error. */
  sinConexion: boolean
}

const cara =
  'col-start-1 row-start-1 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-borde bg-tarjeta p-6 text-center text-sobre-tarjeta shadow-2 [backface-visibility:hidden]'

export const Flashcard = forwardRef<HTMLButtonElement, Props>(function Flashcard(
  { palabra, volteada, onVoltear, ladoImagen, sinConexion },
  ref,
) {
  const hayImagen = !!palabra.imagen
  const mostrarImagen = (lado: 'frente' | 'reverso') =>
    hayImagen && !sinConexion && (ladoImagen === 'ambos' || ladoImagen === lado)
  const imagenOmitida = hayImagen && sinConexion

  return (
    <div className="[perspective:1000px]">
      <button
        ref={ref}
        type="button"
        aria-pressed={volteada}
        aria-label={
          volteada
            ? `Traducción: ${palabra.espanol}`
            : `Tarjeta: ${palabra.ingles}. Pulsa para ver la traducción`
        }
        onClick={onVoltear}
        className="block w-full rounded-lg text-center"
      >
        <span
          className={`grid min-h-64 transition-transform duration-[var(--mov-volteo)] ease-[var(--mov-curva)] [transform-style:preserve-3d] ${
            volteada ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          <span className={cara} aria-hidden={volteada}>
            {mostrarImagen('frente') && <ImagenPalabra url={palabra.imagen!.url} />}
            <span lang="en" className="text-palabra font-semibold break-words">
              {palabra.ingles}
            </span>
            {imagenOmitida && ladoImagen !== 'reverso' && (
              <span className="text-sm">Imagen no disponible sin conexión.</span>
            )}
          </span>
          <span className={`${cara} [transform:rotateY(180deg)]`} aria-hidden={!volteada}>
            {mostrarImagen('reverso') && <ImagenPalabra url={palabra.imagen!.url} />}
            <span className="text-palabra font-semibold break-words">{palabra.espanol}</span>
            {palabra.ejemplo && <span className="text-base">{palabra.ejemplo}</span>}
            {palabra.nota && <span className="text-sm">{palabra.nota}</span>}
            {imagenOmitida && ladoImagen !== 'frente' && (
              <span className="text-sm">Imagen no disponible sin conexión.</span>
            )}
          </span>
        </span>
      </button>
    </div>
  )
})
