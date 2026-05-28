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

export async function checkDuplicateEmail(email: string, excludeAppId?: string): Promise<boolean> {
  if (!supabaseConfigured || !supabase) {
    const apps = demoStore.getApplications()
    const normalized = email.trim().toLowerCase()
    return Object.values(apps).some(
      (a) =>
        a.status === 'submitted' &&
        a.talent_email.trim().toLowerCase() === normalized &&
        a.id !== excludeAppId,
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
  const { count } = await qb
  return (count ?? 0) > 0
}

export async function fetchApplicationByCode(code: string): Promise<Application | null> {
  if (!supabaseConfigured || !supabase) {
    const apps = demoStore.getApplications()
    return Object.values(apps).find((a) => a.access_code === code) ?? null
  }
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('access_code', code)
    .single()
  if (error || !data) return null
  return data as Application
}
