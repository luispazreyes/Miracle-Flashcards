// Comprobación de imágenes por enlace (RF-15, BR-17, P-F7): ¿la URL carga como imagen en 10 s?
import { IMAGE_CHECK_TIMEOUT_MS } from '../domain'

export function checkImageLoads(url: string, timeoutMs = IMAGE_CHECK_TIMEOUT_MS): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const done = (ok: boolean) => {
      clearTimeout(timer)
      img.onload = null
      img.onerror = null
      resolve(ok)
    }
    const timer = setTimeout(() => done(false), timeoutMs)
    img.onload = () => done(true)
    img.onerror = () => done(false)
    img.src = url
  })
}
