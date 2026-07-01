/** Platform product branding (login / pre-auth screens). */
export const PLATFORM_BRAND = {
  id: 'tmx' as const,
  name: 'Talent Manager',
  shortName: 'TMX',
  tagline: 'Talent Operating System',
  footer: 'Talent Manager — Streamlined Talent Management',
}

export type CompanyBrandId = 'nzinga' | 'tcg'

export interface CompanyBrandConfig {
  id: CompanyBrandId
  displayName: string
  tagline: string
}

/** Per-tenant brand metadata — add entries as new companies onboard. */
export const COMPANY_BRANDS: Record<CompanyBrandId, CompanyBrandConfig> = {
  nzinga: {
    id: 'nzinga',
    displayName: 'Nzinga',
    tagline: 'Talent OS',
  },
  tcg: {
    id: 'tcg',
    displayName: 'TCG',
    tagline: 'Talent OS',
  },
}

/** Map auth company codes to tenant brand IDs. */
export const COMPANY_CODE_TO_BRAND: Record<string, CompanyBrandId> = {
  NZG: 'nzinga',
  NZINGA: 'nzinga',
  TCG: 'tcg',
}

export function resolveCompanyBrand(companyCode: string): CompanyBrandId {
  return COMPANY_CODE_TO_BRAND[companyCode.trim().toUpperCase()] ?? 'nzinga'
}

export function getCompanyBrand(companyCode: string): CompanyBrandConfig {
  return COMPANY_BRANDS[resolveCompanyBrand(companyCode)]
}
