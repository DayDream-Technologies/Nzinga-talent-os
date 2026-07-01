import type { ReactNode } from 'react'
import { getCompanyBrand, PLATFORM_BRAND, resolveCompanyBrand, type CompanyBrandId } from '@/constants/company-branding'
import { NzingaLogo, NzingaWordmark } from './logos/NzingaLogo'
import { TMXLogo } from './logos/TMXLogo'
import type { LogoProps, LogoSize, LogoTheme } from './types'

export type CompanyLogoVariant = 'platform' | 'company'

export interface CompanyLogoProps extends Omit<LogoProps, 'theme'> {
  /** `platform` = TMX on login screens; `company` = tenant logo inside the app */
  variant: CompanyLogoVariant
  /** Required when variant is `company` */
  companyCode?: string
  /** Show tenant display name beside the icon (company variant only) */
  showWordmark?: boolean
  theme?: LogoTheme
}

type BrandLogoRenderer = (props: LogoProps & { showWordmark?: boolean }) => ReactNode

/**
 * Registry of tenant logo renderers — add a new entry when onboarding a company.
 *
 * @example
 * // constants/company-branding.ts — add brand + code mapping
 * // logos/AcmeLogo.tsx — implement mark/wordmark
 * // COMPANY_LOGO_REGISTRY.acme = (props) => <AcmeLogo {...props} />
 */
const COMPANY_LOGO_REGISTRY: Record<CompanyBrandId, BrandLogoRenderer> = {
  nzinga: ({ size, theme, showWordmark, style }) =>
    showWordmark ? (
      <NzingaWordmark size={size} theme={theme} style={style} />
    ) : (
      <NzingaLogo size={size} theme={theme} style={style} />
    ),
  tcg: ({ size, theme, showWordmark, style }) =>
    showWordmark ? (
      <NzingaWordmark size={size} theme={theme} style={style} />
    ) : (
      <NzingaLogo size={size} theme={theme} style={style} />
    ),
}

function PlatformLogoBlock({
  size,
  tagline,
  style,
}: {
  size: LogoSize
  tagline?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div style={{ textAlign: 'center', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: tagline ? 12 : 0 }}>
        <TMXLogo size={size} />
      </div>
      {tagline && (
        <p
          style={{
            fontSize: 11,
            color: '#9ca3af',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: '4px 0 0',
          }}
        >
          {PLATFORM_BRAND.tagline}
        </p>
      )}
    </div>
  )
}

function CompanyLogoBlock({
  companyCode,
  size,
  theme,
  showWordmark,
  style,
}: {
  companyCode: string
  size: LogoSize
  theme: LogoTheme
  showWordmark: boolean
  style?: React.CSSProperties
}) {
  const brandId = resolveCompanyBrand(companyCode)
  const brand = getCompanyBrand(companyCode)
  const render = COMPANY_LOGO_REGISTRY[brandId]

  if (!showWordmark) {
    return <span style={style}>{render({ size, theme, showWordmark: false, 'aria-label': brand.displayName })}</span>
  }

  // Custom wordmark per brand; fallback to displayName text for brands without one
  if (brandId === 'nzinga') {
    return <span style={style}>{render({ size, theme, showWordmark: true, 'aria-label': brand.displayName })}</span>
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}>
      {render({ size, theme, showWordmark: false, 'aria-label': brand.displayName })}
      <span
        style={{
          color: theme === 'dark' ? '#fff' : '#111827',
          fontWeight: 700,
          fontSize: size === 'sm' ? 14 : 16,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        }}
      >
        {brand.displayName}
      </span>
    </span>
  )
}

/**
 * Unified logo template — swap `variant` and `companyCode` to render the correct brand.
 */
export function CompanyLogo({
  variant,
  companyCode = '',
  size = 'md',
  theme = 'light',
  showWordmark = false,
  style,
  className,
}: CompanyLogoProps) {
  if (variant === 'platform') {
    return <PlatformLogoBlock size={size} style={style} />
  }

  return (
    <CompanyLogoBlock
      companyCode={companyCode}
      size={size}
      theme={theme}
      showWordmark={showWordmark}
      style={style}
    />
  )
}

/** Platform hero block for company-code landing page. */
export function PlatformBrandHeader({ style }: { style?: React.CSSProperties }) {
  return <PlatformLogoBlock size="hero" tagline style={style} />
}

export { COMPANY_LOGO_REGISTRY, PLATFORM_BRAND, getCompanyBrand, resolveCompanyBrand }
