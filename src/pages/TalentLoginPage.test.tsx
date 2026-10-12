import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TalentLoginPage } from '@/pages/TalentLoginPage'

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
  TALENT_LOGIN_DEMO_MESSAGE: 'Password reset is not available until the database is configured.',
}))

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: true,
}))

describe('TalentLoginPage', () => {
  beforeEach(() => {
    setSession.mockReset()
    loginApprovedTalent.mockReset()
    loginApprovedTalent.mockResolvedValue({
      profile: { id: 'profile_1', email: 'client@example.com', name: 'Client Example' },
      talent: { id: 't1', name: 'Client Example', stage: 'signed_onboarding' },
      error: null,
    })
  })

  it('signs in with the email and password entered on the form', async () => {
    render(
      <MemoryRouter>
        <TalentLoginPage />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Log in as Maya Rivera' })).not.toBeInTheDocument()
    expect(screen.queryByText(/demo client/i)).not.toBeInTheDocument()

    const email = document.querySelector('input[type="email"]') as HTMLInputElement
    const password = document.querySelector('input[type="password"]') as HTMLInputElement
    fireEvent.change(email, { target: { value: 'client@example.com' } })
    fireEvent.change(password, { target: { value: 'a-real-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(loginApprovedTalent).toHaveBeenCalledWith('client@example.com', 'a-real-password')
    })
    expect(setSession).toHaveBeenCalled()
  })
})
