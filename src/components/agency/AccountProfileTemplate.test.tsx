import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProfileTemplate } from '@/components/agency/AccountProfileTemplate'
import { emptyUdf } from '@/lib/talent-udf'
import { seedProfilePhoto } from '@/lib/profile-photo'
import type { Application } from '@/types/application'

const { updateProspect, updatePipelineTalent, updateRosterTalent, authState } = vi.hoisted(() => ({
  updateProspect: vi.fn(),
  updatePipelineTalent: vi.fn(),
  updateRosterTalent: vi.fn(),
  authState: { role: 'scout' as string },
}))

const sampleApp: Application = {
  id: 'app_kai',
  talent_id: 't4',
  access_code: 'KAI2026',
  company_code: 'NZG',
  talent_name: 'Kai Johnson',
  talent_email: 'kai@example.com',
  status: 'submitted',
  created_at: '2026-05-18T10:00:00Z',
  completed_sections: ['personal', 'interests'],
  data: {
    legal_first: 'Kai',
    legal_last: 'Johnson',
    preferred_name: 'Kai Johnson',
    representation_interests: 'Modeling',
    city: 'Chicago',
    state: 'IL',
    doc_model_headshot: 'data:image/jpeg;base64,aaa',
    doc_model_headshot_name: 'kai-headshot.jpg',
    doc_model_headshot_type: 'image/jpeg',
  },
}

vi.mock('@/context/AppDataContext', () => ({
  useAppData: () => ({
    history: [],
    setHistory: vi.fn(),
    importAppToPipeline: vi.fn(),
    handleSendApp: vi.fn(),
    updateTalent: updatePipelineTalent,
  }),
}))

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({
    clients: [{ id: 'client_nike', name: 'Nike' }],
    invoices: [],
    tickets: [],
    createInvoice: vi.fn(),
    addRetainer: vi.fn(),
    addTicket: vi.fn(),
    createProspect: vi.fn(),
    updateProspect,
    updateTalent: updateRosterTalent,
    updateTicket: vi.fn(),
  }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Jordan Hayes', role: authState.role },
    companyCode: 'NZG',
  }),
}))

describe('AccountProfileTemplate', () => {
  beforeEach(() => {
    authState.role = 'scout'
    updateProspect.mockReset()
    updatePipelineTalent.mockReset()
    updateRosterTalent.mockReset()
  })
  it('renders shared chrome and opens Add Charge', () => {
    render(
      <MemoryRouter>
        <AccountProfileTemplate
          kind="applicant"
          displayName="Kai Johnson"
          statusLabel="Complete"
          statusColor="#16a34a"
          accountId="NZG-200001"
          email="kai@example.com"
          application={sampleApp}
          backTo={{ label: 'Back to Applications', to: '/applications' }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Kai Johnson' })).toBeInTheDocument()
    expect(screen.getByText('PAYOUT DUE')).toBeInTheDocument()
    expect(screen.getByText('Add Charge')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import to pipeline' })).toBeDisabled()
    fireEvent.click(screen.getByText('Add Charge'))
    const dialog = screen.getByRole('dialog', { name: 'New invoice' })
    expect(dialog).toBeInTheDocument()
    expect(dialog.parentElement).toBe(document.body)
  })

  it('shows Application answers and gates Model UDF fields', () => {
    render(
      <MemoryRouter>
        <AccountProfileTemplate
          kind="applicant"
          displayName="Kai Johnson"
          statusLabel="Complete"
          statusColor="#16a34a"
          application={sampleApp}
          prospect={{
            id: 'pros_1',
            accountId: 'NZG-200001',
            name: 'Kai Johnson',
            email: 'kai@example.com',
            workArea: 'Modeling',
            stage: 'application_completed',
            source: 'Portal application',
            submittedAt: '2026-08-01T10:00:00Z',
            notes: '',
            organization: 'NZG',
            messageEmails: ['kai@example.com'],
            contracts: [],
            udf: { ...emptyUdf(), talentTypes: [] },
          }}
          backTo={{ label: 'Back to Applications', to: '/applications' }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByText('kai-headshot.jpg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'UDF' }))
    expect(screen.getByText(/Working roster sheet/i)).toBeInTheDocument()
    expect(screen.getByText('Height')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save UDF' }))
    expect(updateProspect).toHaveBeenCalledWith(
      'pros_1',
      expect.objectContaining({ udf: expect.objectContaining({ talentTypes: ['Modeling'] }) }),
    )
    fireEvent.click(screen.getByLabelText('Modeling'))
    expect(screen.queryByText('Height')).not.toBeInTheDocument()
  })

  it('renders a profile photo from the pipeline record', () => {
    render(
      <MemoryRouter>
        <AccountProfileTemplate
          kind="client"
          displayName="Maya Rivera"
          statusLabel="Active Client"
          statusColor="#16a34a"
          accountId="NZG-200101"
          pipelineTalent={{
            id: 't_maya',
            name: 'Maya Rivera',
            uploaded_docs: { profile_photo: seedProfilePhoto('Maya Rivera', 'MR') },
          } as never}
          backTo={{ label: 'Back to Clients', to: '/clients' }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'View profile photo of Maya Rivera' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Change photo' })).not.toBeInTheDocument()
  })

  it('lets a director change the profile photo', () => {
    authState.role = 'director'
    render(
      <MemoryRouter>
        <AccountProfileTemplate
          kind="client"
          displayName="Maya Rivera"
          statusLabel="Active Client"
          statusColor="#16a34a"
          accountId="NZG-200101"
          rosterTalent={{
            id: 'talent_maya',
            accountId: 'NZG-200101',
            name: 'Maya Rivera',
            email: 'maya@example.com',
            role: 'Signed Model',
            status: 'current',
            workArea: 'Modeling',
            niches: ['Commercial'],
            bankReady: true,
            taxFormsReady: true,
            available: true,
            bookedDates: [],
          }}
          backTo={{ label: 'Back to Clients', to: '/clients' }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Change photo' })).toBeInTheDocument()
    expect(document.querySelector('input[type="file"][accept="image/*"]')).toBeTruthy()
  })
})
