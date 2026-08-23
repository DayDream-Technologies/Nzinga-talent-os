import type { Application, ApplicationData, ApplicationsMap } from '@/types'
import { isEmbeddedDataUrl } from '@/lib/application-files'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { demoStore } from './demo-store'

export function sanitizeApplicationData(data: ApplicationData | undefined): ApplicationData {
  const next: ApplicationData = {}
  for (const [key, value] of Object.entries(data || {})) {
    if (isEmbeddedDataUrl(value)) continue
    next[key] = value
  }
  return next
}

/** Merge questionnaire blobs. A newer last_saved wins on overlapping keys; never drop keys the other side still has. */
export function mergeApplicationData(
  existing: ApplicationData | undefined,
  incoming: ApplicationData | undefined,
  opts?: { incomingSavedAt?: string; existingSavedAt?: string },
): ApplicationData {
  const current = sanitizeApplicationData(existing)
  const next = sanitizeApplicationData(incoming)
  const incomingTs = opts?.incomingSavedAt ? Date.parse(opts.incomingSavedAt) : NaN
  const existingTs = opts?.existingSavedAt ? Date.parse(opts.existingSavedAt) : NaN
  const incomingIsStale =
    Number.isFinite(incomingTs) && Number.isFinite(existingTs) && incomingTs < existingTs
  return incomingIsStale ? { ...next, ...current } : { ...current, ...next }
}

function toApplicationRow(app: Application, data: ApplicationData) {
  return {
    id: app.id,
    talent_id: app.talent_id ?? null,
    access_code: app.access_code,
    talent_name: app.talent_name,
    talent_email: app.talent_email,
    status: app.status,
    created_at: app.created_at,
    last_saved: app.last_saved ?? new Date().toISOString(),
    completed_sections: app.completed_sections ?? [],
    data,
    company_code: app.company_code,
    guardian_status: app.guardian_status ?? null,
    guardian_email: app.guardian_email ?? null,
    submitted_at: app.submitted_at ?? null,
  }
}

async function linkProspectProfile(applicationId: string) {
  if (!supabase) return
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) return
    await supabase.from('prospect_profiles').update({ application_id: applicationId }).eq('auth_uid', session.user.id)
  } catch {
    // non-fatal — application row is already saved
  }
}

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
  const incoming = sanitizeApplicationData(app.data)
  const local: Application = { ...app, data: incoming }

  if (!supabaseConfigured || !supabase) {
    const prev = demoStore.getApplications()[app.id]
    const merged: Application = {
      ...local,
      data: mergeApplicationData(prev?.data, incoming, {
        incomingSavedAt: app.last_saved,
        existingSavedAt: prev?.last_saved,
      }),
    }
    demoStore.setApplications({ ...demoStore.getApplications(), [app.id]: merged })
    return merged
  }

  const { data: existing, error: existingError } = await supabase
    .from('applications')
    .select('data, last_saved')
    .eq('id', app.id)
    .maybeSingle()
  if (existingError) {
    throw new Error(existingError.message)
  }

  const mergedData = mergeApplicationData(
    (existing?.data as ApplicationData | undefined) || {},
    incoming,
    {
      incomingSavedAt: app.last_saved,
      existingSavedAt: existing?.last_saved ?? undefined,
    },
  )
  const payload = toApplicationRow(app, mergedData)

  // Prefer UPDATE so submit does not hit INSERT RLS on upsert-of-existing-row.
  const { data: updated, error: updateError } = await supabase
    .from('applications')
    .update(payload)
    .eq('id', app.id)
    .select()
    .maybeSingle()
  if (updateError) {
    throw new Error(updateError.message)
  }
  if (updated) {
    await linkProspectProfile(app.id)
    return updated as Application
  }

  const { data: inserted, error: insertError } = await supabase
    .from('applications')
    .insert(payload)
    .select()
    .single()
  if (insertError) {
    if (insertError.code === '23505') {
      const { data: retry, error: retryError } = await supabase
        .from('applications')
        .update(payload)
        .eq('id', app.id)
        .select()
        .single()
      if (retryError || !retry) {
        throw new Error(retryError?.message || insertError.message)
      }
      await linkProspectProfile(app.id)
      return retry as Application
    }
    throw new Error(insertError.message)
  }

  await linkProspectProfile(app.id)
  return inserted as Application
}

const MATCH_STATUSES = new Set(['submitted', 'pending_guardian'])

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
