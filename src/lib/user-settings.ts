import type { ThemePreference, User, UserUiSettings } from '@/types'
import {
  STORAGE_THEME,
  readSidebarVisible,
  readStorage,
  writeSidebarVisible,
  writeStorage,
} from '@/lib/session-storage'

export const DEFAULT_USER_UI_SETTINGS: UserUiSettings = {
  theme: 'light',
  sidebar_visible: true,
}

export function cacheKeyForUserSettings(userId: string): string {
  return `nto_user_settings_${userId}`
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function normalizeUserUiSettings(raw: unknown): UserUiSettings {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    theme: obj.theme === 'dark' ? 'dark' : 'light',
    sidebar_visible: obj.sidebar_visible !== false,
  }
}

export function applyTheme(theme: ThemePreference): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
  writeStorage(STORAGE_THEME, theme)
}

export function applyUserUiSettings(settings: UserUiSettings): void {
  applyTheme(settings.theme)
  writeSidebarVisible(settings.sidebar_visible)
}

export interface CachedUserSettings {
  name: string
  title: string
  initials: string
  settings: UserUiSettings
}

export function readCachedUserSettings(userId: string): CachedUserSettings | null {
  try {
    const raw = localStorage.getItem(cacheKeyForUserSettings(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CachedUserSettings>
    if (!parsed || typeof parsed !== 'object') return null
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      title: typeof parsed.title === 'string' ? parsed.title : '',
      initials: typeof parsed.initials === 'string' ? parsed.initials : '',
      settings: normalizeUserUiSettings(parsed.settings),
    }
  } catch {
    return null
  }
}

export function writeCachedUserSettings(userId: string, payload: CachedUserSettings): void {
  try {
    localStorage.setItem(cacheKeyForUserSettings(userId), JSON.stringify(payload))
  } catch {
    /* private mode */
  }
}

/**
 * Prefer account settings from the database; otherwise cached device copy;
 * otherwise current local theme/sidebar.
 */
export function hydrateUserSettings(user: User): User {
  const hasDbSettings = user.settings != null && typeof user.settings === 'object'
  if (hasDbSettings) {
    const settings = normalizeUserUiSettings(user.settings)
    writeCachedUserSettings(user.id, {
      name: user.name,
      title: user.title,
      initials: user.initials,
      settings,
    })
    return { ...user, settings }
  }

  const cached = readCachedUserSettings(user.id)
  if (cached) {
    return {
      ...user,
      name: cached.name || user.name,
      title: cached.title || user.title,
      initials: cached.initials || user.initials,
      settings: cached.settings,
    }
  }

  return {
    ...user,
    settings: {
      theme: readStorage(STORAGE_THEME) === 'dark' ? 'dark' : 'light',
      sidebar_visible: readSidebarVisible(),
    },
  }
}
