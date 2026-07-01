import type { CSSProperties } from 'react'

export type LogoSize = 'sm' | 'md' | 'lg' | 'hero'
export type LogoTheme = 'light' | 'dark'

export interface LogoProps {
  size?: LogoSize
  theme?: LogoTheme
  className?: string
  style?: CSSProperties
  'aria-label'?: string
}

export const LOGO_DIMENSIONS: Record<LogoSize, number> = {
  sm: 24,
  md: 28,
  lg: 48,
  hero: 64,
}

export const TMX_DIMENSIONS: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 120, height: 18 },
  md: { width: 160, height: 24 },
  lg: { width: 220, height: 32 },
  hero: { width: 280, height: 40 },
}

export const TMX_WORDMARK_DIMENSIONS: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 200, height: 28 },
  md: { width: 260, height: 36 },
  lg: { width: 320, height: 44 },
  hero: { width: 380, height: 52 },
}
