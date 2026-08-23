import type { HistoryEntry } from '@/types'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { demoStore } from './demo-store'

export type HistoryRow = {
  id: string
  talent_id: string | null
  account_number: string | null
  user_id: string | null
  type: HistoryEntry['type']
  text: string
  ts: string
  flagged: boolean
  is_document: boolean
  doc_name: string | null
  doc_type: string | null
  doc_data: string | null
  email_subject: string | null
  email_to: string | null
  call_duration_seconds: number | null
  call_recording_url: string | null
  call_direction: string | null
  sms_direction: string | null
  follow_up_needed: boolean
  follow_up_date: string | null
  method: string | null
  staff_name: string | null
}

export function toHistoryRow(entry: HistoryEntry): HistoryRow {
  return {
    id: entry.id,
    talent_id: entry.talent_id || null,
    account_number: entry.account_number || null,
    user_id: entry.user_id || null,
    type: entry.type,
    text: entry.text,
    ts: entry.ts,
    flagged: Boolean(entry.flagged),
    is_document: Boolean(entry.is_document),
    doc_name: entry.doc_name ?? null,
    doc_type: entry.doc_type ?? null,
    doc_data: entry.doc_data ?? null,
    email_subject: entry.email_subject ?? null,
    email_to: entry.email_to ?? null,
    call_duration_seconds: entry.call_duration_seconds ?? null,
    call_recording_url: entry.call_recording_url ?? null,
    call_direction: entry.call_direction ?? null,
    sms_direction: entry.sms_direction ?? null,
    follow_up_needed: Boolean(entry.follow_up_needed),
    follow_up_date: entry.follow_up_date ?? null,
    method: entry.method ?? null,
    staff_name: entry.staff_name ?? null,
  }
}

/** Drop talent/user ids that would violate history FKs. */
export function sanitizeHistoryRows(
  rows: HistoryRow[],
  validTalentIds: Set<string>,
  validUserIds: Set<string>,
): HistoryRow[] {
  return rows.map((row) => ({
    ...row,
    talent_id: row.talent_id && validTalentIds.has(row.talent_id) ? row.talent_id : null,
    user_id: row.user_id && validUserIds.has(row.user_id) ? row.user_id : null,
  }))
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  if (!supabaseConfigured || !supabase) {
    return demoStore.getHistory()
  }
  const { data, error } = await supabase.from('history').select('*')
  if (error) throw error
  return (data ?? []) as HistoryEntry[]
}

async function fetchValidIds(table: 'talents' | 'users', ids: string[]): Promise<Set<string>> {
  if (!supabase || ids.length === 0) return new Set()
  const unique = [...new Set(ids)]
  const { data, error } = await supabase.from(table).select('id').in('id', unique)
  if (error) {
    console.warn(`[history] could not verify ${table} ids:`, error.message)
    return new Set()
  }
  return new Set((data ?? []).map((row) => String((row as { id: string }).id)))
}

/**
 * Persist new/changed history rows. When `prev` is passed, only the delta is
 * written. Invalid talent_id / user_id values are stored as null so a CRM note
 * cannot crash via history_talent_id_fkey.
 */
export async function saveHistory(
  entries: HistoryEntry[],
  prev: HistoryEntry[] = [],
): Promise<void> {
  const prevById = new Map(prev.map((h) => [h.id, h]))
  const changed =
    prev.length === 0
      ? entries
      : entries.filter((h) => JSON.stringify(prevById.get(h.id)) !== JSON.stringify(h))
  if (changed.length === 0) return

  if (!supabaseConfigured || !supabase) {
    const byId = new Map(demoStore.getHistory().map((h) => [h.id, h]))
    for (const entry of changed) byId.set(entry.id, entry)
    demoStore.setHistory([...byId.values()].sort((a, b) => (a.ts < b.ts ? 1 : -1)))
    return
  }

  const rows = changed.map(toHistoryRow)
  const [validTalents, validUsers] = await Promise.all([
    fetchValidIds(
      'talents',
      rows.map((r) => r.talent_id).filter((id): id is string => Boolean(id)),
    ),
    fetchValidIds(
      'users',
      rows.map((r) => r.user_id).filter((id): id is string => Boolean(id)),
    ),
  ])
  const cleaned = sanitizeHistoryRows(rows, validTalents, validUsers)
  const { error } = await supabase.from('history').upsert(cleaned)
  if (error) throw error
}
