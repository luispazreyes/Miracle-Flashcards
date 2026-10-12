// RF-44, RF-45 (Fase 13): cada fila del catálogo componente → animación de docs/design-tokens.md §7 tiene una
// verificación, y ninguna duración ni curva queda fija en el código. Las animaciones en sí (movimiento real) se
// revisan en el navegador (Fase 14); aquí se comprueba que existen, que usan tokens y que respetan movimiento reducido.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(process.cwd(), 'src')
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? files(p) : [p]
  })
}
const sources = files(SRC).filter(
  (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.includes(join('src', 'test')),
)
const css = read('styles/animations.css')

/** [fila del catálogo, archivo, fragmentos que deben aparecer] */
const CATALOG: [string, string, string[]][] = [
  [
    'Botón: hover, pulsado, deshabilitado y cargando',
    'components/Button.tsx',
    ['transition', 'active:scale-', 'disabled:', 'animate-spin'],
  ],
  [
    'Campo de texto: foco y error; el error entra con el campo',
    'components/TextField.tsx',
    ['transition-colors', 'focus-visible:border-primario', 'anim-entrada'],
  ],
  [
    'Flashcard: volteo con --mov-volteo',
    'features/study/Flashcard.tsx',
    ['flip', 'flip-inner', 'flip-face-back'],
  ],
  [
    'Flashcard: la tarjeta siguiente entra con fundido y desplazamiento',
    'features/study/StudyPage.tsx',
    ['anim-entrada'],
  ],
  [
    'Fila de palabra: hover, entrada y salida, atenuada al arrastrar',
    'features/words/WordRow.tsx',
    ['hover:border-primario', 'anim-entrada', 'anim-salida', 'opacity-50'],
  ],
  [
    'Palabra arrastrada: copia elevada con sombra y escala elevada',
    'app/DragContext.tsx',
    ['shadow-3', 'scale-(--mov-escala-elevada)'],
  ],
  [
    'Ítem de mazo: hover, selección, destino punteado, mazo bajo la palabra, entrada y salida',
    'features/decks/DeckItem.tsx',
    [
      'hover:bg-fondo',
      'border-dashed',
      'scale-(--mov-escala-elevada)',
      'anim-entrada',
      'anim-salida',
    ],
  ],
  [
    'Depósito en el mazo: pulso del mazo y de su contador',
    'features/decks/DeckItem.tsx',
    ['anim-pulso-anillo', 'anim-pulso-contador'],
  ],
  [
    'Depósito: pulso de la fila al agregar con el menú',
    'features/words/WordRow.tsx',
    ['anim-pulso-anillo'],
  ],
  [
    'Soltar fuera, cancelar o duplicado: la ficha vuelve con --mov-medio',
    'app/DragContext.tsx',
    ["'--mov-medio'", "'--mov-deposito'", 'flyChip'],
  ],
  [
    'Menú "Agregar a mazo" y menú de acciones: entrada rápida',
    'components/Popover.tsx',
    ['anim-menu'],
  ],
  [
    'Diálogo: fundido del fondo y entrada/salida de la caja',
    'components/Dialog.tsx',
    ['anim-fundido', 'anim-fundido-salida', 'anim-escala', 'anim-escala-salida'],
  ],
  ['Aviso (toast): entrada y salida', 'components/Toast.tsx', ['anim-entrada', 'anim-salida']],
  ['Alerta en página: entrada', 'components/Alert.tsx', ['anim-entrada']],
  ['Pestañas: hover y selección', 'components/Tabs.tsx', ['transition-colors']],
  [
    'Indicador de sincronización: fundido al cambiar de estado y giro al sincronizar',
    'components/SyncIndicator.tsx',
    ['anim-fundido', 'animate-spin'],
  ],
  [
    'Barra de avance: crecimiento con --mov-medio',
    'components/ProgressBar.tsx',
    ['duration-(--mov-medio)', 'ease-(--mov-curva)'],
  ],
  ['Navegación entre pantallas: fundido del contenido', 'app/AppShell.tsx', ['anim-fundido']],
  [
    'Estados vacío, carga y error: esqueleto pulsante y entrada',
    'components/StateViews.tsx',
    ['animate-pulse', 'anim-entrada'],
  ],
  ['Salida animada de filas de lista', 'lib/useAnimatedList.ts', ['durationMs', 'leaving']],
]

describe('catálogo componente → animación (design-tokens §7)', () => {
  it.each(CATALOG)('%s', (_row, file, fragments) => {
    const source = read(file)
    for (const fragment of fragments)
      expect(source, `${file} debe contener ${fragment}`).toContain(fragment)
  })

  it('el cambio de tema usa .cambiando-tema con --mov-medio', () => {
    expect(css).toMatch(/\.cambiando-tema[\s\S]*var\(--mov-medio\)/)
    expect(read('lib/appearance.ts')).toContain('cambiando-tema')
  })

  it('los resaltes de lista (agrupación, aprendidas) entran y salen con animación', () => {
    expect(read('features/progress/ProgressPage.tsx')).toContain('useAnimatedList')
    expect(read('features/decks/DeckList.tsx')).toContain('useAnimatedList')
    expect(read('features/words/WordsPanel.tsx')).toContain('useAnimatedList')
  })
})

describe('sin duraciones ni curvas fijas (design-tokens §6.2, regla 1)', () => {
  const ui = sources.filter((f) => /[\\/](components|features|app)[\\/]/.test(f))

  it('ningún componente fija duration-*, delay-*, ease numérico ni cubic-bezier', () => {
    const forbidden = /\b(?:duration|delay)-\d|\bease-\[|cubic-bezier|transition:\s*[^'"`;]*\d+m?s/
    const offenders = ui.filter((f) => forbidden.test(readFileSync(f, 'utf8')))
    expect(offenders.map((f) => f.replace(SRC, 'src'))).toEqual([])
  })

  it('toda animación y transición de animations.css toma duración y curva de los tokens', () => {
    const declarations = [...css.matchAll(/(?:animation|transition):[^;]+;/g)]
      .map((m) => m[0])
      .filter((d) => !/:\s*none;/.test(d)) // `transition: none` (movimiento reducido) no lleva duración
    expect(declarations.length).toBeGreaterThan(8)
    for (const d of declarations) {
      expect(d, d).toMatch(/var\(--mov-(rapido|medio|volteo|deposito)\)/)
      expect(d, d).toMatch(/var\(--mov-curva\)|none/)
    }
  })

  it('las duraciones de JS salen de los tokens (durationMs/waitForExit), no de números', () => {
    for (const file of [
      'components/Dialog.tsx',
      'components/Toast.tsx',
      'lib/useAnimatedList.ts',
      'app/DragContext.tsx',
    ]) {
      const source = read(file)
      expect(source, file).toMatch(/durationMs|waitForExit/)
    }
  })
})

describe('movimiento reducido (design-tokens §6.2, regla 3)', () => {
  const index = read('styles/index.css')

  it('la regla global reduce animaciones y transiciones a ~0', () => {
    expect(index).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation-duration: 0\.01ms/)
    expect(index).toMatch(/transition-duration: 0\.01ms/)
  })

  it('el volteo no rota: las caras se alternan sin rotación 3D', () => {
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(block).toContain('transform: none')
    expect(block).toContain('visibility: hidden')
  })
})

describe('las animaciones no bloquean la interacción (design-tokens §6.2, regla 2)', () => {
  it('lo que sale del DOM queda inerte mientras se anima', () => {
    for (const file of [
      'features/decks/DeckItem.tsx',
      'features/words/WordRow.tsx',
      'features/progress/ProgressPage.tsx',
    ])
      expect(read(file), file).toContain('inert={leaving')
    expect(read('components/Dialog.tsx')).toContain('pointer-events-none')
  })

  it('menús y tarjeta siguiente animan solo la entrada (no hay clase de salida)', () => {
    expect(read('components/Popover.tsx')).not.toContain('anim-salida')
    expect(read('features/study/StudyPage.tsx')).not.toContain('anim-salida')
  })
})
