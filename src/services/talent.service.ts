import type { Talent, TalentStage } from '@/types'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { demoStore } from './demo-store'
import { nextAccountNumber } from '@/lib/account-number'

export async function fetchTalentByEmailOrApplication(opts: {
  email: string
  applicationId?: string | null
}): Promise<Talent | null> {
  const email = opts.email.trim()
  if (!email) return null

  if (!supabaseConfigured || !supabase) {
    const all = demoStore.getTalents()
    const lower = email.toLowerCase()
    return (
      all.find(
        (t) =>
          (t.email || '').toLowerCase() === lower ||
          (opts.applicationId && t.application_id === opts.applicationId),
      ) ?? null
    )
  }

  if (opts.applicationId) {
    const { data: byApp } = await supabase
      .from('talents')
      .select('*')
      .eq('application_id', opts.applicationId)
      .maybeSingle()
    if (byApp) return byApp as Talent
  }

  const { data, error } = await supabase
    .from('talents')
    .select('*')
    .ilike('email', email)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as Talent) ?? null
}

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
        t.social_handle.toLowerCase().includes(q) ||
        (t.account_number || '').toLowerCase().includes(q)
      const matchesStage = !stages || stages.includes(t.stage)
      return matchesQuery && matchesStage
    })
  }
  let qb = supabase
    .from('talents')
    .select('*')
    .or(`name.ilike.%${query}%,social_handle.ilike.%${query}%,account_number.ilike.%${query}%`)
  if (stages && stages.length > 0) {
    qb = qb.in('stage', stages)
  }
  const { data, error } = await qb
  if (error) throw error
  return (data ?? []) as Talent[]
}

export async function upsertTalent(talent: Talent): Promise<Talent> {
  const ensured: Talent = talent.account_number?.trim()
    ? talent
    : {
        ...talent,
        account_number: nextAccountNumber(demoStore.getTalents().map((t) => t.account_number)),
      }
  if (!supabaseConfigured || !supabase) {
    const list = demoStore.getTalents()
    const idx = list.findIndex((t) => t.id === ensured.id)
    if (idx >= 0) list[idx] = ensured
    else list.push(ensured)
    demoStore.setTalents([...list])
    return ensured
  }
  const { data, error } = await supabase.from('talents').upsert(ensured).select().single()
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
