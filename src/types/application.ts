export type ApplicationStatus = 'sent' | 'in_progress' | 'submitted'

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

export interface AppField {
  id: string
  label: string
  type: AppFieldType
  required?: boolean
  options?: string[]
  note?: string
}

export interface AppSection {
  id: string
  label: string
  icon: string
  fields: AppField[]
}

export type ApplicationData = Record<string, string | boolean | undefined>

export interface Application {
  id: string
  talent_id: string | null
  access_code: string
  talent_name: string
  talent_email: string
  status: ApplicationStatus
  created_at: string
  last_saved?: string
  completed_sections?: string[]
  data: ApplicationData
}

export type ApplicationsMap = Record<string, Application>
