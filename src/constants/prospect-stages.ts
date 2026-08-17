import type { ProspectStage } from '@/types/agency'

/** 16-column Prospect Tracking Board stages (CRM). */
export const PROSPECT_TRACKING_STAGES: ProspectStage[] = [
  'new_prospect',
  'guest_card',
  'first_contact',
  'second_contact',
  'third_contact',
  'communicating',
  'wait_list',
  'application_sent',
  'application_started',
  'application_completed',
  'screening_completed',
  'application_pending',
  'application_approved',
  'application_denied',
  'contact_published',
  'contract_completed',
]

export const PROSPECT_STAGE_LABELS: Record<ProspectStage, string> = {
  new_prospect: 'New Prospect',
  guest_card: 'Guest Card',
  first_contact: '1st Contact',
  second_contact: '2nd Contact',
  third_contact: '3rd Contact',
  communicating: 'Communicating',
  wait_list: 'Wait List',
  application_sent: 'Application Sent',
  application_started: 'Application Started',
  application_completed: 'Application Completed',
  screening_completed: 'Screening Completed',
  application_pending: 'Application Pending',
  application_approved: 'Application Approved',
  application_denied: 'Application Denied',
  contact_published: 'Contact Published',
  contract_completed: 'Contract Completed',
  // legacy (mapped away on load)
  new: 'New Prospect',
  screening: 'Screening Completed',
  interview: 'Communicating',
  offer: 'Application Pending',
  signed: 'Contract Completed',
  declined: 'Application Denied',
}

const LEGACY_STAGE_MAP: Record<string, ProspectStage> = {
  new: 'new_prospect',
  screening: 'screening_completed',
  interview: 'communicating',
  offer: 'application_pending',
  signed: 'contract_completed',
  declined: 'application_denied',
}

export function normalizeProspectStage(stage: string | null | undefined): ProspectStage {
  if (!stage) return 'new_prospect'
  if ((PROSPECT_TRACKING_STAGES as string[]).includes(stage)) return stage as ProspectStage
  return LEGACY_STAGE_MAP[stage] || 'new_prospect'
}

export function prospectStageLabel(stage: string | null | undefined): string {
  const n = normalizeProspectStage(stage)
  return PROSPECT_STAGE_LABELS[n] || n
}

export function nextProspectStage(stage: ProspectStage): ProspectStage | null {
  const n = normalizeProspectStage(stage)
  const idx = PROSPECT_TRACKING_STAGES.indexOf(n)
  if (idx < 0 || idx >= PROSPECT_TRACKING_STAGES.length - 1) return null
  return PROSPECT_TRACKING_STAGES[idx + 1]
}
