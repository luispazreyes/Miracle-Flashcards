// Iconos decorativos (aria-hidden): el significado siempre va también en texto (WCAG 1.4.1).
const paths = {
  check: 'M5 13l4 4L19 7',
  checkCircle: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8 12l3 3 5-5',
  folder: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  archive: 'M4 7h16M5 7v11a2 2 0 002 2h10a2 2 0 002-2V7M10 12h4M4 4h16v3H4z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
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
