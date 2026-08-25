import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { TalentMoneyPage } from '@/pages/TalentMoneyPage'
import { TalentMessagesPage } from '@/pages/TalentMessagesPage'
import { INVOICES_SEED, ESCROW_SEED, EXPENSE_LOGS_SEED, DISBURSEMENTS_SEED, SUPPORT_TICKETS_SEED, CALENDAR_EVENTS_SEED } from '@/constants/agency-seed'

const addDisbursement = vi.fn()
const addTicket = vi.fn()

vi.mock('@/hooks/useTalentPortal', () => ({
  useTalentPortal: () => ({
    displayName: 'Maya Rivera',
    prospect: { assignedAgentName: 'Sarah Chen' },
    rosterTalent: { id: 'talent_maya', bookedDates: ['2026-08-12'], available: false, portalAssets: [] },
    invoices: INVOICES_SEED,
    escrow: ESCROW_SEED,
    expenseLogs: EXPENSE_LOGS_SEED,
    disbursements: DISBURSEMENTS_SEED,
    tickets: SUPPORT_TICKETS_SEED,
    calendar: CALENDAR_EVENTS_SEED,
    addDisbursement,
    addTicket,
  }),
}))

describe('talent portal money and messages', () => {
  it('shows earnings, trust balance, and submits a payout request', () => {
    render(
      <MemoryRouter>
        <TalentMoneyPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Financial transparency')).toBeInTheDocument()
    expect(screen.getByText('Earnings per booking')).toBeInTheDocument()
    expect(screen.getByText('Trust account')).toBeInTheDocument()
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
