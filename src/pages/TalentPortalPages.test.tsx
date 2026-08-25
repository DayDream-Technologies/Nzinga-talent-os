import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TalentMoneyPage } from '@/pages/TalentMoneyPage'
import { TalentMessagesPage } from '@/pages/TalentMessagesPage'
import { TalentActivityPage } from '@/pages/TalentActivityPage'
import { TalentSettingsPage } from '@/pages/TalentSettingsPage'
import { TalentPortalPrefsProvider } from '@/components/talent-portal/TalentPortalShell'
import { AGENCY_TALENT_SEED, INVOICES_SEED, ESCROW_SEED, EXPENSE_LOGS_SEED, DISBURSEMENTS_SEED, SUPPORT_TICKETS_SEED, CALENDAR_EVENTS_SEED, AGENCY_PROSPECTS_SEED } from '@/constants/agency-seed'

const addDisbursement = vi.fn()
const addTicket = vi.fn()
const updateTicket = vi.fn()
const updateCalendarEvent = vi.fn()
const updateTalent = vi.fn()
const updateProspect = vi.fn()

const maya = AGENCY_TALENT_SEED.find((row) => row.id === 'talent_maya')!
const prospect = AGENCY_PROSPECTS_SEED.find((row) => row.id === 'pros_maya')!

vi.mock('@/hooks/useTalentPortal', () => ({
  useTalentPortal: () => ({
    displayName: 'Maya Rivera',
    profile: { email: 'maya@example.com', name: 'Maya Rivera' },
    talent: { name: 'Maya Rivera', account_number: 'NZG-200101', uploaded_docs: {} },
    prospect,
    rosterTalent: maya,
    invoices: INVOICES_SEED,
    escrow: ESCROW_SEED,
    expenseLogs: EXPENSE_LOGS_SEED,
    disbursements: DISBURSEMENTS_SEED,
    tickets: SUPPORT_TICKETS_SEED,
    calendar: CALENDAR_EVENTS_SEED,
    appointments: [],
    addDisbursement,
    addTicket,
    addCalendarEvent: vi.fn(),
    updateTicket,
    updateCalendarEvent,
    updateTalent,
    updateProspect,
  }),
}))

beforeEach(() => {
  addDisbursement.mockClear()
  addTicket.mockClear()
  updateTicket.mockClear()
  updateCalendarEvent.mockClear()
  updateTalent.mockClear()
  updateProspect.mockClear()
  localStorage.clear()
})

describe('talent portal money and messages', () => {
  it('shows earnings, tax/banking readiness, and submits a payout request', () => {
    render(
      <MemoryRouter>
        <TalentMoneyPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Financial transparency')).toBeInTheDocument()
    expect(screen.getByText('Earnings per booking')).toBeInTheDocument()
    expect(screen.getByText('Trust account')).toBeInTheDocument()
    expect(screen.getByText('W-9 / tax forms')).toBeInTheDocument()
    expect(screen.getByText('Banking')).toBeInTheDocument()
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0)
    expect(screen.getByText('Usage-rights timeline')).toBeInTheDocument()
    expect(screen.getAllByText('Usage Buyout — Social Cutdowns').length).toBeGreaterThan(0)
    expect(screen.getByText('Year-end 1099 / earnings export')).toBeInTheDocument()
    expect(screen.getAllByText('$8,000').length).toBeGreaterThan(0)
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Request payout' }))
    expect(addDisbursement).toHaveBeenCalledWith(
      expect.objectContaining({ payee: 'Maya Rivera', amount: 500, status: 'pending' }),
    )
  })

  it('offers a prefilled email to the assigned agent', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<TalentMessagesPage />} />
        </Routes>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'Email Sarah Chen' })
    expect(link).toHaveAttribute('href', expect.stringContaining('mailto:sarah.chen@nzinga.co'))
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Need a call sheet' } })
    fireEvent.change(screen.getByLabelText('Details'), { target: { value: 'Please send tomorrow.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    expect(addTicket).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Need a call sheet', talentName: 'Maya Rivera' }))
  })
})

describe('talent portal activity and settings', () => {
  it('lets talent confirm an opportunity and a call time', () => {
    render(
      <MemoryRouter>
        <TalentActivityPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Confirm' })[0])
    expect(updateTicket).toHaveBeenCalledWith(
      'tkt_1',
      expect.objectContaining({ status: 'resolved', talentDecision: 'confirmed' }),
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Confirm call time' })[0])
    expect(updateCalendarEvent).toHaveBeenCalledWith('cal_2', { talentCallResponse: 'confirmed' })
  })

  it('saves appearance, measurements, and socials', () => {
    render(
      <MemoryRouter>
        <TalentPortalPrefsProvider email="maya@example.com">
          <TalentSettingsPage />
        </TalentPortalPrefsProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByLabelText('Light mode'))
    expect(screen.getByLabelText('Height')).toHaveValue(`5'9"`)
    fireEvent.change(screen.getByLabelText('Height'), { target: { value: `5'10"` } })
    fireEvent.change(screen.getByLabelText('Handles'), { target: { value: '@maya' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save profile details' }))
    expect(updateTalent).toHaveBeenCalledWith(
      'talent_maya',
      expect.objectContaining({
        udf: expect.objectContaining({ height: `5'10"`, socialHandles: '@maya' }),
      }),
    )
  })
})
