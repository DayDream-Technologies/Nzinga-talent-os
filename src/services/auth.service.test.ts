import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_TALENT_LOGIN, DEMO_TALENT_SESSION_KEY } from '@/constants/demo-talent'
import {
  loginApprovedTalent,
  logout,
  restoreApprovedTalentSession,
} from '@/services/auth.service'
import { demoStore } from '@/services/demo-store'

describe('demo talent login', () => {
  beforeEach(() => {
    demoStore.reset()
    sessionStorage.clear()
  })

  it('signs in the seeded demo client and restores the session', async () => {
    const result = await loginApprovedTalent(DEMO_TALENT_LOGIN.email, DEMO_TALENT_LOGIN.password)
    expect(result.error).toBeNull()
    expect(result.talent?.id).toBe(DEMO_TALENT_LOGIN.talentId)
    expect(result.talent?.stage).toBe('signed_onboarding')
    expect(result.profile?.email).toBe(DEMO_TALENT_LOGIN.email)
    expect(sessionStorage.getItem(DEMO_TALENT_SESSION_KEY)).toBe(DEMO_TALENT_LOGIN.email)

    const restored = await restoreApprovedTalentSession()
    expect(restored.talent?.id).toBe('t_maya')
    expect(restored.profile?.name).toBe('Maya Rivera')
  })

  it('rejects the wrong password', async () => {
    const result = await loginApprovedTalent(DEMO_TALENT_LOGIN.email, 'nope')
    expect(result.talent).toBeNull()
    expect(result.error).toMatch(/incorrect email or password/i)
  })

  it('clears the demo session on logout', async () => {
    await loginApprovedTalent(DEMO_TALENT_LOGIN.email, DEMO_TALENT_LOGIN.password)
    await logout()
    const restored = await restoreApprovedTalentSession()
    expect(restored.profile).toBeNull()
    expect(restored.talent).toBeNull()
  })
})
