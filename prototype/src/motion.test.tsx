// RF-44 — animaciones de transición (HU-16, TC-16.x, TC-EC-53..55).
// Las duraciones se simulan a 240 ms para poder observar las salidas; con movimiento reducido valen 0.
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import App from './App'

vi.mock('./lib/motion', async (importarOriginal) => {
  const real = await importarOriginal<typeof import('./lib/motion')>()
  return {
    ...real,
    duracionMs: () => 240,
    esperarSalida: (fn: () => void) => void setTimeout(fn, 240),
  }
})

function montar(ruta: string) {
  localStorage.setItem('mf-sesion', '1')
  window.history.pushState({}, '', ruta)
  return render(<App />)
}
const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
const avanzar = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)))

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
  document.documentElement.classList.remove('cambiando-tema')
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => vi.useRealTimers())

describe('RF-44 transiciones: salida de diálogos, avisos y filas (TC-16.1, TC-16.2)', () => {
  it('el diálogo se cierra con transición: sigue en pantalla "saliendo" y luego desaparece', async () => {
    const u = usuario()
    montar('/mazos')
    await u.click(screen.getByRole('button', { name: 'Más acciones de «Mazo 1»' }))
    await u.click(screen.getByRole('menuitem', { name: 'Renombrar' }))
    expect(screen.getByRole('dialog').parentElement).toHaveAttribute('data-estado', 'abierto')
    await u.keyboard('{Escape}')
    expect(screen.getByRole('dialog').parentElement).toHaveAttribute('data-estado', 'saliendo')
    await avanzar(260)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('el foco vuelve al disparador al cerrar, sin esperar a que acabe la transición', async () => {
    const u = usuario()
    montar('/mazos')
    await u.click(screen.getByRole('button', { name: 'Más acciones de «Mazo 1»' }))
    await u.click(screen.getByRole('menuitem', { name: 'Renombrar' }))
    await u.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Más acciones de «Mazo 1»' })).toHaveFocus()
  })

  it('los avisos entran y salen con transición', async () => {
    const u = usuario()
    montar('/mazos')
    await u.click(screen.getByRole('button', { name: 'Nuevo mazo' }))
    await u.type(screen.getByLabelText('Nombre del mazo'), 'Mazo nuevo')
    await u.click(screen.getByRole('button', { name: 'Crear mazo' }))
    const aviso = screen.getByText('Mazo «Mazo nuevo» creado.').parentElement!
    expect(aviso).toHaveClass('anim-entrada')
    await u.click(within(aviso).getByRole('button', { name: 'Cerrar aviso' }))
    expect(aviso).toHaveClass('anim-salida')
    await avanzar(260)
    expect(screen.queryByText('Mazo «Mazo nuevo» creado.')).not.toBeInTheDocument()
  })

  it('al borrar una palabra la fila sale con transición y luego se elimina', async () => {
    const u = usuario()
    montar('/mazos')
    const fila = () => document.querySelector('[data-palabra-id="p-g"]')
    expect(fila()).toHaveClass('anim-entrada')
    await u.click(screen.getByRole('button', { name: 'Más acciones de «Palabra G»' }))
    await u.click(screen.getByRole('menuitem', { name: 'Borrar' }))
    await u.click(screen.getByRole('button', { name: 'Borrar palabra' }))
    expect(fila()).toHaveClass('anim-salida')
    await avanzar(260)
    expect(fila()).toBeNull()
  })

  it('al reactivar una palabra la fila sale con transición antes de pasar a pendientes', async () => {
    const u = usuario()
    montar('/progreso?mazo=m-1')
    await u.click(screen.getByRole('tab', { name: /^Aprendidas/ }))
    await u.click(screen.getByRole('button', { name: 'Reactivar «Palabra A»' }))
    const fila = screen.getByText('Palabra A').closest('li')!
    expect(fila).toHaveClass('anim-salida')
    await avanzar(260)
    expect(screen.queryByText('Palabra A')).not.toBeInTheDocument()
  })
})

describe('RF-44 transiciones: tema, navegación, tarjeta y sincronización', () => {
  it('cambiar de tema añade la clase de transición y la retira al terminar (TC-16.3)', async () => {
    const u = usuario()
    montar('/ajustes')
    await u.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(document.documentElement).toHaveClass('cambiando-tema')
    expect(document.documentElement.dataset.tema).toBe('oscuro')
    await avanzar(260)
    expect(document.documentElement).not.toHaveClass('cambiando-tema')
  })

  it('la pantalla entra con fundido al navegar (TC-16.1)', async () => {
    const u = usuario()
    montar('/mazos')
    const antes = document.getElementById('contenido')!
    expect(antes).toHaveClass('anim-fundido')
    await u.click(screen.getByRole('link', { name: 'Progreso' }))
    const despues = document.getElementById('contenido')!
    expect(despues).not.toBe(antes) // se vuelve a montar: la animación se repite
    expect(despues).toHaveClass('anim-fundido')
  })

  it('cada tarjeta nueva entra con transición y no se retrasa la respuesta (TC-EC-53)', async () => {
    const u = usuario()
    montar('/estudio/m-1')
    const contenedor = () => screen.getByRole('button', { name: /^Tarjeta:/ }).parentElement!.parentElement!
    expect(contenedor()).toHaveClass('anim-entrada')
    const primera = contenedor()
    await u.click(screen.getByRole('button', { name: /^Tarjeta:/ }))
    await u.click(screen.getByRole('button', { name: 'Acerté' }))
    // La siguiente tarjeta ya está disponible al instante (sin esperar 240 ms) y es un elemento nuevo.
    expect(screen.getByRole('button', { name: /^Tarjeta:/ })).toBeInTheDocument()
    expect(contenedor()).not.toBe(primera)
  })

  it('el indicador de sincronización anima el cambio y conserva texto, icono y región viva (TC-16.4, TC-EC-54)', async () => {
    const u = usuario()
    montar('/mazos')
    await u.click(screen.getByText('Panel del prototipo'))
    const estado = within(screen.getByRole('banner')).getByRole('status')
    await u.selectOptions(screen.getByLabelText('Sincronización'), 'sin-sincronizar')
    // La misma región viva sigue en el DOM (no se recrea) y el contenido nuevo entra con fundido
    expect(within(screen.getByRole('banner')).getByRole('status')).toBe(estado)
    expect(estado).toHaveTextContent('Sin sincronizar')
    expect(estado.querySelector('svg')).toBeInTheDocument()
    expect(estado.firstElementChild).toHaveClass('anim-fundido')
  })

  it('la barra de avance anima su relleno', () => {
    montar('/progreso?mazo=m-1')
    const relleno = screen.getByRole('progressbar').firstElementChild
    expect(relleno?.className).toMatch(/transition-\[width\]/)
  })
})

// --- Reglas estáticas: tokens, sin duraciones fijas y movimiento reducido (TC-16.1, TC-16.5) ---
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? archivos(p) : [p]
  })
}
const src = join(process.cwd(), 'src')
const css = readFileSync(join(src, 'index.css'), 'utf8')
const tokens = readFileSync(join(src, 'styles/tokens.css'), 'utf8')

describe('RF-44 tokens de motion', () => {
  it('las utilidades de animación usan solo tokens --mov-*', () => {
    const utilidades = [...css.matchAll(/@utility anim-[\w-]+ \{([^}]*)\}/g)].map((m) => m[1])
    expect(utilidades.length).toBeGreaterThanOrEqual(7)
    for (const u of utilidades) {
      expect(u).toMatch(/var\(--mov-(rapido|medio|volteo)\)/)
      expect(u).toMatch(/var\(--mov-curva\)/)
      expect(u).not.toMatch(/\d+(\.\d+)?m?s\b/)
    }
  })

  it('ningún componente fija duraciones ni retardos de transición', () => {
    const malos = archivos(src)
      .filter((f) => /\.tsx$/.test(f) && !/\.test\.tsx$/.test(f))
      .filter((f) => /\b(duration|delay)-\d|\bduration-\[\d|transition(Duration|Delay)\s*:\s*['"`]?\d/.test(readFileSync(f, 'utf8')))
    expect(malos).toEqual([])
  })

  it('con movimiento reducido las duraciones valen ~0 y no hay desplazamiento ni escala (TC-16.5)', () => {
    const bloque = tokens.slice(tokens.indexOf('@media (prefers-reduced-motion: reduce)'))
    for (const t of ['--mov-rapido', '--mov-medio', '--mov-volteo']) expect(bloque).toMatch(new RegExp(`${t}:\\s*0\\.01ms`))
    expect(bloque).toMatch(/--mov-distancia:\s*0rem/)
    expect(bloque).toMatch(/--mov-escala-entrada:\s*1;/)
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation-duration: 0\.01ms !important/)
  })
})
