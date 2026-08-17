/** Session / idle persistence keys for staff auth. */

export const STORAGE_COMPANY_CODE = 'nto_company_code'
export const STORAGE_LAST_PATH = 'nto_last_path'
export const STORAGE_LAST_ACTIVITY = 'nto_last_activity'
export const STORAGE_THEME = 'nto_theme'
export const STORAGE_NOTIF_READ = 'nto_notif_read_ids'

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

export function isIdleExpired(maxMs = IDLE_MS): boolean {
  const raw = readStorage(STORAGE_LAST_ACTIVITY)
  if (!raw) return false
  const ts = Number(raw)
  if (!Number.isFinite(ts)) return false
  return Date.now() - ts > maxMs
}

export function formatAccountDisplay(accountId: string | null | undefined): string {
  if (!accountId) return '—'
  return accountId.replace(/^NZG-/i, '')
}

export const AGENCY_PROPERTY = 'Nzinga Management Agency'
