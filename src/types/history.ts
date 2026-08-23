export type HistoryType = 'note' | 'call' | 'email' | 'sms' | 'task' | 'document' | 'system'

export interface HistoryEntry {
  id: string
  /** Pipeline talents.id. Null for CRM notes on prospects/clients who are not in the pipeline yet. */
  talent_id: string | null
  /** Agency/pipeline account number so notes still attach when talent_id is null. */
  account_number?: string | null
  user_id: string | null
  type: HistoryType
  text: string
  ts: string
  flagged: boolean
  is_document: boolean
  doc_name?: string
  doc_type?: string
  doc_data?: string
  email_subject?: string
  email_to?: string
  call_duration_seconds?: number
  call_recording_url?: string
  call_direction?: 'inbound' | 'outbound'
  sms_direction?: 'inbound' | 'outbound'
  /** Communication follow-up tracking (Build Requirements §23). */
  follow_up_needed?: boolean
  follow_up_date?: string | null
  method?: string
  staff_name?: string
}
