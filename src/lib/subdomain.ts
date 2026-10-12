/**
 * Subdomain → company code resolution.
 *
 * When the app is served on a subdomain of the production domain
 * (e.g. nzinga.talentmanagerx.com), the company code is derived
 * automatically so users skip the code-entry screen.
 */

import { SUBDOMAIN_TO_COMPANY_CODE } from '@/constants/company-branding'

/** Subdomains that should be treated as the naked domain (no tenant). */
const IGNORED_SUBDOMAINS = new Set(['www'])

/**
 * Extract the leftmost subdomain label from a hostname.
 * Returns `null` for naked domains, `www`, localhost, and IP addresses.
 *
 * Examples:
 *   nzinga.talentmanagerx.com  → 'nzinga'
 *   www.talentmanagerx.com     → null
 *   talentmanagerx.com         → null
 *   localhost                  → null
 */
function extractSubdomain(hostname: string): string | null {
  if (!hostname || hostname === 'localhost') return null
  // Skip IP addresses (v4 or v6)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith('[')) return null
  // localhost with port is already handled by splitting on ':'

  const parts = hostname.split('.')
  // Need at least 3 parts for a subdomain (sub.domain.tld)
  if (parts.length < 3) return null

  const sub = parts[0].toLowerCase()
  if (IGNORED_SUBDOMAINS.has(sub)) return null
  return sub
}

/**
 * Returns the company code that matches the current subdomain,
 * or `null` if no subdomain match exists (show the code-entry screen).
 */
export function getSubdomainCompanyCode(
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
): string | null {
  const sub = extractSubdomain(hostname)
  if (!sub) return null
  return SUBDOMAIN_TO_COMPANY_CODE[sub] ?? null
}

/**
 * True when the current URL is a recognized tenant subdomain.
 * When true, "change company code" UI should be hidden because
 * the tenant is determined by the domain.
 */
export function isSubdomainLocked(
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
): boolean {
  return getSubdomainCompanyCode(hostname) !== null
}
