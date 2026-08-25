import { describe, expect, it } from 'vitest'
import { SOP_STATUS, shouldAdvanceSopStatus } from '@/constants/sop-status'
import {
  clientFromSignedProspect,
  markContractPendingSignature,
  signPendingContract,
} from '@/lib/sop-workflow'
import type { AgencyProspect } from '@/types/agency'

const prospect: AgencyProspect = {
  id: 'pros_1',
  accountId: 'NZG-100001',
  name: 'Ada Okonkwo',
  firstName: 'Ada',
  lastName: 'Okonkwo',
  email: 'ada@example.com',
  phone: '555-0100',
  workArea: 'Modeling',
  stage: 'application_approved',
  source: 'Portal',
  submittedAt: '2026-08-01T00:00:00.000Z',
  notes: '',
  organization: 'NZG',
  contracts: [],
  messageEmails: ['ada@example.com'],
  sopSubStatus: SOP_STATUS.approvedFuture,
}

describe('SOP status and contract workflow', () => {
  it('does not regress Approved-Future back to under vetting', () => {
    expect(shouldAdvanceSopStatus(SOP_STATUS.approvedFuture, SOP_STATUS.underVetting)).toBe(false)
    expect(shouldAdvanceSopStatus(SOP_STATUS.underVetting, SOP_STATUS.inManagerReview)).toBe(true)
  })

  it('marks a published contract pending signature then signs it into current', () => {
    const pending = markContractPendingSignature({
      title: 'Rep agreement',
      status: 'pending_signature',
      startDate: '2026-08-25',
      document: { name: 'a.pdf', data: 'data:application/pdf;base64,x', type: 'application/pdf' },
    })
    expect(pending.status).toBe('pending_signature')
    const signed = signPendingContract([pending], pending.id, 'Ada Okonkwo')
    expect(signed[0].status).toBe('current')
    expect(signed[0].signedName).toBe('Ada Okonkwo')
    expect(signed[0].signedAt).toBeTruthy()
  })

  it('builds an Active client from a signed prospect without sending to ops', () => {
    const signedProspect = {
      ...prospect,
      stage: 'contract_completed' as const,
      contracts: [
        {
          id: 'ctr_1',
          title: 'Rep',
          status: 'current' as const,
          startDate: '2026-08-25',
          uploadedAt: '2026-08-25T00:00:00.000Z',
          document: { name: 'a.pdf', data: 'x', type: 'application/pdf' },
        },
      ],
    }
    const client = clientFromSignedProspect(signedProspect)
    expect(client.status).toBe('current')
    expect(client.linkedProspectId).toBe('pros_1')
    expect(client.accountId).toBe('NZG-100001')
    expect(client.email).toBe('ada@example.com')
  })
})
