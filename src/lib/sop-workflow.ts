import type { AgencyProspect, AgencyTalent, ClientLifecycleStatus, ProspectContract } from '@/types/agency'
import { SOP_STATUS } from '@/constants/sop-status'

export function markContractPendingSignature(
  contract: Omit<ProspectContract, 'id' | 'uploadedAt'> & { id?: string; uploadedAt?: string },
): ProspectContract {
  const now = new Date().toISOString()
  return {
    ...contract,
    id: contract.id || `ctr_${Date.now()}`,
    uploadedAt: contract.uploadedAt || now,
    status: 'pending_signature',
  }
}

export function signPendingContract(
  contracts: ProspectContract[],
  contractId: string,
  signedName: string,
  signedAt = new Date().toISOString(),
): ProspectContract[] {
  return contracts.map((c) => {
    if (c.id !== contractId) {
      return c.status === 'current' ? { ...c, status: 'past' as const } : c
    }
    return {
      ...c,
      status: 'current' as const,
      signedAt,
      signedName,
    }
  })
}

export function namesFromProspect(prospect: Pick<AgencyProspect, 'name' | 'firstName' | 'lastName'>): {
  firstName: string
  lastName: string
} {
  const first = prospect.firstName?.trim()
  const last = prospect.lastName?.trim()
  if (first || last) return { firstName: first || '', lastName: last || '' }
  const parts = (prospect.name || '').trim().split(/\s+/)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }
}

export function clientFromSignedProspect(
  prospect: AgencyProspect,
  opts: { contractStart?: string | null; contractEnd?: string | null; id?: string } = {},
): Omit<AgencyTalent, 'id'> & { id?: string } {
  const { firstName, lastName } = namesFromProspect(prospect)
  const current = prospect.contracts.find((c) => c.status === 'current')
  return {
    id: opts.id,
    accountId: prospect.accountId,
    name: prospect.name,
    firstName,
    lastName,
    email: prospect.email,
    phone: prospect.phone,
    role: 'Signed Talent',
    status: 'current' as ClientLifecycleStatus,
    workArea: prospect.workArea,
    division: prospect.workArea,
    niches: [],
    property: prospect.property,
    bankReady: false,
    taxFormsReady: false,
    available: true,
    bookedDates: [],
    contractStart: opts.contractStart ?? current?.startDate ?? prospect.contractStart ?? null,
    contractEnd: opts.contractEnd ?? current?.endDate ?? prospect.contractEnd ?? null,
    linkedProspectId: prospect.id,
    profilePhoto: prospect.profilePhoto,
    udf: prospect.udf,
  }
}

export const CONTRACT_PUBLISHED_EMAIL = {
  subject: 'A contract has been added to your client portal',
  textBody:
    'A contract has been added to your client portal. Please log in to review and sign.',
  htmlBody:
    '<p>A contract has been added to your client portal. Please log in to review and sign.</p>',
} as const

export function isPendingSignatureContract(c: ProspectContract): boolean {
  return c.status === 'pending_signature'
}

export { SOP_STATUS }
