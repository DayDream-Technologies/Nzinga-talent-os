import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { TalentRecord } from '@/components/talent/TalentRecord'
import type { Talent, User } from '@/types'

const currentUser: User = {
  id: 'staff_1',
  name: 'Alex Director',
  initials: 'AD',
  role: 'director',
  email: 'alex@example.com',
  password: '',
  title: 'Director',
  color: '#111827',
}

const talent = {
  id: 't1',
  account_number: 'NZG-100001',
  name: 'Alex Rivera',
  phone: '555-0100',
  email: 'alex.rivera@example.com',
  stage: 'holding_entry',
  niches: [],
  scout_id: null,
  created_at: '2026-01-01T00:00:00Z',
  social_handle: '',
  follower_count: '',
  er_pct: '',
  platform: '',
  location: 'Atlanta, GA',
  pillar_scores: [0, 0, 0, 0, 0],
  pillar_rationales: ['', '', '', '', ''],
  jordan_score: 0,
  revenue_path: '',
  scout_summary: '',
  team1_notes: '',
  team1_decision: null,
  compliance: {},
  rep_type: '',
  commission: '',
  term_length: '',
  team2_notes: '',
  team2_decision: null,
  director_decision: null,
  portal_setup: false,
  technical_routing: false,
  warm_handoff: '',
  warm_handoff_confirmed: false,
  revenue_ytd: '0',
  revenue_projected: '0',
  last_contacted: '2026-01-01',
  application_id: null,
  application_status: null,
  uploaded_docs: {},
  audit_log: [],
} as Talent

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: currentUser, companyCode: 'NZG' }),
}))

vi.mock('@/hooks/useStaffDirectory', () => ({
  useStaffDirectory: () => [currentUser],
}))

vi.mock('@/context/AppDataContext', () => ({
  useAppData: () => ({ talents: [], applications: {}, history: [], setHistory: vi.fn() }),
}))

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({
    upsertProspectSop: vi.fn(),
    addProspectContract: vi.fn(),
    prospects: [],
    talent: [],
  }),
}))

vi.mock('@/components/ui/ImageCropper', () => ({
  useImageCropper: () => ({ cropImage: vi.fn(), cropper: null }),
}))

vi.mock('@/lib/phone', () => ({
  getTwilioStatus: async () => ({ connected: false }),
  makeCall: async () => ({ ok: false, error: 'Voice calls are coming soon.' }),
  sendSms: async () => ({ ok: false, error: 'Text messaging is coming soon.' }),
}))

describe('TalentRecord', () => {
  it('renders call/SMS actions when the talent has a phone', async () => {
    render(
      <MemoryRouter>
        <TalentRecord
          talent={talent}
          currentUser={currentUser}
          allHistory={[]}
          setHistory={vi.fn()}
          allTasks={[]}
          setTasks={vi.fn()}
          onClose={vi.fn()}
          onUpdate={vi.fn()}
          onSendApp={vi.fn()}
          applications={{}}
          refreshAll={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText(talent.phone || '')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '📞 Call' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '💬 SMS' })).toBeInTheDocument()
  })
})
