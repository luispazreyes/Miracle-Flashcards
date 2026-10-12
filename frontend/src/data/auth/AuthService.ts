// Frontera con el servicio de acceso (frontend-specs.md §5.1, RF-09, RF-37, RF-41). Implementaciones:
// `MockAuthService` y, más adelante, la de Supabase Auth.

export interface Session {
  userId: string
  email: string
}

/**
 * - `offline`: no hay red y hace falta (primer acceso, BR-34).
 * - `network`: fallo de envío o de red.
 * - `invalid`: el enlace caducó, ya se usó, fue reemplazado o está alterado (BR-33).
 * - `cooldown`: se pidió otro enlace antes de 60 s (BR-32).
 */
export type AuthErrorCode = 'offline' | 'network' | 'invalid' | 'cooldown'

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code)
    this.name = 'AuthError'
  }
}

export interface AuthService {
  /** Envía el enlace de acceso al correo. Rechaza con `AuthError`. */
  requestMagicLink(email: string): Promise<void>
  /** Procesa el token de la URL e inicia sesión. Rechaza con `AuthError('invalid')`. */
  consumeLink(token: string): Promise<Session>
  /** Sesión guardada en este dispositivo; no necesita red (RF-41). */
  getSession(): Session | null
  onAuthChange(callback: (session: Session | null) => void): () => void
  signOut(): Promise<void>
  /**
   * Solo en modo simulado: último enlace "enviado", para poder abrirlo sin correo real.
   * Las implementaciones reales no lo definen.
   */
  devInbox?(email: string): string | null
}
