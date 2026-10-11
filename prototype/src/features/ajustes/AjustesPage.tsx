// F-08 Apariencia y preferencias — RF-10, RF-11, RF-12, RF-42 (+ cerrar sesión, RF-41).
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { useTitulo } from '../../lib/texto'
import { useAuth } from '../../state/AuthContext'
import { usePrefs, type LadoImagen, type Tema } from '../../state/PrefsContext'
import { useSync } from '../../state/SyncContext'
import { MUESTRA_FONDO, NOMBRES_PRESET, TARJETAS, type PresetFondo } from '../../styles/presets'

const TEMAS: { valor: Tema; etiqueta: string }[] = [
  { valor: 'azul', etiqueta: 'Azul' },
  { valor: 'blanco', etiqueta: 'Blanco' },
  { valor: 'oscuro', etiqueta: 'Oscuro' },
]
const LADOS: { valor: LadoImagen; etiqueta: string }[] = [
  { valor: 'frente', etiqueta: 'Frente' },
  { valor: 'reverso', etiqueta: 'Reverso' },
  { valor: 'ambos', etiqueta: 'Ambos' },
]
const PRESETS = Object.keys(NOMBRES_PRESET) as PresetFondo[]
const VISIBLE_GUARDADO_MS = 2500

function Opcion({
  nombre,
  valor,
  marcado,
  onElegir,
  muestra,
  etiqueta,
}: {
  nombre: string
  valor: string
  marcado: boolean
  onElegir: () => void
  muestra?: ReactNode
  etiqueta: string
}) {
  return (
    <label
      className={`objetivo-min flex cursor-pointer items-center gap-3 rounded-md border-2 px-3 py-2 transition-colors ${
        marcado ? 'border-primario bg-superficie' : 'border-borde'
      }`}
    >
      <input type="radio" name={nombre} value={valor} checked={marcado} onChange={onElegir} className="size-5 accent-primario" />
      {muestra}
      <span className="font-semibold">{etiqueta}</span>
    </label>
  )
}

function Grupo({ leyenda, children }: { leyenda: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-lg font-semibold">{leyenda}</legend>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export function AjustesPage() {
  useTitulo('Ajustes')
  const prefs = usePrefs()
  const { cerrarSesion } = useAuth()
  const { estado: sync } = useSync()
  const navigate = useNavigate()
  const [confirmando, setConfirmando] = useState(false)
  const [mostrarGuardado, setMostrarGuardado] = useState(false)

  useEffect(() => {
    if (!prefs.guardadoEn) return
    setMostrarGuardado(true)
    const t = setTimeout(() => setMostrarGuardado(false), VISIBLE_GUARDADO_MS)
    return () => clearTimeout(t)
  }, [prefs.guardadoEn])

  function salir() {
    cerrarSesion()
    navigate('/acceso')
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 tabIndex={-1} className="text-xl font-semibold">
          Ajustes
        </h1>
        {/* Cambios del tema, paleta o imagen: se aplican al instante, sin botón Guardar */}
        <p role="status" className="flex items-center gap-1 text-sm font-semibold text-exito">
          {mostrarGuardado && (
            <>
              <Icon name="check" className="size-4" />
              Guardado
            </>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-6 md:grid md:grid-cols-[1fr_20rem] md:items-start">
        <div className="flex flex-col gap-6">
          <Grupo leyenda="Tema">
            {TEMAS.map((t) => (
              <Opcion
                key={t.valor}
                nombre="tema"
                valor={t.valor}
                etiqueta={t.etiqueta}
                marcado={prefs.tema === t.valor}
                onElegir={() => prefs.cambiar('tema', t.valor)}
                muestra={
                  <span
                    data-tema={t.valor}
                    aria-hidden="true"
                    className="flex size-10 items-center justify-center rounded-md border border-borde bg-fondo font-semibold text-texto"
                  >
                    Aa
                  </span>
                }
              />
            ))}
          </Grupo>

          <Grupo leyenda="Paleta de fondo">
            {PRESETS.map((p) => (
              <Opcion
                key={p}
                nombre="fondo"
                valor={p}
                etiqueta={NOMBRES_PRESET[p]}
                marcado={prefs.fondo === p}
                onElegir={() => prefs.cambiar('fondo', p)}
                muestra={
                  <span
                    data-tema={prefs.tema}
                    aria-hidden="true"
                    className="size-10 rounded-md border border-borde bg-fondo"
                    style={p === 'neutro' ? undefined : { backgroundColor: MUESTRA_FONDO[p] }}
                  />
                }
              />
            ))}
          </Grupo>

          <Grupo leyenda="Paleta de tarjeta">
            {PRESETS.map((p) => (
              <Opcion
                key={p}
                nombre="tarjeta"
                valor={p}
                etiqueta={NOMBRES_PRESET[p]}
                marcado={prefs.tarjeta === p}
                onElegir={() => prefs.cambiar('tarjeta', p)}
                muestra={
                  <span
                    aria-hidden="true"
                    className="flex size-10 items-center justify-center rounded-md border border-borde font-semibold"
                    style={{ backgroundColor: TARJETAS[p].fondo, color: TARJETAS[p].texto }}
                  >
                    Aa
                  </span>
                }
              />
            ))}
          </Grupo>

          <Grupo leyenda="Lado de la imagen">
            {LADOS.map((l) => (
              <Opcion
                key={l.valor}
                nombre="lado"
                valor={l.valor}
                etiqueta={l.etiqueta}
                marcado={prefs.ladoImagen === l.valor}
                onElegir={() => prefs.cambiar('ladoImagen', l.valor)}
              />
            ))}
          </Grupo>

          <div className="border-t border-borde pt-6">
            <h2 className="mb-2 text-lg font-semibold">Cuenta</h2>
            <Button
              variante="secundario"
              onClick={() => (sync === 'sin-sincronizar' ? setConfirmando(true) : salir())}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>

        <section aria-labelledby="vista-previa" className="order-first md:sticky md:top-28 md:order-none">
          <h2 id="vista-previa" className="mb-2 text-lg font-semibold">
            Vista previa
          </h2>
          <div className="flex flex-col gap-3 rounded-lg bg-fondo p-3 ring-1 ring-borde">
            {(['Frente', 'Reverso'] as const).map((lado) => (
              <div
                key={lado}
                className="flex min-h-28 flex-col items-center justify-center gap-1 rounded-lg border-2 border-borde bg-tarjeta p-4 text-center text-sobre-tarjeta shadow-1"
              >
                <span className="text-sm">{lado}</span>
                <span className="text-lg font-semibold">{lado === 'Frente' ? 'Palabra A' : 'Palabra A-es'}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Dialog abierto={confirmando} onCerrar={() => setConfirmando(false)} titulo="Cerrar sesión" alerta>
        <p className="mb-6">Tienes cambios sin sincronizar. Si cierras sesión, se perderán.</p>
        <div className="flex justify-end gap-2">
          <Button variante="secundario" data-autofocus onClick={() => setConfirmando(false)}>
            Cancelar
          </Button>
          <Button variante="peligro" onClick={salir}>
            Cerrar sesión igualmente
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
