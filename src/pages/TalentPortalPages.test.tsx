import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TalentMoneyPage } from '@/pages/TalentMoneyPage'
import { TalentMessagesPage } from '@/pages/TalentMessagesPage'
import { TalentActivityPage } from '@/pages/TalentActivityPage'
import { TalentSettingsPage } from '@/pages/TalentSettingsPage'
import { TalentPortalPrefsProvider } from '@/components/talent-portal/TalentPortalShell'
import type { AgencyProspect, AgencyTalent, CalendarEvent, ClientInvoice, Disbursement, EscrowDeposit, ExpensePayoutLog, SupportTicket } from '@/types/agency'

const addDisbursement = vi.fn()
const addTicket = vi.fn()
const updateTicket = vi.fn()
const updateCalendarEvent = vi.fn()
const updateTalent = vi.fn()
const updateProspect = vi.fn()

const maya = {
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
  udf: { height: `5'9"`, socialHandles: '@mayarivera', usageRights: 'North America, 1 year.' },
} as AgencyTalent

const prospect = {
  id: 'pros_maya',
  accountId: 'NZG-200101',
  name: 'Maya Rivera',
  email: 'maya@example.com',
  workArea: 'Modeling',
  stage: 'contract_completed',
  source: 'Signed client',
  submittedAt: '2025-08-20T10:00:00Z',
  notes: '',
  organization: 'NZG',
  assignedAgentName: 'Sarah Chen',
} as AgencyProspect

const invoices = [
  {
    id: 'inv_shoot',
    clientId: 'c1',
    clientName: 'Northwind',
    talentName: 'Maya Rivera',
    project: 'Commercial Shoot',
    amount: 10000,
    commissionPct: 20,
    status: 'sent',
    issuedAt: '2026-08-14',
    dueAt: '2026-09-13',
    interestApplied: 0,
    taxId: '',
    taxRatePct: 0,
    taxAmount: 0,
    document: null,
  },
  {
    id: 'inv_usage',
    clientId: 'c1',
    clientName: 'Northwind',
    talentName: 'Maya Rivera',
    project: 'Usage Buyout — Social Cutdowns',
    amount: 2800,
    commissionPct: 20,
    status: 'sent',
    issuedAt: '2026-08-12',
    dueAt: '2026-09-11',
    interestApplied: 0,
    taxId: '',
    taxRatePct: 0,
    taxAmount: 0,
    document: null,
  },
] as ClientInvoice[]

const escrow = [
  {
    id: 'esc_1',
    clientName: 'Northwind',
    talentName: 'Maya Rivera',
    project: 'Commercial Shoot',
    amount: 8000,
    receivedAt: '2026-08-14',
    status: 'pending',
    notes: '',
  },
] as EscrowDeposit[]

const expenseLogs = [] as ExpensePayoutLog[]
const disbursements = [] as Disbursement[]

const tickets = [
  {
    id: 'tkt_1',
    subject: 'Confirm availability',
    clientId: 'c1',
    clientName: 'Northwind',
    talentName: 'Maya Rivera',
    status: 'open',
    type: 'availability',
    priority: 'high',
    createdAt: '2026-08-05T08:15:00Z',
    dueDate: '2026-08-08',
    body: 'Need a yes or no.',
    assignee: 'Sarah Chen',
  },
] as SupportTicket[]

const calendar = [
  {
    id: 'cal_2',
    title: 'Shoot day',
    date: '2026-08-12',
    talentName: 'Maya Rivera',
    type: 'booking',
    callTime: '07:00',
    talentCallResponse: 'pending',
  },
] as CalendarEvent[]

vi.mock('@/hooks/useTalentPortal', () => ({
  useTalentPortal: () => ({
    displayName: 'Maya Rivera',
    profile: { email: 'maya@example.com', name: 'Maya Rivera' },
    talent: { name: 'Maya Rivera', account_number: 'NZG-200101', uploaded_docs: {} },
    prospect,
    rosterTalent: maya,
    invoices,
    escrow,
    expenseLogs,
    disbursements,
    tickets,
    calendar,
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
    expect(link).toHaveAttribute('href', expect.stringContaining('mailto:'))
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
