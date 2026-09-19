import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { TalentRecord } from '@/components/talent/TalentRecord'
import { TALENTS_SEED, USERS } from '@/constants'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: USERS[0], companyCode: 'NZG' }),
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
    const talent = TALENTS_SEED.find((row) => row.phone) || TALENTS_SEED[0]
    expect(talent.phone).toBeTruthy()

    render(
      <MemoryRouter>
        <TalentRecord
          talent={talent}
          currentUser={USERS[0]}
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

    expect(screen.getByText(talent.phone)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '📞 Call' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '💬 SMS' })).toBeInTheDocument()
  })
})
