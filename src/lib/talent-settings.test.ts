import { beforeEach, describe, expect, it } from 'vitest'
import {
  normalizeTalentPortalPrefs,
  readTalentPortalPrefs,
  talentSettingsKey,
  writeTalentPortalPrefs,
} from '@/lib/talent-settings'

describe('talent portal prefs', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to dark mode and both notification channels', () => {
    expect(normalizeTalentPortalPrefs({})).toEqual({ theme: 'dark', notifications: 'both' })
    expect(readTalentPortalPrefs('maya@example.com')).toEqual({ theme: 'dark', notifications: 'both' })
  })

  it('persists theme and notification prefs per email', () => {
    writeTalentPortalPrefs('Maya@example.com', { theme: 'light', notifications: 'email' })
    expect(localStorage.getItem(talentSettingsKey('maya@example.com'))).toBeTruthy()
    expect(readTalentPortalPrefs('maya@example.com')).toEqual({ theme: 'light', notifications: 'email' })
  })
})
