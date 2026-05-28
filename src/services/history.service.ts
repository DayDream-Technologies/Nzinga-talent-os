import type { HistoryEntry } from '@/types'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { demoStore } from './demo-store'

export async function fetchHistory(): Promise<HistoryEntry[]> {
  if (!supabaseConfigured || !supabase) {
    return demoStore.getHistory()
  }
  const { data, error } = await supabase.from('history').select('*')
  if (error) throw error
  return (data ?? []) as HistoryEntry[]
}

export async function saveHistory(history: HistoryEntry[]): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    demoStore.setHistory(history)
    return
  }
  const { error } = await supabase.from('history').upsert(history)
  if (error) throw error
}
