// Salida animada de filas de lista (RF-44, prototype-spec §A.5): cuando un elemento desaparece de los datos
// (borrar, quitar del mazo, reactivar) se sigue pintando `--mov-medio` como "saliendo" y luego se retira.
// Con movimiento reducido (duración 0) se quita al instante. Las filas que salen no son interactivas.
import { useEffect, useState } from 'react'
import { durationMs } from './motion'

interface Ghost<T> {
  item: T
  index: number
  key: string
}

export interface AnimatedItem<T> {
  item: T
  leaving: boolean
}

export function useAnimatedList<T>(
  items: readonly T[],
  key: (item: T) => string,
): AnimatedItem<T>[] {
  const [prev, setPrev] = useState(items)
  const [ghosts, setGhosts] = useState<Ghost<T>[]>([])

  if (prev !== items) {
    setPrev(items)
    const keys = new Set(items.map(key))
    const removed = prev
      .map((item, index) => ({ item, index, key: key(item) }))
      .filter((g) => !keys.has(g.key))
    if (removed.length > 0 && durationMs() > 0) {
      setGhosts((g) => [...g.filter((x) => !keys.has(x.key)), ...removed])
    } else if (ghosts.some((g) => keys.has(g.key))) {
      setGhosts((g) => g.filter((x) => !keys.has(x.key)))
    }
  }

  useEffect(() => {
    if (ghosts.length === 0) return
    const id = setTimeout(() => setGhosts([]), durationMs())
    return () => clearTimeout(id)
  }, [ghosts])

  const rendered: AnimatedItem<T>[] = items.map((item) => ({ item, leaving: false }))
  for (const g of [...ghosts].sort((a, b) => a.index - b.index))
    rendered.splice(Math.min(g.index, rendered.length), 0, { item: g.item, leaving: true })
  return rendered
}
