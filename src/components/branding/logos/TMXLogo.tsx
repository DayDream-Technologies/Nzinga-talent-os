import type { LogoProps } from '../types'
import { TMX_WORDMARK_DIMENSIONS } from '../types'

const TMX_BLUE = '#5D5FEF'

/** Talent Manager X — platform logo for login / company-code screens. */
export function TMXLogo({
  size = 'lg',
  theme = 'light',
  style,
  className,
  'aria-label': ariaLabel = 'Talent Manager X',
}: LogoProps) {
  const { width, height } = TMX_WORDMARK_DIMENSIONS[size]
  const textFill = theme === 'dark' ? '#ffffff' : '#111827'
  const chevronFill = theme === 'dark' ? '#ffffff' : '#111827'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 380 52"
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ display: 'block', ...style }}
    >
      <text
        x="0"
        y="38"
        fill={textFill}
        fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
        fontSize="34"
        fontWeight="700"
        letterSpacing="0.02em"
      >
        TALENT MANAGER
      </text>
      <g transform="translate(318, 4)">
        <polygon
          points="8,2 22,16 8,30 22,44"
          fill="none"
          stroke={TMX_BLUE}
          strokeWidth="3.5"
          strokeLinejoin="miter"
        />
        <polygon
          points="8,2 22,16 8,30"
          fill="none"
          stroke={TMX_BLUE}
          strokeWidth="3.5"
          strokeLinejoin="miter"
          transform="translate(0, 2)"
        />
        <polygon points="18,0 52,26 18,52 28,26" fill={chevronFill} />
      </g>
    </svg>
  )
}

/** Compact TMX mark (X icon only) for tight spaces. */
export function TMXMark({ size = 'md', style, className, 'aria-label': ariaLabel = 'TMX' }: LogoProps) {
  const px = size === 'sm' ? 20 : size === 'md' ? 24 : size === 'lg' ? 32 : 40

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
      width={px}
      height={px}
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ display: 'block', ...style }}
    >
      <polygon
        points="4,4 18,18 4,32 18,46"
        fill="none"
        stroke={TMX_BLUE}
        strokeWidth="3.5"
        strokeLinejoin="miter"
      />
      <polygon points="18,0 52,26 18,52 28,26" fill="#111827" />
    </svg>
  )
}
