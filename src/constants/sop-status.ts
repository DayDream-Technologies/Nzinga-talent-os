/** SOP sub-statuses on pipeline talent (`applicant_stage_status`) and CRM prospects. */
export const SOP_STATUS = {
  underVetting: 'Application Submitted / Under Vetting',
  inManagerReview: 'In Manager Review',
  approvedFuture: 'Approved - Future',
  contractPending: 'Contract Published / Pending Signature',
  active: 'Active',
} as const

export type SopStatus = (typeof SOP_STATUS)[keyof typeof SOP_STATUS]

export const SOP_STATUS_ORDER: readonly string[] = [
  'New / Lead',
  'Under Review',
  'Qualification in Progress',
  SOP_STATUS.underVetting,
  'Qualified',
  'Client Packet Pending',
  SOP_STATUS.inManagerReview,
  SOP_STATUS.approvedFuture,
  SOP_STATUS.contractPending,
  SOP_STATUS.active,
  'Withdrawn',
]

export function sopStatusRank(status: string | null | undefined): number {
  if (!status) return -1
  const idx = SOP_STATUS_ORDER.indexOf(status)
  return idx
}

/** Do not regress a later SOP status when an earlier application event re-syncs. */
export function shouldAdvanceSopStatus(
  current: string | null | undefined,
  next: string,
): boolean {
  const cur = sopStatusRank(current)
  const nxt = sopStatusRank(next)
  if (nxt < 0) return true
  if (cur < 0) return true
  return nxt >= cur
}
