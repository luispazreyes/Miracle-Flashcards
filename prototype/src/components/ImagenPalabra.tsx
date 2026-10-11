import { useState } from 'react'

/** Imagen de palabra con espacio reservado (sin saltos) y degradación silenciosa si no carga (RF-14). */
export function ImagenPalabra({ url, className = 'h-32' }: { url: string; className?: string }) {
  const [estado, setEstado] = useState<'carga' | 'ok' | 'error'>('carga')
  if (estado === 'error') return null
  return (
    <span className={`relative block ${className} ${estado === 'carga' ? 'rounded-md bg-borde/30' : ''}`}>
      <img
        src={url}
        alt="Imagen de la palabra"
        onLoad={() => setEstado('ok')}
        onError={() => setEstado('error')}
        className={`h-full w-auto max-w-full rounded-md object-contain ${estado === 'carga' ? 'opacity-0' : ''}`}
      />
    </span>
  )
}
