// CLAUDE.md: prohibido usar valores hardcodeados en componentes. Todo valor visual sale de tokens.css.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(process.cwd(), 'src')

function files(dir: string): string[] {
  try {
    return readdirSync(dir).flatMap((name) => {
      const p = join(dir, name)
      return statSync(p).isDirectory() ? files(p) : [p]
    })
  } catch {
    return []
  }
}

const sources = ['components', 'features', 'app']
  .flatMap((d) => files(join(ROOT, d)))
  .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))

const FORBIDDEN: [string, RegExp][] = [
  ['color hexadecimal', /#[0-9a-fA-F]{3,8}\b/],
  ['color rgb/hsl', /\b(?:rgb|rgba|hsl|hsla)\(/],
  [
    'valor arbitrario de Tailwind (px/rem/ms/s/%/color)',
    /\[(?:#|\d+(?:\.\d+)?(?:px|rem|em|ms|s|%))[^\]]*\]/,
  ],
  ['duración fija (duration-*/delay-*)', /\b(?:duration|delay)-\d+/],
  ['style inline con unidades fijas', /style=\{\{[^}]*\d+(?:px|ms)/],
]

describe('sin valores hardcodeados en componentes', () => {
  it('encuentra archivos para revisar', () => {
    expect(sources.length).toBeGreaterThan(5)
  })

  it.each(FORBIDDEN)('sin %s', (_name, re) => {
    const offenders = sources.filter((f) => re.test(readFileSync(f, 'utf8')))
    expect(offenders.map((f) => f.replace(ROOT, 'src'))).toEqual([])
  })
})
