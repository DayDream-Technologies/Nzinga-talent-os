export type HistoryType = 'note' | 'call' | 'email' | 'task' | 'document' | 'system'

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
}
