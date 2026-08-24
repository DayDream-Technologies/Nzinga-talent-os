import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { User } from '@/types'

const sampleUser: User = {
  id: 'u1',
  name: 'Jordan Hayes',
  initials: 'JH',
  role: 'scout',
  email: 'jordan@nzinga.co',
  password: 'scout123',
  title: 'Talent Scout',
  color: '#7c3aed',
  company_code: 'NZG',
  settings: { theme: 'light', sidebar_visible: true },
}

const { switchUser, saveUserSettings } = vi.hoisted(() => ({
  switchUser: vi.fn(),
  saveUserSettings: vi.fn(),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuthContext: () => ({ user: sampleUser, switchUser }),
}))

vi.mock('@/services/user-settings.service', () => ({
  saveUserSettings,
}))

vi.mock('@/lib/phone', () => ({
  getRcConnectionStatus: async () => ({ connected: false }),
  getRcAuthUrl: async () => null,
  disconnectRc: async () => true,
}))

vi.mock('@/services/auth.service', () => ({
  sendPasswordResetEmail: async () => ({ error: null, demo: true }),
}))

import { SettingsPage } from '@/pages/SettingsPage'

function renderPage() {
  const router = createMemoryRouter([{ path: '/settings', element: <SettingsPage /> }], {
    initialEntries: ['/settings'],
  })
  return render(<RouterProvider router={router} />)
}

describe('SettingsPage save confirm', () => {
  it('asks for confirmation before persisting and does nothing on cancel', async () => {
    saveUserSettings.mockResolvedValue({ user: sampleUser, error: null })
    renderPage()

    fireEvent.change(screen.getByDisplayValue('Jordan Hayes'), { target: { value: 'Jordan H.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/saves your name, title, theme, and sidebar/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(saveUserSettings).not.toHaveBeenCalled()
    expect(switchUser).not.toHaveBeenCalled()
  })

  it('persists after confirm', async () => {
    const saved = { ...sampleUser, name: 'Jordan H.' }
    saveUserSettings.mockResolvedValue({ user: saved, error: null })
    renderPage()

    fireEvent.change(screen.getByDisplayValue('Jordan Hayes'), { target: { value: 'Jordan H.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save settings' }))

    await waitFor(() => {
      expect(saveUserSettings).toHaveBeenCalledTimes(1)
    })
    expect(saveUserSettings).toHaveBeenCalledWith(
      sampleUser,
      expect.objectContaining({
        name: 'Jordan H.',
        title: 'Talent Scout',
        settings: expect.objectContaining({ theme: 'light' }),
      }),
    )
  })
})
