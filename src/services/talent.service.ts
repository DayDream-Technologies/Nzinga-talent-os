import type { Talent } from '@/types'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { demoStore } from './demo-store'

export async function fetchTalents(): Promise<Talent[]> {
  if (!supabaseConfigured || !supabase) {
    return demoStore.getTalents()
  }
  const { data, error } = await supabase.from('talents').select('*')
  if (error) throw error
  return (data ?? []) as Talent[]
}

export async function upsertTalent(talent: Talent): Promise<Talent> {
  if (!supabaseConfigured || !supabase) {
    const list = demoStore.getTalents()
    const idx = list.findIndex((t) => t.id === talent.id)
    if (idx >= 0) list[idx] = talent
    else list.push(talent)
    demoStore.setTalents([...list])
    return talent
  }
  const { data, error } = await supabase.from('talents').upsert(talent).select().single()
  if (error) throw error
  return data as Talent
}

export async function updateTalents(talents: Talent[]): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    demoStore.setTalents(talents)
    return
  }
  const { error } = await supabase.from('talents').upsert(talents)
  if (error) throw error
}
