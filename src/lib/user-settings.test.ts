import { describe, expect, it, beforeEach } from 'vitest'
import type { User } from '@/types'
import {
  applyTheme,
  cacheKeyForUserSettings,
  hydrateUserSettings,
  initialsFromName,
  normalizeUserUiSettings,
  writeCachedUserSettings,
} from '@/lib/user-settings'
import { STORAGE_THEME } from '@/lib/session-storage'

const baseUser: User = {
  id: 'u1',
  name: 'Jordan Hayes',
  initials: 'JH',
  role: 'scout',
  email: 'jordan@nzinga.co',
  password: 'scout123',
  title: 'Talent Scout',
  color: '#7c3aed',
  company_code: 'NZG',
}

describe('initialsFromName', () => {
  it('uses first and last initials', () => {
    expect(initialsFromName('Jordan Hale')).toBe('JH')
  })

  it('uses two letters of a single name', () => {
    expect(initialsFromName('Jordan')).toBe('JO')
  })
})

describe('normalizeUserUiSettings', () => {
  it('defaults missing values', () => {
    expect(normalizeUserUiSettings(null)).toEqual({ theme: 'light', sidebar_visible: true })
  })

  it('accepts dark theme and hidden sidebar', () => {
    expect(normalizeUserUiSettings({ theme: 'dark', sidebar_visible: false })).toEqual({
      theme: 'dark',
      sidebar_visible: false,
    })
  })
})

describe('hydrateUserSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('prefers account settings from the user record over the device cache', () => {
    writeCachedUserSettings('u1', {
      name: 'Cached Name',
      title: 'Cached Title',
      initials: 'CN',
      settings: { theme: 'dark', sidebar_visible: false },
    })
    const hydrated = hydrateUserSettings({
      ...baseUser,
      settings: { theme: 'light', sidebar_visible: true },
    })
    expect(hydrated.name).toBe('Jordan Hayes')
    expect(hydrated.settings).toEqual({ theme: 'light', sidebar_visible: true })
  })

  it('restores name and UI prefs from cache when the account has no settings', () => {
    writeCachedUserSettings('u1', {
      name: 'Cached Jordan',
      title: 'Scout Lead',
      initials: 'CJ',
      settings: { theme: 'dark', sidebar_visible: false },
    })
    const hydrated = hydrateUserSettings(baseUser)
    expect(hydrated.name).toBe('Cached Jordan')
    expect(hydrated.title).toBe('Scout Lead')
    expect(hydrated.settings).toEqual({ theme: 'dark', sidebar_visible: false })
    expect(localStorage.getItem(cacheKeyForUserSettings('u1'))).toBeTruthy()
  })
})

describe('applyTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''
    localStorage.clear()
  })

  it('sets data-theme and color-scheme for dark without inlining palette vars', () => {
    applyTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(localStorage.getItem(STORAGE_THEME)).toBe('dark')
    expect(document.documentElement.style.getPropertyValue('--color-page-bg')).toBe('')
    expect(document.documentElement.style.getPropertyValue('--color-t1')).toBe('')
  })

  it('sets data-theme light', () => {
    applyTheme('dark')
    applyTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(localStorage.getItem(STORAGE_THEME)).toBe('light')
  })
})
