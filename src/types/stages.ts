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

export const STAGE_LABELS: Record<TalentStage, string> = {
  holding_entry: 'Holding Entry',
  scout_complete: 'Scout Complete',
  team1_review: 'Team 1 Review',
  ops_processing: 'Ops Processing',
  team2_audit: 'Team 2 Audit',
  executive_review: 'Executive Review',
  signed_onboarding: 'Signed – Onboarding',
  archived: 'Archived',
  not_viable: 'Not Viable',
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
