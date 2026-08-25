export type SystemRole =
  | 'scout'
  | 'team1_lead'
  | 'ops_specialist'
  | 'team2_lead'
  | 'director'
  | 'success_manager'

/** Staff role slug. System roles keep stable slugs; admins may create additional slugs. */
export type Role = string

export const ROLE_PERMISSIONS = [
  'submit_client_packet',
  'send_application',
  'track_own_submissions',
  'approve_client_packet',
  'return_packet',
  'publish_contract',
  'admin_access',
] as const

export type RolePermission = (typeof ROLE_PERMISSIONS)[number]

export const ROLE_PERMISSION_LABELS: Record<RolePermission, string> = {
  submit_client_packet: 'Submit Client Packet to Success Manager',
  send_application: 'Send application links',
  track_own_submissions: 'Track own submissions downstream (read-only)',
  approve_client_packet: 'Approve Client Packet (SOP → Approved - Future)',
  return_packet: 'Return packet for more information',
  publish_contract: 'Publish contract to client portal',
  admin_access: 'Admin (users, roles, settings) — system only',
}

export interface RoleDefinition {
  slug: string
  name: string
  description: string
  is_system: boolean
  stage_access: import('./stages').TalentStage[]
  module_paths: string[]
  permissions: RolePermission[]
  action_stage: import('./stages').TalentStage
}

export type ThemePreference = 'light' | 'dark'

export interface UserUiSettings {
  theme: ThemePreference
  sidebar_visible: boolean
}

export interface User {
  id: string
  name: string
  initials: string
  role: Role
  email: string
  password: string
  title: string
  color: string
  auth_uid?: string | null
  company_code?: string
  active?: boolean
  settings?: UserUiSettings | null
}

export interface ProspectProfile {
  id: string
  auth_uid: string
  email: string
  name: string
  application_id: string | null
  created_at: string
  last_login_at?: string | null
}
