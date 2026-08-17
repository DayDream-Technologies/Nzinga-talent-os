export type TalentStage =
  | 'holding_entry'
  | 'scout_complete'
  | 'team1_review'
  | 'ops_processing'
  | 'team2_audit'
  | 'executive_review'
  | 'signed_onboarding'
  | 'archived'
  | 'not_viable'

export const STAGES: TalentStage[] = [
  'holding_entry',
  'scout_complete',
  'team1_review',
  'ops_processing',
  'team2_audit',
  'executive_review',
  'signed_onboarding',
  'archived',
  'not_viable',
]

/** Product / SOP labels mapped onto existing stage keys (Build Requirements + SOP). */
export const STAGE_LABELS: Record<TalentStage, string> = {
  holding_entry: 'New / Lead',
  scout_complete: 'More Information Required',
  team1_review: 'Client Packet Review',
  ops_processing: 'Success Manager Validation',
  team2_audit: 'Contract Pending',
  executive_review: 'Director Review',
  signed_onboarding: 'Active Client',
  archived: 'Archived',
  not_viable: 'Declined',
}

export const STAGE_COLORS: Record<TalentStage, string> = {
  holding_entry: '#7c3aed',
  scout_complete: '#a855f7',
  team1_review: '#d97706',
  ops_processing: '#2563eb',
  team2_audit: '#0891b2',
  executive_review: '#059669',
  signed_onboarding: '#16a34a',
  archived: '#6b7280',
  not_viable: '#dc2626',
}

export const PILLAR_NAMES = [
  'Market Viability',
  'Audience Engagement',
  'Brand Safety',
  'Content Consistency',
  'Monetization Potential',
] as const
