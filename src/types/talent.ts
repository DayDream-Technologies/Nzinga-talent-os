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

export interface UploadedDoc {
  name: string
  data: string
  type: string
  storagePath?: string
}

export type UploadedDocs = Record<string, UploadedDoc | null>

export interface AuditLogEntry {
  user: string
  role: string
  action: string
  stage: TalentStage | string
  ts: string
}

export interface Talent {
  id: string
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
