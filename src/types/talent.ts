import type { TalentStage } from './stages'

export interface Compliance {
  legal_name?: boolean
  gov_id?: boolean
  dob?: boolean
  address?: boolean
  email_phone?: boolean
  tax_doc?: boolean
  banking?: boolean
  social_ownership?: boolean
}

export type DocRecordStatus = 'received' | 'verified' | 'expired' | 'rejected'

export interface UploadedDoc {
  name: string
  data: string
  type: string
  storagePath?: string
  /** Document classification (gov_id, headshot, etc.) */
  doc_type?: string
  uploaded_at?: string
  uploaded_by?: string
  status?: DocRecordStatus
  expiration_date?: string | null
  internal_notes?: string
}

export type UploadedDocs = Record<string, UploadedDoc | null>

export interface AuditLogEntry {
  user: string
  role: string
  action: string
  stage: TalentStage | string
  ts: string
}

export interface ApplicantProfile {
  first_name?: string
  last_name?: string
  stage_name?: string
  secondary_phone?: string
  preferred_contact?: string
  gov_id_number?: string
  dob?: string
  ssn_tax_id?: string
  roster_division?: string
  secondary_specialization?: string
  earliest_availability?: string
  min_day_rate?: string
  contract_duration_pref?: string
  legal_minor_status?: string
  animal_skill_onset?: string
  travel_logistics?: string
  applicant_stage_status?: string
  discovery_source?: string
  application_submitted_at?: string
  next_callback_date?: string
  prior_annual_revenue?: string
  current_agency?: string
  union_affiliation?: string
  parent_guardian_required?: string
  onboarding_fee_status?: string
  reference_check_status?: string
  height?: string
  bust?: string
  waist?: string
  hips?: string
  shoe_size?: string
  eye_color?: string
  scout_notes?: string
  /** Social / web links */
  link_instagram?: string
  link_tiktok?: string
  link_youtube?: string
  link_website?: string
  link_portfolio?: string
  link_other?: string
}

export interface Talent extends ApplicantProfile {
  id: string
  /** Unique sequential account ID, e.g. NZG-100001. */
  account_number: string
  name: string
  stage: TalentStage
  niches: string[]
  scout_id: string | null
  created_by?: string | null
  created_at: string
  phone?: string
  email?: string
  social_handle: string
  follower_count: string
  er_pct: string
  platform: string
  location: string
  pillar_scores: number[]
  pillar_rationales: string[]
  jordan_score: number
  revenue_path: string
  scout_summary: string
  team1_notes: string
  team1_decision: string | null
  compliance: Compliance
  rep_type: string
  commission: string
  term_length: string
  team2_notes: string
  team2_decision: string | null
  director_decision: string | null
  portal_setup: boolean
  technical_routing: boolean
  warm_handoff: string
  warm_handoff_confirmed: boolean
  revenue_ytd: string
  revenue_projected: string
  last_contacted: string
  application_id: string | null
  application_status: string | null
  uploaded_docs: UploadedDocs
  audit_log: AuditLogEntry[]
}
