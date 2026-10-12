import { durationMs, flyChip, parseDuration, waitForExit } from './motion'

describe('parseDuration', () => {
  it.each([
    ['240ms', 240],
    ['0.4s', 400],
    [' 120ms ', 120],
    ['0.01ms', 0], // movimiento reducido
    ['', 0],
    ['abc', 0],
  ])('%j → %j', (input, expected) => {
    expect(parseDuration(input)).toBe(expected)
  })
})

describe('waitForExit', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--mov-medio')
    vi.useRealTimers()
  })

  it('con movimiento reducido ejecuta de inmediato', () => {
    document.documentElement.style.setProperty('--mov-medio', '0.01ms')
    const fn = vi.fn()
    waitForExit(fn)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('con movimiento normal espera la duración del token', () => {
    vi.useFakeTimers()
    document.documentElement.style.setProperty('--mov-medio', '240ms')
    expect(durationMs('--mov-medio')).toBe(240)
    const fn = vi.fn()
    waitForExit(fn)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(240)
    expect(fn).toHaveBeenCalledOnce()
  })
})

describe('flyChip (RF-45)', () => {
  const chip = () => {
    const el = document.createElement('div')
    const finished = Promise.resolve()
    const animate = vi.fn(() => ({ finished }))
    ;(el as unknown as { animate: unknown }).animate = animate
    return { el, animate }
  }
  afterEach(() => document.documentElement.style.removeProperty('--mov-deposito'))

  it('anima desde el puntero hasta el mazo con el token indicado y se encoge al depositar', async () => {
    document.documentElement.style.setProperty('--mov-deposito', '300ms')
    const { el, animate } = chip()
    await flyChip(
      el,
      { x: 10, y: 20 },
      { x: 100, y: 200 },
      { token: '--mov-deposito', shrink: true },
    )
    expect(animate).toHaveBeenCalledTimes(1)
    const [frames, options] = animate.mock.calls[0] as unknown as [
      Keyframe[],
      KeyframeAnimationOptions,
    ]
    expect(options.duration).toBe(300)
    expect(frames[0].transform).toContain('translate(10px, 20px)')
    expect(frames[1].transform).toContain('translate(100px, 200px)')
    expect(frames[1].opacity).toBe(0)
  })

  it('al volver a su sitio no se desvanece', async () => {
    document.documentElement.style.setProperty('--mov-deposito', '300ms')
    const { el, animate } = chip()
    await flyChip(el, { x: 0, y: 0 }, { x: 5, y: 5 }, { token: '--mov-deposito', shrink: false })
    const [frames] = animate.mock.calls[0] as unknown as [Keyframe[]]
    expect(frames[1].opacity).toBe(1)
  })

  it('con movimiento reducido no anima y resuelve de inmediato', async () => {
    document.documentElement.style.setProperty('--mov-deposito', '0.01ms')
    const { el, animate } = chip()
    await flyChip(el, { x: 0, y: 0 }, { x: 5, y: 5 }, { token: '--mov-deposito', shrink: true })
    expect(animate).not.toHaveBeenCalled()
  })

  it('sin soporte de animate (jsdom) no falla', async () => {
    document.documentElement.style.setProperty('--mov-deposito', '300ms')
    await expect(
      flyChip(
        document.createElement('div'),
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { token: '--mov-deposito', shrink: true },
      ),
    ).resolves.toBeUndefined()
  })
})
