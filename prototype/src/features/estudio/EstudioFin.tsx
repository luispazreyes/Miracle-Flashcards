// F-06 Fin de sesión y mazo sin pendientes — RF-38. Evita el callejón sin salida.
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useTitulo } from '../../lib/texto'

export type TipoFin = 'sesion' | 'sin-pendientes' | 'sin-palabras'

interface Props {
  tipo: TipoFin
  mazoId: string
  nombreMazo: string
  resumen?: { aciertos: number; fallos: number }
}

const TITULO: Record<TipoFin, string> = {
  sesion: '¡Sesión terminada!',
  'sin-pendientes': 'Este mazo no tiene palabras pendientes',
  'sin-palabras': 'Este mazo no tiene palabras',
}

const enlace =
  'objetivo-min inline-flex items-center justify-center rounded-md border px-4 py-2 font-semibold hover:opacity-90'

export function EstudioFin({ tipo, mazoId, nombreMazo, resumen }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null)
  useTitulo(`${TITULO[tipo]} · ${nombreMazo}`)
  useEffect(() => titulo.current?.focus(), [])

  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-lg bg-superficie p-6 text-center shadow-2">
      <div role="status">
        <h1 ref={titulo} tabIndex={-1} className="text-xl font-semibold">
          {TITULO[tipo]}
        </h1>
        <p className="text-texto-suave">«{nombreMazo}»</p>
      </div>

      {tipo === 'sesion' && resumen && (
        <dl className="flex w-full justify-center gap-8 text-xl font-semibold">
          <div className="flex flex-col items-center gap-1 text-exito">
            <dt className="flex items-center gap-1 text-base">
              <Icon name="check" /> Aciertos
            </dt>
            <dd className="text-xl">{resumen.aciertos}</dd>
          </div>
          <div className="flex flex-col items-center gap-1 text-error">
            <dt className="flex items-center gap-1 text-base">
              <Icon name="error" /> Fallos
            </dt>
            <dd className="text-xl">{resumen.fallos}</dd>
          </div>
        </dl>
      )}

      <div className="flex w-full flex-col gap-2 md:flex-row md:justify-center">
        {tipo !== 'sin-palabras' && (
          <Link to={`/progreso?mazo=${mazoId}`} className={`${enlace} border-transparent bg-primario text-sobre-primario`}>
            Reactivar palabras
          </Link>
        )}
        <Link to={`/mazos?mazo=${mazoId}`} className={`${enlace} border-borde text-texto`}>
          Volver a mazos
        </Link>
      </div>
    </section>
  )
}
