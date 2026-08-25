export type TalentPortalTheme = 'dark' | 'light'
export type TalentNotificationChannel = 'email' | 'portal' | 'both'

export interface TalentPortalPrefs {
  theme: TalentPortalTheme
  notifications: TalentNotificationChannel
}

export const DEFAULT_TALENT_PORTAL_PREFS: TalentPortalPrefs = {
  theme: 'dark',
  notifications: 'both',
}

export function talentSettingsKey(email: string): string {
  return `nto_talent_settings_${email.trim().toLowerCase()}`
}

export function normalizeTalentPortalPrefs(raw: unknown): TalentPortalPrefs {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    theme: obj.theme === 'light' ? 'light' : 'dark',
    notifications:
      obj.notifications === 'email' || obj.notifications === 'portal' || obj.notifications === 'both'
        ? obj.notifications
        : 'both',
  }
}

export function readTalentPortalPrefs(email: string): TalentPortalPrefs {
  if (!email || typeof localStorage === 'undefined') return { ...DEFAULT_TALENT_PORTAL_PREFS }
  try {
    const raw = localStorage.getItem(talentSettingsKey(email))
    if (!raw) return { ...DEFAULT_TALENT_PORTAL_PREFS }
    return normalizeTalentPortalPrefs(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_TALENT_PORTAL_PREFS }
  }
}

export function writeTalentPortalPrefs(email: string, prefs: TalentPortalPrefs): void {
  if (!email || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(talentSettingsKey(email), JSON.stringify(normalizeTalentPortalPrefs(prefs)))
  } catch {
    /* private mode */
  }
}
