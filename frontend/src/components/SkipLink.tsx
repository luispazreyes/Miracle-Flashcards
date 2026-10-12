/** WCAG 2.4.1: el destino es el elemento con id="contenido" (lo pone AppShell). */
export function SkipLink() {
  return (
    <a
      href="#contenido"
      className="absolute top-2 left-2 z-40 -translate-y-20 rounded-md bg-primario px-4 py-2 font-semibold text-sobre-primario focus:translate-y-0"
    >
      Saltar al contenido
    </a>
  )
}
