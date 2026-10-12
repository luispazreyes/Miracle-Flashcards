// Enlace mágico simulado (BR-32, BR-33): vigencia 1 h, un solo uso, invalidación y enfriamiento de 60 s.
import { memoryStorage } from '../../../test/devices'
import { AuthError } from '../AuthService'
import { MockAuthService } from './MockAuthService'

function setup() {
  const store = memoryStorage()
  const clock = { t: 1_700_000_000_000 }
  const online = { value: true }
  let n = 0
  const auth = new MockAuthService({
    store,
    now: () => clock.t,
    isOnline: () => online.value,
    newToken: () => `tok-${++n}`,
  })
  return { auth, clock, online }
}

const code = async (p: Promise<unknown>) => {
  try {
    await p
  } catch (e) {
    return (e as AuthError).code
  }
  return 'ok'
}

describe('MockAuthService', () => {
  it('con un enlace válido inicia sesión y la deja guardada (RF-41)', async () => {
    const { auth } = setup()
    await auth.requestMagicLink('Ana@Example.com ')
    const session = await auth.consumeLink(auth.devInbox('ana@example.com')!)
    expect(session.email).toBe('ana@example.com')
    expect(auth.getSession()).toEqual(session)
  })

  it('el mismo correo es siempre la misma cuenta; otro correo, otra (RF-09)', async () => {
    const a = setup().auth
    const b = setup().auth
    await a.requestMagicLink('ana@example.com')
    await b.requestMagicLink('ana@example.com')
    const sa = await a.consumeLink(a.devInbox('ana@example.com')!)
    const sb = await b.consumeLink(b.devInbox('ana@example.com')!)
    expect(sa.userId).toBe(sb.userId)
    await b.requestMagicLink('luis@example.com')
    const sc = await b.consumeLink(b.devInbox('luis@example.com')!)
    expect(sc.userId).not.toBe(sa.userId)
  })

  it('el enlace es de un solo uso (EC-03)', async () => {
    const { auth } = setup()
    await auth.requestMagicLink('ana@example.com')
    const token = auth.devInbox('ana@example.com')!
    await auth.consumeLink(token)
    expect(await code(auth.consumeLink(token))).toBe('invalid')
  })

  it('caduca a la hora (EC-03)', async () => {
    const { auth, clock } = setup()
    await auth.requestMagicLink('ana@example.com')
    const token = auth.devInbox('ana@example.com')!
    clock.t += 60 * 60 * 1000 + 1
    expect(await code(auth.consumeLink(token))).toBe('invalid')
  })

  it('un enlace alterado no inicia sesión (EC-03)', async () => {
    const { auth } = setup()
    await auth.requestMagicLink('ana@example.com')
    expect(await code(auth.consumeLink('tok-alterado'))).toBe('invalid')
    expect(auth.getSession()).toBeNull()
  })

  it('pedir otro enlace invalida el anterior (EC-03) tras el enfriamiento', async () => {
    const { auth, clock } = setup()
    await auth.requestMagicLink('ana@example.com')
    const first = auth.devInbox('ana@example.com')!
    clock.t += 61_000
    await auth.requestMagicLink('ana@example.com')
    expect(await code(auth.consumeLink(first))).toBe('invalid')
    await expect(auth.consumeLink(auth.devInbox('ana@example.com')!)).resolves.toBeDefined()
  })

  it('exige 60 s entre solicitudes (EC-50)', async () => {
    const { auth, clock } = setup()
    await auth.requestMagicLink('ana@example.com')
    clock.t += 59_000
    expect(await code(auth.requestMagicLink('ana@example.com'))).toBe('cooldown')
    clock.t += 1_000
    expect(await code(auth.requestMagicLink('ana@example.com'))).toBe('ok')
  })

  it('sin conexión no se puede pedir ni usar un enlace (BR-34)', async () => {
    const { auth, online } = setup()
    online.value = false
    expect(await code(auth.requestMagicLink('ana@example.com'))).toBe('offline')
    expect(await code(auth.consumeLink('x'))).toBe('offline')
  })

  it('cerrar sesión la borra y avisa', async () => {
    const { auth } = setup()
    await auth.requestMagicLink('ana@example.com')
    await auth.consumeLink(auth.devInbox('ana@example.com')!)
    const seen: unknown[] = []
    auth.onAuthChange((s) => seen.push(s))
    await auth.signOut()
    expect(auth.getSession()).toBeNull()
    expect(seen).toEqual([null])
  })
})
