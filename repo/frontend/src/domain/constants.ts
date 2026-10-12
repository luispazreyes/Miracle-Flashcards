// Constantes de negocio (frontend-specs.md §8). Un solo lugar; nada de números sueltos en el código.

/** Aciertos consecutivos para que una palabra pase a aprendida (RF-07, BR-04). */
export const LEARNED_THRESHOLD = 3
/** Longitud máxima del nombre de un mazo (RF-16, BR-19). */
export const DECK_NAME_MAX = 60
/** Enfriamiento entre solicitudes de enlace mágico (RF-37, BR-32). */
export const MAGIC_LINK_COOLDOWN_S = 60
/** Vigencia del enlace mágico (RF-37). */
export const MAGIC_LINK_TTL_MS = 60 * 60 * 1000
/** Reintentos automáticos de sincronización (RF-22, BR-41). */
export const SYNC_MAX_RETRIES = 5
/** Espera entre reintentos, en segundos (P-F2): 2, 4, 8, 16, 32. */
export const SYNC_BACKOFF_S = [2, 4, 8, 16, 32] as const
/** Tiempo máximo para comprobar que una URL carga como imagen (P-F7). */
export const IMAGE_CHECK_TIMEOUT_MS = 10_000
/** Máximo de imágenes en la caché del service worker (P-F6). */
export const IMAGE_CACHE_MAX_ENTRIES = 200
