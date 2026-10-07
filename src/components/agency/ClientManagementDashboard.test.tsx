import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ClientManagementDashboard } from '@/components/agency/ClientManagementDashboard'

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({
    prospects: [
      { id: 'p1', stage: 'holding_entry', lost: false },
      { id: 'p2', stage: 'new_prospect', lost: true },
    ],
    tickets: [{ id: 't1', status: 'open' }, { id: 't2', status: 'closed' }],
    talent: [
      { id: 'a', status: 'current', contractEnd: '2026-12-01' },
      { id: 'b', status: 'past', contractEnd: null },
    ],
    invoices: [{ id: 'i1', status: 'overdue', amount: 100, taxAmount: 8 }],
    escrow: [{ id: 'e1', status: 'cleared' }],
    expenseLogs: [{ id: 'x1', status: 'pending' }],
  }),
}))

vi.mock('@/context/AppDataContext', () => ({
  useAppData: () => ({
    applications: {
      a1: { status: 'in_progress' },
      a2: { status: 'submitted' },
    },
  }),
}))

describe('ClientManagementDashboard', () => {
  it('shows readable counts instead of raw stage keys', () => {
    render(
      <MemoryRouter>
        <ClientManagementDashboard />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Client Management Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('New Prospect')).toBeInTheDocument()
    expect(screen.queryByText(/holding_entry/)).not.toBeInTheDocument()
    expect(screen.getByText('Portal requests')).toBeInTheDocument()
    expect(screen.getByText('Overdue invoices')).toBeInTheDocument()
  })
})
