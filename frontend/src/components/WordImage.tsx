// Imagen de una palabra (RF-14, BR-18): el espacio se reserva para evitar saltos de diseño y, si no carga
// (p. ej. sin conexión y nunca vista), se omite sin error ni mensaje.
import { useState } from 'react'

interface Props {
  src: string
  /** Descripción por defecto: "Imagen de la palabra" (F-04). */
  alt?: string
  /** Clases del contenedor: fijan el tamaño reservado. */
  className?: string
}

export function WordImage({ src, alt = 'Imagen de la palabra', className = 'size-12' }: Props) {
  const [state, setState] = useState<{ src: string; status: 'loading' | 'loaded' | 'failed' }>({
    src,
    status: 'loading',
  })
  // Si cambia la URL se vuelve a empezar.
  const status = state.src === src ? state.status : 'loading'
  if (status === 'failed') return null
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-md bg-borde/30 ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setState({ src, status: 'loaded' })}
        onError={() => setState({ src, status: 'failed' })}
        className={`size-full object-cover transition-opacity ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  )
}
