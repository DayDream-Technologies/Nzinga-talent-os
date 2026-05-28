import type { Role, TalentStage } from '@/types'

export const COMPANY_CODES: Record<string, boolean> = { NZG: true, NZINGA: true, TCG: true }

export const ROLE_LABELS: Record<Role, string> = {
  scout: 'Scout',
  team1_lead: 'Team 1 Lead',
  ops_specialist: 'Ops Specialist',
  team2_lead: 'Team 2 Lead',
  director: 'Director',
  success_manager: 'Success Manager',
}

export const ROLE_STAGE_ACCESS: Record<Role, TalentStage[]> = {
  scout: ['holding_entry', 'scout_complete', 'not_viable'],
  team1_lead: ['scout_complete', 'team1_review'],
  ops_specialist: ['team1_review', 'ops_processing'],
  team2_lead: ['ops_processing', 'team2_audit'],
  director: [
    'holding_entry',
    'scout_complete',
    'team1_review',
    'ops_processing',
    'team2_audit',
    'executive_review',
    'signed_onboarding',
    'archived',
    'not_viable',
  ],
  success_manager: ['executive_review', 'signed_onboarding'],
}

export const ROLE_ACTION_STAGE: Record<Role, TalentStage> = {
  scout: 'holding_entry',
  team1_lead: 'team1_review',
  ops_specialist: 'ops_processing',
  team2_lead: 'team2_audit',
  director: 'executive_review',
  success_manager: 'signed_onboarding',
}
