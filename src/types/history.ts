export type HistoryType = 'note' | 'call' | 'email' | 'sms' | 'task' | 'document' | 'system'

export interface HistoryEntry {
  id: string
  talent_id: string
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
}
