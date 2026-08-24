import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/types'
import { cacheKeyForUserSettings, readCachedUserSettings } from '@/lib/user-settings'

vi.mock('@/lib/supabase', () => ({
  supabase: null,
  supabaseConfigured: false,
}))

const user: User = {
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

describe('saveUserSettings (demo / local cache)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('writes name, title, and UI prefs to the device cache', async () => {
    const { saveUserSettings } = await import('@/services/user-settings.service')
    const { user: saved, error } = await saveUserSettings(user, {
      name: 'Jordan H.',
      title: 'Lead Scout',
      settings: { theme: 'dark', sidebar_visible: false },
    })

    expect(error).toBeNull()
    expect(saved.name).toBe('Jordan H.')
    expect(saved.title).toBe('Lead Scout')
    expect(saved.initials).toBe('JH')
    expect(saved.settings).toEqual({ theme: 'dark', sidebar_visible: false })
    expect(readCachedUserSettings('u1')).toEqual({
      name: 'Jordan H.',
      title: 'Lead Scout',
      initials: 'JH',
      settings: { theme: 'dark', sidebar_visible: false },
    })
    expect(localStorage.getItem(cacheKeyForUserSettings('u1'))).toBeTruthy()
  })
})
