import { useEffect } from 'react'

/** Minúsculas y sin acentos: búsquedas y duplicados (RF-16, RF-20, RF-36, RF-43). */
export const normalizar = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

export const MAX_NOMBRE_MAZO = 60
export const ACIERTOS_PARA_APRENDER = 3

/** 2.4.2: título de documento por pantalla. */
export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · Miracle Flashcards`
  }, [titulo])
}

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
