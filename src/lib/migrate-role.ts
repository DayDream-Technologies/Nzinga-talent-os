/** Map deprecated system roles onto the four-role open workspace. */
export function migrateRoleSlug(role: string): string {
  if (role === 'ops_specialist' || role === 'team2_lead') return 'account_manager'
  if (role === 'team1_lead') return 'success_manager'
  return role
}

export const ACTIVE_SYSTEM_ROLES = ['scout', 'success_manager', 'account_manager', 'director'] as const

export function isDeprecatedRole(role: string): boolean {
  return role === 'team1_lead' || role === 'ops_specialist' || role === 'team2_lead'
}
