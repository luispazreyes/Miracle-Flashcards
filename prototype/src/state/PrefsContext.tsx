// Preferencias de apariencia (F-08): RF-10, RF-11, RF-12, RF-42.
// Se guardan en el dispositivo (offline) y se aplican antes del primer pintado.
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { duracionMs } from '../lib/motion'
import { FONDOS, TARJETAS, type PresetFondo, type PresetTarjeta } from '../styles/presets'

export type Tema = 'azul' | 'blanco' | 'oscuro'
export type LadoImagen = 'frente' | 'reverso' | 'ambos'

export interface Prefs {
  tema: Tema
  fondo: PresetFondo
  tarjeta: PresetTarjeta
  ladoImagen: LadoImagen
}

interface PrefsValor extends Prefs {
  cambiar: <K extends keyof Prefs>(clave: K, valor: Prefs[K]) => void
  /** Cambia con cada modificación hecha por el usuario ("Guardado"). */
  guardadoEn: number
}

const PrefsContext = createContext<PrefsValor | null>(null)
const CLAVES: Record<keyof Prefs, string> = {
  tema: 'mf-tema',
  fondo: 'mf-fondo',
  tarjeta: 'mf-tarjeta',
  ladoImagen: 'mf-lado-imagen',
}
const TEMAS: Tema[] = ['azul', 'blanco', 'oscuro']
const PRESETS = Object.keys(FONDOS)
const LADOS: LadoImagen[] = ['frente', 'reverso', 'ambos']

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave)
  } catch {
    return null
  }
}

function inicial(): Prefs {
  const t = leer(CLAVES.tema)
  const f = leer(CLAVES.fondo)
  const c = leer(CLAVES.tarjeta)
  const l = leer(CLAVES.ladoImagen)
  // RF-42: sin preferencia guardada, el tema sigue al sistema (la guarda el script de index.html).
  const sistema: Tema = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'blanco'
  return {
    tema: TEMAS.includes(t as Tema) ? (t as Tema) : sistema,
    fondo: PRESETS.includes(f ?? '') ? (f as PresetFondo) : 'neutro',
    tarjeta: PRESETS.includes(c ?? '') ? (c as PresetTarjeta) : 'neutro',
    ladoImagen: LADOS.includes(l as LadoImagen) ? (l as LadoImagen) : 'reverso',
  }
}

function aplicar(p: Prefs) {
  const el = document.documentElement
  el.dataset.tema = p.tema
  // Quita lo anterior y aplica el preset de fondo (conjunto completo de tokens de página).
  for (const set of Object.values(FONDOS)) for (const k of Object.keys(set ?? {})) el.style.removeProperty(k)
  for (const [k, v] of Object.entries(FONDOS[p.fondo] ?? {})) el.style.setProperty(k, v)
  el.style.setProperty('--color-tarjeta', TARJETAS[p.tarjeta].fondo)
  el.style.setProperty('--color-sobre-tarjeta', TARJETAS[p.tarjeta].texto)
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(inicial)
  const [guardadoEn, setGuardadoEn] = useState(0)
  const primera = useRef(true)

  useLayoutEffect(() => {
    // RF-44: el cambio de tema o paleta se anima (no el primer pintado, que va sin parpadeo).
    const el = document.documentElement
    const d = primera.current ? 0 : duracionMs('--mov-medio')
    if (d > 0) el.classList.add('cambiando-tema')
    aplicar(prefs)
    const t = setTimeout(() => el.classList.remove('cambiando-tema'), d)
    if (primera.current) {
      primera.current = false
      return
    }
    setGuardadoEn(Date.now())
    return () => clearTimeout(t)
  }, [prefs])

  const cambiar = useCallback(<K extends keyof Prefs>(clave: K, valor: Prefs[K]) => {
    setPrefs((p) => ({ ...p, [clave]: valor }))
    try {
      localStorage.setItem(CLAVES[clave], valor)
    } catch {
      /* sin almacenamiento: la preferencia dura solo esta sesión */
    }
  }, [])

  const valor = useMemo(() => ({ ...prefs, cambiar, guardadoEn }), [prefs, cambiar, guardadoEn])
  return <PrefsContext.Provider value={valor}>{children}</PrefsContext.Provider>
}

export function usePrefs(): PrefsValor {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs requiere <PrefsProvider>')
  return ctx
}
