// Iconos decorativos (aria-hidden): el significado siempre va también en texto (WCAG 1.4.1).
const paths = {
  check: 'M5 13l4 4L19 7',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L2.6 17.5A2 2 0 004.3 20.5h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 100-18 9 9 0 000 18z',
  error: 'M12 21a9 9 0 100-18 9 9 0 000 18zM15 9l-6 6m0-6l6 6',
  correo: 'M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
  nube: 'M3 3l18 18M17 17H7a4 4 0 01-.9-7.9A5 5 0 0112 6a5 5 0 014.9 4A3.5 3.5 0 0117 17z',
  sincronizar: 'M4 4v5h5M20 20v-5h-5M5.6 9A8 8 0 0118.4 7.5M18.4 15A8 8 0 015.6 16.5',
  checkcirculo: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8 12l3 3 5-5',
  circulo: 'M12 21a9 9 0 100-18 9 9 0 000 18z',
  carpeta: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  guion: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8 12h8',
  asa: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  buscar: 'M21 21l-4.3-4.3M17 10a7 7 0 11-14 0 7 7 0 0114 0z',
  mas: 'M12 5h.01M12 12h.01M12 19h.01',
  mascircular: 'M12 5v14M5 12h14',
  cerrar: 'M6 6l12 12M18 6L6 18',
  instalar: 'M12 4v11m0 0l-4-4m4 4l4-4M5 20h14',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d={paths[name]} />
    </svg>
  )
}
