import axe from 'axe-core'

/**
 * Ejecuta axe sobre un nodo y devuelve las violaciones. El contraste de color no se puede calcular en
 * jsdom: lo cubren styles/tokens.test.ts (todas las combinaciones) y Playwright (Fase 14).
 */
export async function axeViolations(node: Element = document.body) {
  const result = await axe.run(node, { rules: { 'color-contrast': { enabled: false } } })
  return result.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(' | ')})`,
  )
}
