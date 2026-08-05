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
  const { data, error } = await supabase.from('applications').upsert(app).select().single()
  if (error) throw error
  return data as Application
}

export async function checkDuplicateEmail(
  email: string,
  excludeAppId?: string,
  companyCode?: string,
): Promise<boolean> {
  if (!supabaseConfigured || !supabase) {
    const apps = demoStore.getApplications()
    const normalized = email.trim().toLowerCase()
    const tenant = companyCode?.trim().toUpperCase()
    return Object.values(apps).some(
      (a) =>
        a.status === 'submitted' &&
        a.talent_email.trim().toLowerCase() === normalized &&
        a.id !== excludeAppId &&
        (!tenant || String(a.company_code || 'NZG').toUpperCase() === tenant),
    )
  }
  let qb = supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'submitted')
    .ilike('talent_email', email.trim())
  if (excludeAppId) {
    qb = qb.neq('id', excludeAppId)
  }
  if (companyCode) {
    qb = qb.eq('company_code', companyCode.trim().toUpperCase())
  }
  const { count } = await qb
  return (count ?? 0) > 0
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
