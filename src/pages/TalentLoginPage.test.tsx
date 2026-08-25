import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TalentLoginPage } from '@/pages/TalentLoginPage'
import { DEMO_TALENT_LOGIN } from '@/constants/demo-talent'
import { STORAGE_COMPANY_CODE } from '@/lib/session-storage'

const { loginApprovedTalent, setSession } = vi.hoisted(() => ({
  loginApprovedTalent: vi.fn(),
  setSession: vi.fn(),
}))

vi.mock('@/context/TalentAuthContext', () => ({
  useTalentAuth: () => ({
    session: null,
    loading: false,
    setSession,
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('@/services/auth.service', () => ({
  loginApprovedTalent,
  sendPasswordResetEmail: vi.fn(),
  friendlyAuthError: (msg: string) => msg,
  TALENT_LOGIN_DEMO_MESSAGE: 'demo reset unavailable',
}))

describe('TalentLoginPage NZG Maya login', () => {
  beforeEach(() => {
    setSession.mockReset()
    loginApprovedTalent.mockReset()
    loginApprovedTalent.mockResolvedValue({
      profile: { id: 'demo_profile_t_maya', email: DEMO_TALENT_LOGIN.email, name: DEMO_TALENT_LOGIN.name },
      talent: { id: DEMO_TALENT_LOGIN.talentId, name: DEMO_TALENT_LOGIN.name, stage: 'signed_onboarding' },
      error: null,
    })
    localStorage.setItem(STORAGE_COMPANY_CODE, 'NZG')
  })

  it('signs in as Maya Rivera for the NZG org', async () => {
    render(
      <MemoryRouter>
        <TalentLoginPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Log in as Maya Rivera' }))

    await waitFor(() => {
      expect(loginApprovedTalent).toHaveBeenCalledWith(
        DEMO_TALENT_LOGIN.email,
        DEMO_TALENT_LOGIN.password,
      )
    })
    expect(setSession).toHaveBeenCalled()
  })

  it('hides the Maya shortcut for other company codes', () => {
    localStorage.setItem(STORAGE_COMPANY_CODE, 'TCG')
    render(
      <MemoryRouter>
        <TalentLoginPage />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: 'Log in as Maya Rivera' })).not.toBeInTheDocument()
  })
})
