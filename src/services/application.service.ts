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
