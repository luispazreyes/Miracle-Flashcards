// Datos de ejemplo en memoria (placeholder). Sustituye a Supabase/IndexedDB en el prototipo.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { ACIERTOS_PARA_APRENDER, MAX_NOMBRE_MAZO, normalizar } from '../lib/texto'

export interface Imagen {
  url: string
  verificada: boolean
}
export interface Palabra {
  id: string
  ingles: string
  espanol: string
  imagen?: Imagen
  ejemplo?: string
  nota?: string
}
export interface Mazo {
  id: string
  nombre: string
}
/** Estado de una palabra dentro de un mazo: por mazo, no global (RF-30). */
export interface Progreso {
  mazoId: string
  palabraId: string
  aciertos: number
  aprendida: boolean
}
export type DatosPalabra = Omit<Palabra, 'id'>

export type ModoDatos = 'ejemplo' | 'vacio' | 'cargando' | 'error'
export type ResultadoNombre = { ok: true; id: string } | { ok: false; error: string }

interface Datos {
  mazos: Mazo[]
  palabras: Palabra[]
  progreso: Progreso[]
}

const IMAGEN_EJEMPLO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="160" height="100" fill="#cbd5e1"/><circle cx="50" cy="40" r="14" fill="#64748b"/><path d="M0 100l50-40 40 25 30-20 40 35z" fill="#64748b"/></svg>',
  )

function semilla(): Datos {
  const palabras: Palabra[] = [
    { id: 'p-a', ingles: 'Palabra A', espanol: 'Palabra A-es', ejemplo: 'Ejemplo de uso de Palabra A.', nota: 'Nota de ejemplo.', imagen: { url: IMAGEN_EJEMPLO, verificada: true } },
    { id: 'p-b', ingles: 'Palabra B', espanol: 'Palabra B-es', ejemplo: 'Ejemplo de uso de Palabra B.' },
    { id: 'p-c', ingles: 'Palabra C', espanol: 'Palabra C-es' },
    { id: 'p-d', ingles: 'Palabra D', espanol: 'Palabra D-es', nota: 'Otra nota de ejemplo.' },
    { id: 'p-e', ingles: 'Palabra E', espanol: 'Palabra E-es' },
    { id: 'p-f', ingles: 'Palabra F', espanol: 'Palabra F-es' },
    { id: 'p-g', ingles: 'Palabra G', espanol: 'Palabra G-es' },
    { id: 'p-h', ingles: 'Palabra H', espanol: 'Palabra H-es' },
    { id: 'p-i', ingles: 'Palabra I', espanol: 'Palabra I-es', imagen: { url: 'https://ejemplo.invalid/i.png', verificada: false } },
  ]
  const mazos: Mazo[] = [
    { id: 'm-1', nombre: 'Mazo 1' },
    { id: 'm-2', nombre: 'Mazo 2' },
    { id: 'm-3', nombre: 'Mazo 3' }, // sin palabras
    { id: 'm-4', nombre: 'Mazo 4' }, // sin pendientes
  ]
  const pr = (mazoId: string, palabraId: string, aciertos: number, aprendida = false): Progreso => ({
    mazoId,
    palabraId,
    aciertos,
    aprendida,
  })
  const progreso = [
    pr('m-1', 'p-a', 3, true),
    pr('m-1', 'p-b', 2),
    pr('m-1', 'p-c', 1),
    pr('m-1', 'p-d', 0),
    pr('m-1', 'p-e', 3, true),
    pr('m-2', 'p-c', 0), // misma palabra, otro mazo, otro estado (RF-30)
    pr('m-2', 'p-f', 0),
    pr('m-4', 'p-h', 3, true),
  ]
  return { mazos, palabras, progreso }
}

const vacio = (): Datos => ({ mazos: [], palabras: [], progreso: [] })

interface DataValor extends Datos {
  modo: ModoDatos
  estadoCarga: 'ok' | 'cargando' | 'error'
  /** Solo prototipo: cambia el conjunto de datos para revisar estados. */
  setModo: (m: ModoDatos) => void
  reintentarCarga: () => void
  simularFalloGuardado: boolean
  setSimularFalloGuardado: (v: boolean) => void
  mazosDePalabra: (palabraId: string) => Mazo[]
  palabrasDeMazo: (mazoId: string) => Palabra[]
  crearMazo: (nombre: string) => ResultadoNombre
  renombrarMazo: (id: string, nombre: string) => ResultadoNombre
  borrarMazo: (id: string) => void
  guardarPalabra: (datos: DatosPalabra, id?: string) => { ok: true; id: string } | { ok: false }
  borrarPalabra: (id: string) => void
  agregarAMazo: (palabraId: string, mazoId: string) => 'ok' | 'duplicado'
  quitarDeMazo: (palabraId: string, mazoId: string) => void
  responder: (mazoId: string, palabraId: string, acierto: boolean) => { aciertos: number; aprendida: boolean }
  reactivar: (mazoId: string, palabraId: string) => void
}

const DataContext = createContext<DataValor | null>(null)
let contador = 100
const nuevoId = (pref: string) => `${pref}-${++contador}`

export function DataProvider({ children, modoInicial = 'ejemplo' }: { children: ReactNode; modoInicial?: ModoDatos }) {
  const [modo, setModoEstado] = useState<ModoDatos>(modoInicial)
  const [datos, setDatos] = useState<Datos>(() => (modoInicial === 'ejemplo' ? semilla() : vacio()))
  const [simularFalloGuardado, setSimularFalloGuardado] = useState(false)
  const ref = useRef(datos)
  ref.current = datos

  const setModo = useCallback((m: ModoDatos) => {
    setModoEstado(m)
    setDatos(m === 'ejemplo' ? semilla() : vacio())
  }, [])
  const reintentarCarga = useCallback(() => setModo('ejemplo'), [setModo])

  const validarNombre = (nombre: string, ignorarId?: string): string | undefined => {
    const n = nombre.trim()
    if (!n) return 'Falta el campo «Nombre del mazo». Escríbelo para guardar el mazo.'
    if (n.length > MAX_NOMBRE_MAZO) return `El nombre del mazo no puede superar ${MAX_NOMBRE_MAZO} caracteres.`
    if (ref.current.mazos.some((m) => m.id !== ignorarId && normalizar(m.nombre) === normalizar(n)))
      return 'Ya tienes un mazo con ese nombre. Elige otro.'
    return undefined
  }

  const valor = useMemo<DataValor>(() => {
    const mazosDePalabra = (palabraId: string) => {
      const ids = new Set(ref.current.progreso.filter((p) => p.palabraId === palabraId).map((p) => p.mazoId))
      return ref.current.mazos.filter((m) => ids.has(m.id))
    }
    const palabrasDeMazo = (mazoId: string) => {
      const ids = new Set(ref.current.progreso.filter((p) => p.mazoId === mazoId).map((p) => p.palabraId))
      return ref.current.palabras.filter((p) => ids.has(p.id))
    }
    return {
      ...datos,
      modo,
      estadoCarga: modo === 'cargando' ? 'cargando' : modo === 'error' ? 'error' : 'ok',
      setModo,
      reintentarCarga,
      simularFalloGuardado,
      setSimularFalloGuardado,
      mazosDePalabra,
      palabrasDeMazo,
      crearMazo(nombre) {
        const error = validarNombre(nombre)
        if (error) return { ok: false, error }
        const id = nuevoId('m')
        setDatos((d) => ({ ...d, mazos: [...d.mazos, { id, nombre: nombre.trim() }] }))
        return { ok: true, id }
      },
      renombrarMazo(id, nombre) {
        const error = validarNombre(nombre, id)
        if (error) return { ok: false, error }
        setDatos((d) => ({ ...d, mazos: d.mazos.map((m) => (m.id === id ? { ...m, nombre: nombre.trim() } : m)) }))
        return { ok: true, id }
      },
      // RF-24: las palabras se conservan y quedan "Sin mazo"; su progreso en ese mazo se elimina.
      borrarMazo(id) {
        setDatos((d) => ({
          ...d,
          mazos: d.mazos.filter((m) => m.id !== id),
          progreso: d.progreso.filter((p) => p.mazoId !== id),
        }))
      },
      guardarPalabra(datosPalabra, id) {
        if (simularFalloGuardado) return { ok: false }
        const idFinal = id ?? nuevoId('p')
        setDatos((d) => ({
          ...d,
          palabras: id
            ? d.palabras.map((p) => (p.id === id ? { ...datosPalabra, id } : p))
            : [...d.palabras, { ...datosPalabra, id: idFinal }],
        }))
        return { ok: true, id: idFinal }
      },
      // RF-19: borrado definitivo en todos los mazos, con su progreso.
      borrarPalabra(id) {
        setDatos((d) => ({
          ...d,
          palabras: d.palabras.filter((p) => p.id !== id),
          progreso: d.progreso.filter((p) => p.palabraId !== id),
        }))
      },
      agregarAMazo(palabraId, mazoId) {
        if (ref.current.progreso.some((p) => p.palabraId === palabraId && p.mazoId === mazoId)) return 'duplicado'
        setDatos((d) => ({ ...d, progreso: [...d.progreso, { mazoId, palabraId, aciertos: 0, aprendida: false }] }))
        return 'ok'
      },
      // RF-40: quitar de un mazo elimina su progreso en ese mazo.
      quitarDeMazo(palabraId, mazoId) {
        setDatos((d) => ({
          ...d,
          progreso: d.progreso.filter((p) => !(p.palabraId === palabraId && p.mazoId === mazoId)),
        }))
      },
      responder(mazoId, palabraId, acierto) {
        const actual = ref.current.progreso.find((p) => p.mazoId === mazoId && p.palabraId === palabraId)
        const aciertos = acierto ? (actual?.aciertos ?? 0) + 1 : 0
        const aprendida = acierto && aciertos >= ACIERTOS_PARA_APRENDER
        setDatos((d) => ({
          ...d,
          progreso: d.progreso.map((p) =>
            p.mazoId === mazoId && p.palabraId === palabraId ? { ...p, aciertos, aprendida: p.aprendida || aprendida } : p,
          ),
        }))
        return { aciertos, aprendida }
      },
      reactivar(mazoId, palabraId) {
        setDatos((d) => ({
          ...d,
          progreso: d.progreso.map((p) =>
            p.mazoId === mazoId && p.palabraId === palabraId ? { ...p, aciertos: 0, aprendida: false } : p,
          ),
        }))
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos, modo, simularFalloGuardado, setModo, reintentarCarga])

  return <DataContext.Provider value={valor}>{children}</DataContext.Provider>
}

export function useData(): DataValor {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData requiere <DataProvider>')
  return ctx
}
