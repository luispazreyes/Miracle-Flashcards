type Size = 'sm' | 'md'

const sizes: Record<Size, string> = { sm: 'size-8 text-sm', md: 'size-10 text-base' }

interface Props {
  name: string
  src?: string
  size?: Size
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Imagen si existe; si no, iniciales. El nombre accesible es siempre `name`. */
export function Avatar({ name, src, size = 'md' }: Props) {
  const base = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill ${sizes[size]}`
  if (src) {
    return <img src={src} alt={name} className={`${base} object-cover`} />
  }
  return (
    <span role="img" aria-label={name} className={`${base} bg-primario font-semibold text-sobre-primario`}>
      <span aria-hidden="true">{initials(name)}</span>
    </span>
  )
}
