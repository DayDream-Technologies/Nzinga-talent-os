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

/** Stages where a scout may edit the talent packet (SOP: revision or initial build). */
export const SCOUT_EDITABLE_STAGES: TalentStage[] = ['holding_entry', 'scout_complete']

export function isTalentVisibleToRole(
  talent: { stage: TalentStage; scout_id?: string | null },
  role: Role,
  userId?: string,
): boolean {
  if (role === 'director') return true
  const accessible = ROLE_STAGE_ACCESS[role] || []
  if (accessible.includes(talent.stage)) return true
  // SOP Step 6: scouts track their own submissions downstream (read-only)
  if (role === 'scout' && userId && talent.scout_id === userId) return true
  return false
}

export function canScoutEditTalent(stage: TalentStage): boolean {
  return SCOUT_EDITABLE_STAGES.includes(stage)
}

export function isScoutReadOnlyView(
  role: Role,
  stage: TalentStage,
  scoutId: string | null | undefined,
  userId: string,
): boolean {
  return role === 'scout' && scoutId === userId && !canScoutEditTalent(stage)
}
