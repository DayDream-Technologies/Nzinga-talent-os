import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApprovePayoutModal } from '@/components/agency/FinanceFormModals'
import type { ExpensePayoutLog, Vendor } from '@/types/agency'

const log: ExpensePayoutLog = {
  id: 'exp_maya_1',
  project: '$10,000 Commercial Shoot',
  clientName: 'Nike',
  talentName: 'Maya Rivera',
  gross: 10000,
  agencyCommission: 2000,
  talentShare: 8000,
  status: 'pending',
  loggedAt: '2026-08-14T12:00:00Z',
}

const vendor: Vendor = {
  id: 'ven_maya',
  name: 'Maya Rivera',
  type: 'talent',
  bankLast4: '4821',
  taxFormsReady: true,
  email: 'maya@example.com',
}

describe('ApprovePayoutModal', () => {
  it('shows payout details and requires an approval note', () => {
    const onApprove = vi.fn()
    render(
      <ApprovePayoutModal
        log={log}
        vendor={vendor}
        bankReady
        taxFormsReady
        approverName="Simone Director"
        onClose={vi.fn()}
        onApprove={onApprove}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Approve talent payout' })).toBeInTheDocument()
    expect(screen.getByText('Maya Rivera')).toBeInTheDocument()
    expect(screen.getByText('$10,000 Commercial Shoot')).toBeInTheDocument()
    expect(screen.getByText('Nike')).toBeInTheDocument()
    expect(screen.getByText('$8,000')).toBeInTheDocument()
    expect(screen.getByText('•••• 4821')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Approve payout' }))
    expect(onApprove).not.toHaveBeenCalled()
    expect(screen.getByText(/Add a short note/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Approval notes *'), {
      target: { value: 'Shoot wrapped; release talent share.' },
    })
    fireEvent.change(screen.getByLabelText('Payment method'), { target: { value: 'ACH' } })
    fireEvent.click(screen.getByRole('button', { name: 'Approve payout' }))

    expect(onApprove).toHaveBeenCalledWith({
      notes: 'Shoot wrapped; release talent share.',
      method: 'ACH',
      approvedBy: 'Simone Director',
    })
  })
})
