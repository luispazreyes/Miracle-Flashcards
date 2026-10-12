// Normalización de texto (BR-12, BR-19, BR-25, BR-26). Funciones puras.

/** Recorta, colapsa espacios internos y pasa a minúsculas. NO pliega acentos (BR-12). */
export function normalizeWord(text: string): string {
  return text.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
}

/** Además de lo anterior, ignora acentos: nombres de mazo y búsquedas (BR-19, BR-25, BR-26). */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}
