// F-01 Acceso con enlace mágico (RF-09, RF-37, RF-41; BR-31..BR-34).
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useServices } from '../../app/context'
import { AuthError } from '../../data/auth/AuthService'
import { MAGIC_LINK_COOLDOWN_S, validateEmail } from '../../domain'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { access, common, messages } from '../../lib/messages.es'

type View = 'form' | 'validating' | 'sent' | 'invalid'

/** Cuenta regresiva anunciada cada 10 s, no cada segundo (F-01). */
const announceStep = (remaining: number) => Math.ceil(remaining / 10) * 10

export function AccessPage() {
  const services = useServices()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const token = params.get('token')

  const [view, setView] = useState<View>(token ? 'validating' : 'form')
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [formError, setFormError] = useState<string>()
  const [sending, setSending] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [devToken, setDevToken] = useState<string | null>(null)

  const emailRef = useRef<HTMLInputElement>(null)
  const sentRef = useRef<HTMLDivElement>(null)
  const consumed = useRef<string | null>(null)

  // Procesa el enlace de la URL una sola vez (el token es de un solo uso).
  useEffect(() => {
    if (!token || consumed.current === token) return
    consumed.current = token
    services.auth
      .consumeLink(token)
      .then(() => navigate('/mazos', { replace: true }))
      .catch((e: unknown) => {
        if (e instanceof AuthError && e.code === 'offline') {
          setFormError(access.offline)
          setView('form')
        } else if (e instanceof AuthError && e.code === 'invalid') setView('invalid')
        else {
          setFormError(common.genericError)
          setView('form')
        }
      })
  }, [token, services.auth, navigate])

  // Foco: al campo al cargar el formulario; al mensaje tras enviar.
  useEffect(() => {
    if (view === 'form') emailRef.current?.focus()
    if (view === 'sent') sentRef.current?.focus()
  }, [view])

  useEffect(() => {
    if (remaining <= 0) return
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (sending || remaining > 0) return
    setFormError(undefined)
    const parsed = validateEmail(email)
    if (!parsed.ok) {
      setFieldError(messages.invalidEmail)
      emailRef.current?.focus()
      return
    }
    setFieldError(undefined)
    if (!services.isOnline()) {
      setFormError(access.offline)
      return
    }
    setSending(true)
    try {
      await services.auth.requestMagicLink(parsed.value)
      setDevToken(services.auth.devInbox?.(parsed.value) ?? null)
      setRemaining(MAGIC_LINK_COOLDOWN_S)
      setView('sent')
    } catch (error) {
      if (error instanceof AuthError && error.code === 'offline') setFormError(access.offline)
      else if (error instanceof AuthError && error.code === 'cooldown') {
        setRemaining(MAGIC_LINK_COOLDOWN_S)
        setView('sent')
      } else setFormError(access.sendError)
    } finally {
      setSending(false)
    }
  }

  function requestNew() {
    setParams({}, { replace: true })
    setFormError(undefined)
    setView('form')
  }

  if (view === 'validating')
    return (
      <Shell>
        <p role="status" aria-busy="true">
          {access.validating}
        </p>
      </Shell>
    )

  if (view === 'invalid')
    return (
      <Shell>
        <Alert kind="error" alertRef={sentRef}>
          {access.invalidLink}
        </Alert>
        <Button onClick={requestNew}>{access.requestNew}</Button>
      </Shell>
    )

  const sent = view === 'sent'

  return (
    <Shell>
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
        <TextField
          label={access.emailLabel}
          help={access.emailHelp}
          error={fieldError}
          type="email"
          autoComplete="email"
          inputRef={emailRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {formError && <Alert kind="error">{formError}</Alert>}
        <Button type="submit" loading={sending} disabled={sending || remaining > 0}>
          {sent ? access.resend : access.send}
          {remaining > 0 && <span aria-hidden="true">({remaining} s)</span>}
        </Button>
      </form>

      {sent && (
        <div className="flex flex-col gap-3">
          <Alert kind="success" alertRef={sentRef}>
            {access.sent}
          </Alert>
          <p role="status" className="text-sm text-texto-suave">
            {remaining > 0 ? access.countdown(announceStep(remaining)) : access.canResend}
          </p>
          {devToken && (
            <Alert kind="info">
              <p>{access.devNotice}</p>
              <Link
                className="font-semibold text-primario underline"
                to={`/acceso?token=${devToken}`}
              >
                {access.devOpen}
              </Link>
            </Alert>
          )}
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-lg bg-superficie p-6 shadow-2">
        <h1 className="text-xl font-semibold">{access.appName}</h1>
        {children}
      </div>
    </main>
  )
}
