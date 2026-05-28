import type { Talent, TalentStage } from '@/types'
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

export async function fetchTalentsByStages(stages: TalentStage[]): Promise<Talent[]> {
  if (!supabaseConfigured || !supabase) {
    return demoStore.getTalents().filter((t) => stages.includes(t.stage))
  }
  const { data, error } = await supabase
    .from('talents')
    .select('*')
    .in('stage', stages)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Talent[]
}

export async function searchTalents(
  query: string,
  stages?: TalentStage[],
): Promise<Talent[]> {
  if (!supabaseConfigured || !supabase) {
    const all = demoStore.getTalents()
    const q = query.toLowerCase()
    return all.filter((t) => {
      const matchesQuery =
        t.name.toLowerCase().includes(q) ||
        t.social_handle.toLowerCase().includes(q)
      const matchesStage = !stages || stages.includes(t.stage)
      return matchesQuery && matchesStage
    })
  }
  let qb = supabase
    .from('talents')
    .select('*')
    .or(`name.ilike.%${query}%,social_handle.ilike.%${query}%`)
  if (stages && stages.length > 0) {
    qb = qb.in('stage', stages)
  }
  const { data, error } = await qb
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
