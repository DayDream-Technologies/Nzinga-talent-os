export type ApplicationStatus = 'sent' | 'in_progress' | 'submitted' | 'pending_guardian'

export type GuardianStatus = 'not_required' | 'pending' | 'completed'

export type AppFieldType =
  | 'text'
  | 'tel'
  | 'email'
  | 'date'
  | 'url'
  | 'textarea'
  | 'select'
  | 'multicheck'
  | 'checkbox'
  | 'file_upload'

export type AppFieldCondition =
  | { field: string; condition: 'minor' }
  | { field: string; equals: string }
  | { field: string; includes: string }

export interface AppField {
  id: string
  label: string
  type: AppFieldType
  required?: boolean
  requiredIf?: AppFieldCondition
  showIf?: AppFieldCondition
  options?: string[]
  note?: string
  /** Minimum character count when the field has a value (and always when required). */
  minLength?: number
  /** Maximum character count. */
  maxLength?: number
}

export interface AppSection {
  id: string
  label: string
  icon: string
  fields: AppField[]
  /** Hide entire section unless condition matches (e.g. representation interest). */
  showIf?: AppFieldCondition
  /**
   * At least one field id from each group must be non-empty.
   * Example: [['link_instagram', 'link_other']]
   */
  requireAnyOf?: string[][]
}

export type ApplicationData = Record<string, string | boolean | undefined>

export interface Application {
  id: string
  talent_id: string | null
  access_code: string
  /** Tenant company code this application belongs to (e.g. NZG). */
  company_code: string
  talent_name: string
  talent_email: string
  status: ApplicationStatus
  created_at: string
  last_saved?: string
  completed_sections?: string[]
  submitted_at?: string
  /** Guardian verification for minors. */
  guardian_status?: GuardianStatus
  guardian_email?: string | null
  data: ApplicationData
}

export type ApplicationsMap = Record<string, Application>
