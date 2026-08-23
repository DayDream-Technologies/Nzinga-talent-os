/** Session / idle persistence keys for staff auth. */

export const STORAGE_COMPANY_CODE = 'nto_company_code'
export const STORAGE_LAST_PATH = 'nto_last_path'
export const STORAGE_LAST_ACTIVITY = 'nto_last_activity'
export const STORAGE_THEME = 'nto_theme'
export const STORAGE_SIDEBAR = 'nto_sidebar_visible'
export const STORAGE_NOTIF_READ = 'nto_notif_read_ids'
export const UI_PREFS_EVENT = 'nto-ui-prefs'

/** Pre-auth screens. A stored company code should survive visiting these. */
export function isPublicAuthPath(pathname: string): boolean {
  if (
    pathname === '/' ||
    pathname === '/tmx' ||
    pathname === '/login' ||
    pathname === '/portal' ||
    pathname === '/reset-password'
  ) {
    return true
  }
  if (pathname.startsWith('/auth/')) return true
  if (pathname.startsWith('/guardian')) return true
  if (pathname === '/talent/login' || pathname === '/talent/home') return true
  return false
}

/** Default: sidebar visible (classic layout). */
export function readSidebarVisible(): boolean {
  const v = readStorage(STORAGE_SIDEBAR)
  if (v === null) return true
  return v !== '0' && v !== 'false'
}

export function writeSidebarVisible(visible: boolean) {
  writeStorage(STORAGE_SIDEBAR, visible ? '1' : '0')
  try {
    window.dispatchEvent(new Event(UI_PREFS_EVENT))
  } catch {
    /* ignore */
  }
}

export const IDLE_MS = 5 * 60 * 1000

export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode */
  }
}

export function removeStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* private mode */
  }
}

export function touchActivity() {
  writeStorage(STORAGE_LAST_ACTIVITY, String(Date.now()))
}

export function clearIdleTimer() {
  removeStorage(STORAGE_LAST_ACTIVITY)
}

/** Skip idle reauth for a short window after an explicit password login. */
let suppressIdleReauthUntil = 0

export function markFreshLogin() {
  touchActivity()
  suppressIdleReauthUntil = Date.now() + 10_000
}

export function isFreshLoginActive(): boolean {
  return Date.now() < suppressIdleReauthUntil
}

export function clearFreshLoginMark() {
  suppressIdleReauthUntil = 0
}

export function isIdleExpired(maxMs = IDLE_MS): boolean {
  const raw = readStorage(STORAGE_LAST_ACTIVITY)
  if (!raw) return false
  const ts = Number(raw)
  if (!Number.isFinite(ts)) return false
  return Date.now() - ts > maxMs
}

/**
 * Idle lock applies when restoring an existing session on a protected page.
 * A first login (credentials, or still on /login|/tmx) always starts a fresh timer.
 */
export function shouldRequireIdleReauthOnRestore(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '',
): boolean {
  if (isFreshLoginActive()) return false
  if (isPublicAuthPath(pathname)) return false
  return isIdleExpired()
}

export function formatAccountDisplay(accountId: string | null | undefined): string {
  if (!accountId) return '—'
  return accountId.replace(/^NZG-/i, '')
}

export const AGENCY_PROPERTY = 'Nzinga Management Agency'
