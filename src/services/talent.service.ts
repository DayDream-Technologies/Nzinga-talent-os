import type { ApplicantProfile, ApplicationData, Talent, TalentStage } from '@/types'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { demoStore } from './demo-store'
import { nextAccountNumber } from '@/lib/account-number'

/** Columns that exist on public.talents. Extra ApplicantProfile fields go in `profile`. */
const TALENT_COLUMNS = new Set([
  'id',
  'name',
  'stage',
  'niches',
  'scout_id',
  'created_at',
  'social_handle',
  'follower_count',
  'er_pct',
  'platform',
  'location',
  'pillar_scores',
  'pillar_rationales',
  'jordan_score',
  'revenue_path',
  'scout_summary',
  'team1_notes',
  'team1_decision',
  'compliance',
  'rep_type',
  'commission',
  'term_length',
  'team2_notes',
  'team2_decision',
  'director_decision',
  'portal_setup',
  'technical_routing',
  'warm_handoff',
  'warm_handoff_confirmed',
  'revenue_ytd',
  'revenue_projected',
  'last_contacted',
  'application_id',
  'application_status',
  'uploaded_docs',
  'audit_log',
  'created_by',
  'phone',
  'email',
  'account_number',
  'application_data',
  'profile',
])

const PROFILE_KEYS: (keyof ApplicantProfile)[] = [
  'first_name',
  'last_name',
  'stage_name',
  'secondary_phone',
  'preferred_contact',
  'gov_id_number',
  'dob',
  'ssn_tax_id',
  'roster_division',
  'secondary_specialization',
  'earliest_availability',
  'min_day_rate',
  'contract_duration_pref',
  'legal_minor_status',
  'animal_skill_onset',
  'travel_logistics',
  'applicant_stage_status',
  'discovery_source',
  'application_submitted_at',
  'next_callback_date',
  'prior_annual_revenue',
  'current_agency',
  'union_affiliation',
  'parent_guardian_required',
  'onboarding_fee_status',
  'reference_check_status',
  'height',
  'bust',
  'waist',
  'hips',
  'shoe_size',
  'eye_color',
  'scout_notes',
  'discovery_call_notes',
  'link_instagram',
  'link_tiktok',
  'link_youtube',
  'link_website',
  'link_portfolio',
  'link_other',
]

type TalentRow = Record<string, unknown> & {
  profile?: ApplicantProfile | null
  application_data?: ApplicationData | null
}

export function toTalentRow(talent: Talent): Record<string, unknown> {
  const profile: ApplicantProfile = {}
  for (const key of PROFILE_KEYS) {
    const value = talent[key]
    if (value !== undefined) profile[key] = value as never
  }
  const row: Record<string, unknown> = {
    profile,
    application_data: talent.application_data ?? {},
  }
  for (const [key, value] of Object.entries(talent)) {
    if (key === 'profile' || key === 'application_data') continue
    if (TALENT_COLUMNS.has(key)) row[key] = value
  }
  return row
}

export function fromTalentRow(row: TalentRow | Talent): Talent {
  const { profile, application_data, ...rest } = row as TalentRow
  return {
    ...(rest as unknown as Talent),
    ...(profile || {}),
    application_data: application_data ?? (rest as unknown as Talent).application_data ?? {},
  }
}

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
    if (byApp) return fromTalentRow(byApp as TalentRow)
  }

  const { data, error } = await supabase
    .from('talents')
    .select('*')
    .ilike('email', email)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? fromTalentRow(data as TalentRow) : null
}

export async function fetchTalents(): Promise<Talent[]> {
  if (!supabaseConfigured || !supabase) {
    return demoStore.getTalents()
  }
  const { data, error } = await supabase.from('talents').select('*')
  if (error) throw error
  return (data ?? []).map((row) => fromTalentRow(row as TalentRow))
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
  return (data ?? []).map((row) => fromTalentRow(row as TalentRow))
}

export async function searchTalents(query: string, stages?: TalentStage[]): Promise<Talent[]> {
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
  return (data ?? []).map((row) => fromTalentRow(row as TalentRow))
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
  const { data, error } = await supabase.from('talents').upsert(toTalentRow(ensured)).select().single()
  if (error) throw error
  return fromTalentRow(data as TalentRow)
}

export async function updateTalents(talents: Talent[]): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    demoStore.setTalents(talents)
    return
  }
  if (talents.length === 0) return
  const { error } = await supabase.from('talents').upsert(talents.map(toTalentRow))
  if (error) throw error
}
