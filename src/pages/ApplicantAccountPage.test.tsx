import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicantAccountPage } from '@/pages/ApplicantAccountPage'
import type { Application } from '@/types/application'

const { archiveApplications, restoreApplications, authState } = vi.hoisted(() => ({
  archiveApplications: vi.fn().mockResolvedValue(undefined),
  restoreApplications: vi.fn().mockResolvedValue(undefined),
  authState: { role: 'scout' as string },
}))

const sampleApp: Application = {
  id: 'app_sofia',
  talent_id: 't10',
  access_code: 'SOFI2026',
  company_code: 'NZG',
  talent_name: 'Sofia Ramirez',
  talent_email: 'sofia.ramirez@example.com',
  status: 'submitted',
  created_at: '2026-07-20T11:05:00Z',
  data: {
    legal_first: 'Sofia',
    legal_last: 'Ramirez',
    preferred_name: 'Sofia Ramirez',
    city: 'Chicago',
    state: 'IL',
    representation_interests: 'Modeling,Influencing / Content Creation',
    about_yourself: 'Chicago-based fashion creator.',
  },
}

vi.mock('@/context/AppDataContext', () => ({
  useAppData: () => ({
    applications: { app_sofia: sampleApp },
    talents: [],
    history: [],
    setHistory: vi.fn(),
    importAppToPipeline: vi.fn(),
    handleSendApp: vi.fn(),
    archiveApplications,
    restoreApplications,
  }),
}))

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({
    prospects: [],
    talent: [],
    clients: [{ id: 'client_nike', name: 'Nike' }],
    invoices: [],
    tickets: [],
    createInvoice: vi.fn(),
    addRetainer: vi.fn(),
    addTicket: vi.fn(),
    createProspect: vi.fn(),
    updateProspect: vi.fn(),
    updateTalent: vi.fn(),
    updateTicket: vi.fn(),
  }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Jordan Hayes', role: authState.role }, companyCode: 'NZG' }),
}))

describe('ApplicantAccountPage', () => {
  beforeEach(() => {
    authState.role = 'scout'
    sampleApp.status = 'submitted'
    archiveApplications.mockClear()
  })

  it('renders visible application sections for the applicant', () => {
    render(
      <MemoryRouter initialEntries={['/applications/app_sofia']}>
        <Routes>
          <Route path="/applications/:appId" element={<ApplicantAccountPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Sofia Ramirez' })).toBeInTheDocument()
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByText('Representation Interest')).toBeInTheDocument()
    expect(screen.getByText('Sofia')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archive application' })).not.toBeInTheDocument()
  })

  it('lets an admin archive from the applicant account', () => {
    authState.role = 'director'
    render(
      <MemoryRouter initialEntries={['/applications/app_sofia']}>
        <Routes>
          <Route path="/applications/:appId" element={<ApplicantAccountPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Archive application' }))
    fireEvent.click(screen.getByRole('button', { name: /^Archive$/ }))
    expect(archiveApplications).toHaveBeenCalledWith(['app_sofia'])
  })
})
