export type Role =
  | 'scout'
  | 'team1_lead'
  | 'ops_specialist'
  | 'team2_lead'
  | 'director'
  | 'success_manager'

export interface User {
  id: string
  name: string
  initials: string
  role: Role
  email: string
  password: string
  title: string
  color: string
}
