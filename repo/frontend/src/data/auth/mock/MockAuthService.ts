// Servicio de acceso simulado (D-07). Reproduce lo que garantizará Supabase Auth (BR-32, BR-33): enlace con
// vigencia de 1 h, un solo uso, invalidación del anterior al emitir otro y 60 s de enfriamiento.
import { MAGIC_LINK_COOLDOWN_S, MAGIC_LINK_TTL_MS } from '../../../domain'
import { AuthError, type AuthService, type Session } from '../AuthService'

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

interface Token {
  email: string
  issuedAt: number
  used: boolean
  /** `true` si se emitió otro después para el mismo correo. */
  superseded: boolean
}

const TOKENS_KEY = 'mf:mock-auth'
const SESSION_KEY = 'mf:session'

/** Hash corto y estable: el mismo correo es siempre la misma cuenta (RF-09). */
function userIdFor(email: string): string {
  let h = 2166136261
  for (const ch of email) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return `u-${(h >>> 0).toString(16)}`
}

export interface MockAuthOptions {
  store: Store
  now?: () => number
  isOnline?: () => boolean
  newToken?: () => string
}

export class MockAuthService implements AuthService {
  private listeners = new Set<(s: Session | null) => void>()
  private readonly now: () => number
  private readonly isOnline: () => boolean
  private readonly newToken: () => string
  private readonly store: Store
  /** Simula un fallo del envío (pruebas y demostración). */
  failNextSend = false

  constructor(options: MockAuthOptions) {
    this.store = options.store
    this.now = options.now ?? Date.now
    this.isOnline = options.isOnline ?? (() => navigator.onLine)
    this.newToken = options.newToken ?? (() => crypto.randomUUID())
  }

  private tokens(): Record<string, Token> {
    try {
      return JSON.parse(this.store.getItem(TOKENS_KEY) ?? '{}') as Record<string, Token>
    } catch {
      return {}
    }
  }
  private saveTokens(t: Record<string, Token>) {
    this.store.setItem(TOKENS_KEY, JSON.stringify(t))
  }

  async requestMagicLink(rawEmail: string): Promise<void> {
    if (!this.isOnline()) throw new AuthError('offline')
    if (this.failNextSend) {
      this.failNextSend = false
      throw new AuthError('network')
    }
    const email = rawEmail.trim().toLowerCase()
    const tokens = this.tokens()
    const t = this.now()
    const last = Object.values(tokens)
      .filter((x) => x.email === email)
      .reduce((max, x) => Math.max(max, x.issuedAt), 0)
    if (last && t - last < MAGIC_LINK_COOLDOWN_S * 1000) throw new AuthError('cooldown')
    for (const x of Object.values(tokens)) if (x.email === email) x.superseded = true
    tokens[this.newToken()] = { email, issuedAt: t, used: false, superseded: false }
    this.saveTokens(tokens)
  }

  devInbox(rawEmail: string): string | null {
    const email = rawEmail.trim().toLowerCase()
    const entries = Object.entries(this.tokens()).filter(([, x]) => x.email === email)
    const latest = entries.sort((a, b) => b[1].issuedAt - a[1].issuedAt)[0]
    return latest ? latest[0] : null
  }

  async consumeLink(token: string): Promise<Session> {
    if (!this.isOnline()) throw new AuthError('offline')
    const tokens = this.tokens()
    const entry = tokens[token]
    if (!entry || entry.used || entry.superseded || this.now() - entry.issuedAt > MAGIC_LINK_TTL_MS)
      throw new AuthError('invalid')
    entry.used = true
    this.saveTokens(tokens)
    const session: Session = { userId: userIdFor(entry.email), email: entry.email }
    this.store.setItem(SESSION_KEY, JSON.stringify(session))
    this.listeners.forEach((l) => l(session))
    return session
  }

  getSession(): Session | null {
    try {
      const raw = JSON.parse(this.store.getItem(SESSION_KEY) ?? 'null') as Session | null
      return raw && raw.userId && raw.email ? raw : null
    } catch {
      return null
    }
  }

  onAuthChange(callback: (session: Session | null) => void) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  async signOut(): Promise<void> {
    this.store.removeItem(SESSION_KEY)
    this.listeners.forEach((l) => l(null))
  }
}
