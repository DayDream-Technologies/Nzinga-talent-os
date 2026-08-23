/** Paths used in Auth emails. Must be listed under Authentication → URL Configuration → Redirect URLs. */
export const AUTH_EMAIL_PATHS = {
  confirmed: '/auth/confirmed',
  resetPassword: '/reset-password',
  guardianVerify: '/guardian/verify',
} as const

/** Absolute redirect for Auth emails (signup confirm, reset, magic link). */
export function getAuthEmailRedirectUrl(
  path: string,
  search?: Record<string, string>,
): string | undefined {
  if (typeof window === 'undefined') return undefined
  const url = new URL(path, window.location.origin)
  if (search) {
    for (const [key, value] of Object.entries(search)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

/** Auth confirmation types Supabase may put in the redirect URL. */
const CONFIRM_TYPES = new Set(['signup', 'email', 'invite', 'magiclink', 'email_change'])

/**
 * True when the current URL looks like a Supabase email-confirmation redirect
 * (hash tokens or query params), so we can show a success screen instead of the home page.
 */
export function hasEmailConfirmationInUrl(
  search = typeof window !== 'undefined' ? window.location.search : '',
  hash = typeof window !== 'undefined' ? window.location.hash : '',
): boolean {
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const queryParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)

  const type = hashParams.get('type') || queryParams.get('type')
  if (type && CONFIRM_TYPES.has(type)) return true

  // Implicit grant: confirmation links often include access_token + type=signup
  if (hashParams.get('access_token') && type === 'signup') return true

  // PKCE: ?code=…&type=signup (type may be omitted; prefer explicit type when present)
  if (queryParams.get('code') && (!type || CONFIRM_TYPES.has(type))) {
    // Only treat as email confirm when type is present, or error_description is absent
    // and this is not an OAuth provider callback path.
    if (type && CONFIRM_TYPES.has(type)) return true
  }

  return false
}
