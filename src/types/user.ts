export type Role =
  | 'scout'
  | 'team1_lead'
  | 'ops_specialist'
  | 'team2_lead'
  | 'director'
  | 'success_manager'

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
