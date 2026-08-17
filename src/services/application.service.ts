import type { Application, ApplicationsMap } from '@/types'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { demoStore } from './demo-store'

export async function fetchApplications(): Promise<ApplicationsMap> {
  if (!supabaseConfigured || !supabase) {
    return demoStore.getApplications()
  }
  const { data, error } = await supabase.from('applications').select('*')
  if (error) throw error
  const map: ApplicationsMap = {}
  for (const row of data ?? []) {
    const app = row as Application
    map[app.id] = app
  }
  return map
}

export async function saveApplication(app: Application): Promise<Application> {
  if (!supabaseConfigured || !supabase) {
    const map = { ...demoStore.getApplications(), [app.id]: app }
    demoStore.setApplications(map)
    return app
  }

  // Strip company_code if the column might not exist yet (migration 007 pending)
  const payload = { ...app }
  try {
    const { data, error } = await supabase.from('applications').upsert(payload).select().single()
    if (error) {
      // RLS or schema error — fall back to local store so user isn't blocked
      console.warn('[saveApplication] Supabase error, falling back to local:', error.message)
      const map = { ...demoStore.getApplications(), [app.id]: app }
      demoStore.setApplications(map)
      return app
    }
    return data as Application
  } catch (e) {
    console.warn('[saveApplication] Unexpected error, falling back to local:', e)
    const map = { ...demoStore.getApplications(), [app.id]: app }
    demoStore.setApplications(map)
    return app
  }
}

const MATCH_STATUSES = new Set(['submitted', 'pending_guardian', 'in_progress', 'sent'])

function isDuplicateCandidate(
  a: Application,
  opts: {
    email?: string
    phone?: string
    first?: string
    last?: string
    dob?: string
    excludeAppId?: string
    companyCode?: string
  },
): boolean {
  if (!MATCH_STATUSES.has(a.status)) return false
  if (opts.excludeAppId && a.id === opts.excludeAppId) return false
  const tenant = opts.companyCode?.trim().toUpperCase()
  if (tenant && String(a.company_code || 'NZG').toUpperCase() !== tenant) return false

  const email = opts.email?.trim().toLowerCase()
  if (email) {
    const appEmail = String((a.data && a.data.email) || a.talent_email || '')
      .trim()
      .toLowerCase()
    if (appEmail && appEmail === email) return true
  }

  const phone = opts.phone?.replace(/\D/g, '')
  if (phone && phone.length >= 7) {
    const appPhone = String(a.data?.phone || '').replace(/\D/g, '')
    if (appPhone && appPhone === phone) return true
  }

  const first = opts.first?.trim().toLowerCase()
  const last = opts.last?.trim().toLowerCase()
  const dob = opts.dob?.trim()
  if (first && last && dob) {
    const af = String(a.data?.legal_first || '').trim().toLowerCase()
    const al = String(a.data?.legal_last || '').trim().toLowerCase()
    const ad = String(a.data?.dob || '').trim()
    if (af === first && al === last && ad === dob) return true
  }

  return false
}

/** True if a matching profile already exists (email, phone, or name+DOB). */
export async function checkDuplicateApplicant(
  opts: {
    email?: string
    phone?: string
    first?: string
    last?: string
    dob?: string
    excludeAppId?: string
    companyCode?: string
  },
): Promise<boolean> {
  if (!supabaseConfigured || !supabase) {
    return Object.values(demoStore.getApplications()).some((a) => isDuplicateCandidate(a, opts))
  }

  if (opts.email?.trim()) {
    let qb = supabase
      .from('applications')
      .select('id,status,talent_email,company_code,data')
      .ilike('talent_email', opts.email.trim())
    if (opts.excludeAppId) qb = qb.neq('id', opts.excludeAppId)
    if (opts.companyCode) qb = qb.eq('company_code', opts.companyCode.trim().toUpperCase())
    const { data } = await qb.limit(20)
    if ((data ?? []).some((row) => isDuplicateCandidate(row as Application, opts))) return true
  }

  // Broader pull for phone / name+DOB within tenant (demo-friendly; capped).
  let listQ = supabase.from('applications').select('id,status,talent_email,company_code,data').limit(200)
  if (opts.companyCode) listQ = listQ.eq('company_code', opts.companyCode.trim().toUpperCase())
  const { data: rows } = await listQ
  return (rows ?? []).some((row) => isDuplicateCandidate(row as Application, opts))
}

export async function checkDuplicateEmail(
  email: string,
  excludeAppId?: string,
  companyCode?: string,
): Promise<boolean> {
  return checkDuplicateApplicant({ email, excludeAppId, companyCode })
}

export async function fetchApplicationByCode(
  code: string,
  companyCode?: string,
): Promise<Application | null> {
  if (!supabaseConfigured || !supabase) {
    const apps = demoStore.getApplications()
    const tenant = companyCode?.trim().toUpperCase()
    return (
      Object.values(apps).find(
        (a) =>
          a.access_code === code &&
          (!tenant || String(a.company_code || 'NZG').toUpperCase() === tenant),
      ) ?? null
    )
  }
  let qb = supabase.from('applications').select('*').eq('access_code', code)
  if (companyCode) {
    qb = qb.eq('company_code', companyCode.trim().toUpperCase())
  }
  const { data, error } = await qb.maybeSingle()
  if (error || !data) return null
  return data as Application
}

export async function fetchApplicationById(id: string): Promise<Application | null> {
  if (!supabaseConfigured || !supabase) {
    return demoStore.getApplications()[id] ?? null
  }
  const { data, error } = await supabase.from('applications').select('*').eq('id', id).single()
  if (error || !data) return null
  return data as Application
}

export async function fetchApplicationByEmail(
  email: string,
  companyCode?: string,
): Promise<Application | null> {
  if (!supabaseConfigured || !supabase) {
    const normalized = email.trim().toLowerCase()
    const tenant = companyCode?.trim().toUpperCase()
    return (
      Object.values(demoStore.getApplications()).find(
        (a) =>
          String(a.talent_email || '').trim().toLowerCase() === normalized &&
          (!tenant || String(a.company_code || 'NZG').toUpperCase() === tenant),
      ) ?? null
    )
  }
  let qb = supabase
    .from('applications')
    .select('*')
    .ilike('talent_email', email.trim())
    .order('created_at', { ascending: false })
    .limit(1)
  if (companyCode) {
    qb = qb.eq('company_code', companyCode.trim().toUpperCase())
  }
  const { data, error } = await qb.maybeSingle()
  if (error || !data) return null
  return data as Application
}
