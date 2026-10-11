import { esperarSalida, parsearDuracion } from './motion'

describe('parsearDuracion', () => {
  it.each([
    ['240ms', 240],
    ['0.4s', 400],
    [' 120ms ', 120],
    ['0.01ms', 0], // movimiento reducido
    ['', 0], // token sin resolver
    ['abc', 0],
  ])('%s → %s', (valor, esperado) => {
    expect(parsearDuracion(valor)).toBe(esperado)
  })
})

describe('esperarSalida con movimiento reducido', () => {
  it('ejecuta el cambio de inmediato cuando la duración es 0', () => {
    // En jsdom no hay hoja de estilos: el token no se resuelve y la duración es 0.
    const fn = vi.fn()
    esperarSalida(fn)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
