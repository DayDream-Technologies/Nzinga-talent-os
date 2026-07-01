import type { LogoProps } from '../types'
import { LOGO_DIMENSIONS } from '../types'

/** NZINGA geometric N mark — tenant logo for internal app chrome. */
export function NzingaLogo({
  size = 'md',
  theme = 'dark',
  style,
  className,
  'aria-label': ariaLabel = 'Nzinga',
}: LogoProps) {
  const px = LOGO_DIMENSIONS[size]
  const bg = theme === 'dark' ? '#000000' : '#ffffff'
  const fg = theme === 'dark' ? '#ffffff' : '#111827'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={px}
      height={px}
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ display: 'block', borderRadius: size === 'sm' ? 5 : size === 'md' ? 6 : 8, ...style }}
    >
      <rect width="48" height="48" rx="6" fill={bg} />
      <g stroke={fg} strokeWidth="4.5" strokeLinecap="square" fill="none">
        {/* Left vertical — bottom half */}
        <line x1="13" y1="36" x2="13" y2="24" />
        {/* Diagonal */}
        <line x1="13" y1="12" x2="35" y2="36" />
        {/* Right vertical — top half */}
        <line x1="35" y1="12" x2="35" y2="24" />
      </g>
    </svg>
  )
}

/** Full NZINGA wordmark with icon for light backgrounds. */
export function NzingaWordmark({
  size = 'md',
  theme = 'light',
  style,
  className,
  'aria-label': ariaLabel = 'Nzinga',
}: LogoProps) {
  const iconPx = LOGO_DIMENSIONS[size]
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 16 : size === 'lg' ? 20 : 26
  const textColor = theme === 'dark' ? '#ffffff' : '#111827'

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? 6 : 8, ...style }}
      aria-label={ariaLabel}
    >
      <NzingaLogo size={size} theme={theme === 'dark' ? 'dark' : 'light'} />
      <span
        style={{
          color: textColor,
          fontWeight: 700,
          fontSize,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          letterSpacing: '-0.01em',
        }}
      >
        Nzinga
      </span>
    </span>
  )
}
