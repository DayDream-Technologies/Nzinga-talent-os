import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AgencyModule } from '@/components/agency/AgencyModules'
import type { ExpensePayoutLog } from '@/types/agency'

const { auth, issuePayout, pendingLog } = vi.hoisted(() => ({
  auth: { role: 'director' as string, name: 'Simone Director' },
  issuePayout: vi.fn(),
  pendingLog: {
    id: 'exp_maya_1',
    project: '$10,000 Commercial Shoot',
    clientName: 'Nike',
    talentName: 'Maya Rivera',
    gross: 10000,
    agencyCommission: 2000,
    talentShare: 8000,
    status: 'pending',
    loggedAt: '2026-08-14T12:00:00Z',
  } satisfies ExpensePayoutLog,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: auth.name, role: auth.role } }),
}))

vi.mock('@/context/AppDataContext', () => ({
  useAppData: () => ({ applications: {}, talents: [] }),
}))

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({
    expenseLogs: [pendingLog],
    vendors: [
      {
        id: 'ven_maya',
        name: 'Maya Rivera',
        type: 'talent',
        bankLast4: '4821',
        taxFormsReady: true,
        email: 'maya@example.com',
      },
    ],
    talent: [
      {
        id: 'tal_maya',
        accountId: 'NZG-100001',
        name: 'Maya Rivera',
        bankReady: true,
        taxFormsReady: true,
      },
    ],
    prospects: [],
    issuePayout,
  }),
}))

describe('ReportPendingPayouts', () => {
  it('lets an admin open the approve modal and confirm the payout', () => {
    auth.role = 'director'
    render(
      <MemoryRouter>
        <AgencyModule moduleId="report-pending-payouts" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Pending Talent Payouts (AP Aging)' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(screen.getByRole('dialog', { name: 'Approve talent payout' })).toBeInTheDocument()
    expect(screen.getByText('Nike')).toBeInTheDocument()
    expect(screen.getAllByText('$8,000').length).toBeGreaterThan(0)

    fireEvent.change(screen.getByLabelText('Approval notes *'), {
      target: { value: 'Approved for Friday payday.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Approve payout' }))
    expect(issuePayout).toHaveBeenCalledWith('exp_maya_1', {
      notes: 'Approved for Friday payday.',
      method: 'Direct deposit',
      approvedBy: 'Simone Director',
    })
  })

  it('hides approve for roles that cannot issue payouts', () => {
    auth.role = 'scout'
    issuePayout.mockClear()
    render(
      <MemoryRouter>
        <AgencyModule moduleId="report-pending-payouts" />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })
})
