import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProspectTrackingBoard } from '@/components/agency/ProspectTrackingBoard'
import type { AgencyProspect } from '@/types/agency'

const prospect: AgencyProspect = {
  id: 'pros_maya',
  accountId: 'NZG-200101',
  name: 'Maya Rivera',
  email: 'maya@example.com',
  workArea: 'Modeling',
  stage: 'communicating',
  source: 'Scout referral',
  submittedAt: '2026-08-01T10:00:00Z',
  notes: '',
  organization: 'NZG',
  messageEmails: ['maya@example.com'],
  contracts: [],
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'director' } }),
}))

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({
    prospects: [prospect],
    updateProspect: vi.fn(),
    setProspectStage: vi.fn(),
  }),
}))

describe('ProspectTrackingBoard', () => {
  it('opens the preview on card click and links to the talent full profile', () => {
    render(
      <MemoryRouter initialEntries={['/prospect-tracking']}>
        <Routes>
          <Route path="/prospect-tracking" element={<ProspectTrackingBoard />} />
          <Route path="/talent/:accountId" element={<div>Full profile</div>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Maya Rivera'))

    expect(screen.getByText('Account 200101')).toBeInTheDocument()
    const profileLink = screen.getByRole('link', { name: 'Open full profile' })
    expect(profileLink).toHaveAttribute('href', '/talent/NZG-200101')

    fireEvent.click(profileLink)
    expect(screen.getByText('Full profile')).toBeInTheDocument()
  })
})
