export interface TrainingVideo {
  id: string
  company_code: string
  title: string
  description: string
  video_url: string
  storage_path?: string | null
  target_roles: string[]
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface TrainingVideoInput {
  title: string
  description: string
  video_url: string
  storage_path?: string | null
  target_roles: string[]
}
