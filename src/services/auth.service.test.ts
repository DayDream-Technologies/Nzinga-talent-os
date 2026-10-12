import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: false,
  supabase: null,
  clearLocalAuthSession: vi.fn(),
}))

import { loginApprovedTalent, logout, restoreApprovedTalentSession } from '@/services/auth.service'

describe('talent login', () => {
  it('does not accept a hardcoded demo password when the database is not configured', async () => {
    const result = await loginApprovedTalent('maya@example.com', 'talent123')
    expect(result.profile).toBeNull()
    expect(result.talent).toBeNull()
    expect(result.error).toMatch(/not configured/i)
  })

  it('does not restore a leftover demo talent session', async () => {
    sessionStorage.setItem('nto_demo_talent_email', 'maya@example.com')
    const restored = await restoreApprovedTalentSession()
    expect(restored.profile).toBeNull()
    expect(restored.talent).toBeNull()
    await logout()
  })
})
