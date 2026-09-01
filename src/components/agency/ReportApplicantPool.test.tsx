import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AgencyModule } from '@/components/agency/AgencyModules'
import type { Application } from '@/types'
import type { AgencyProspect } from '@/types/agency'

const { inProgress, submitted } = vi.hoisted(() => {
  const inProgress: Application = {
    id: 'app_kai',
    talent_id: 't4',
    access_code: 'KAI2026',
    company_code: 'NZG',
    talent_name: 'Kai Johnson',
    talent_email: 'kai@example.com',
    status: 'in_progress',
    created_at: '2026-05-18T10:00:00Z',
    last_saved: '2026-05-19T14:30:00Z',
    completed_sections: ['personal'],
    data: {},
  }
  const submitted: Application = {
    id: 'app_maya',
    talent_id: null,
    access_code: 'MAYA2026',
    company_code: 'NZG',
    talent_name: 'Maya Rivera',
    talent_email: 'maya@example.com',
    status: 'submitted',
    created_at: '2026-07-01T09:00:00Z',
    last_saved: '2026-08-01T10:15:00Z',
    submitted_at: '2026-08-01T10:20:00Z',
    completed_sections: ['personal'],
    data: {},
  }
  return { inProgress, submitted }
})

const prospect: AgencyProspect = {
  id: 'pros_maya',
  accountId: 'NZG-200101',
  name: 'Maya Rivera',
  email: 'maya@example.com',
  workArea: 'Modeling',
  stage: 'application_completed',
  source: 'Scout referral',
  submittedAt: '2026-08-01T10:00:00Z',
  notes: 'Ready for screening',
  organization: 'NZG',
  messageEmails: ['maya@example.com'],
  contracts: [],
  linkedApplicationId: 'app_maya',
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'director' } }),
}))

vi.mock('@/context/AppDataContext', () => ({
  useAppData: () => ({
    applications: { app_kai: inProgress, app_maya: submitted },
    talents: [],
  }),
}))

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({
    prospects: [prospect],
    talent: [],
  }),
}))

function ts(iso: string) {
  return new Date(iso).toLocaleString()
}

describe('ReportApplicantPool', () => {
  it('shows created, last-saved, and submitted timestamps for applications', () => {
    render(
      <MemoryRouter>
        <AgencyModule moduleId="report-applicant-pool" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Applicant Pool & Pipeline Log' })).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Last saved')).toBeInTheDocument()
    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByText('Entered')).toBeInTheDocument()

    expect(screen.getByText('Kai Johnson')).toBeInTheDocument()
    expect(screen.getByText(ts('2026-05-18T10:00:00Z'))).toBeInTheDocument()
    expect(screen.getByText(ts('2026-05-19T14:30:00Z'))).toBeInTheDocument()

    expect(screen.getByText(ts('2026-08-01T10:15:00Z'))).toBeInTheDocument()
    expect(screen.getByText(ts('2026-08-01T10:20:00Z'))).toBeInTheDocument()
    expect(screen.getByText(ts(prospect.submittedAt))).toBeInTheDocument()

    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})
