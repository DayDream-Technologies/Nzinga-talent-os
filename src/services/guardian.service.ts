import type { Application, GuardianStatus } from '@/types'
import { isMinor } from '@/constants/app-sections'
import { AUTH_EMAIL_PATHS, getAuthEmailRedirectUrl } from '@/lib/auth-redirect'
import { invokeEdgeFunction } from '@/lib/edge-functions'
import {
  guardianGreetingName,
  shouldSendGuardianInvite,
  splitPersonName,
} from '@/lib/guardian-email'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { fetchApplicationById, saveApplication } from '@/services/application.service'

export interface GuardianInvite {
  id: string
  application_id: string
  guardian_email: string
  token: string
  status: 'pending' | 'completed' | 'expired'
  invited_at: string
  expires_at: string
  completed_at?: string | null
}

export interface GuardianProfilePayload {
  legal_first: string
  legal_last: string
  relationship: string
  email: string
  phone: string
  address: string
  consent_signature: string
  consent_date: string
  consent_acknowledged: boolean
  doc_gov_id?: string
  doc_gov_id_name?: string
  doc_gov_id_type?: string
  doc_guardianship?: string
  doc_guardianship_name?: string
  doc_guardianship_type?: string
}

function makeToken(): string {
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function parentNames(app: Application): { first: string; last: string } {
  const data = app.data || {}
  const first = String(data.guardian_legal_first || '').trim()
  const last = String(data.guardian_legal_last || '').trim()
  if (first || last) return { first, last }
  return splitPersonName(String(data.guardian_name || ''))
}

async function latestInvite(applicationId: string): Promise<GuardianInvite | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('guardian_invites')
    .select('*')
    .eq('application_id', applicationId)
    .order('invited_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as GuardianInvite) ?? null
}

async function deliverGuardianEmail(
  app: Application,
  email: string,
  invite: GuardianInvite,
): Promise<string | null> {
  const names = parentNames(app)
  const redirectTo = getAuthEmailRedirectUrl(AUTH_EMAIL_PATHS.guardianVerify, {
    app: app.id,
    token: invite.token,
  })
  if (!redirectTo) return 'Could not build the parent access link.'
  const result = await invokeEdgeFunction<{ sent: boolean }>('guardian-invite', {
    applicationId: app.id,
    guardianEmail: email,
    parentFirst: names.first,
    parentLast: names.last,
    token: invite.token,
    inviteId: invite.id,
    redirectTo,
    expiresAt: invite.expires_at,
  })
  if (!result.ok) {
    console.error('[inviteGuardian] parent access email failed', result.error)
    return result.error || 'Could not send the parent access email.'
  }
  return null
}

/**
 * Send the parent/guardian access email.
 * `markPending` is for the minor's submit, which moves the application to pending parent approval.
 * Staff saves leave the application status alone so the minor can keep editing.
 */
export async function inviteGuardian(
  app: Application,
  guardianEmail: string,
  opts?: { force?: boolean; markPending?: boolean },
): Promise<{ invite: GuardianInvite | null; error: string | null; emailWarning?: string | null; skipped?: boolean }> {
  const email = guardianEmail.trim().toLowerCase()
  if (!email) return { invite: null, error: 'Guardian email is required.' }
  if (!supabaseConfigured || !supabase) {
    return { invite: null, error: 'Database is not configured.', emailWarning: null }
  }

  const force = opts?.force ?? true
  const previous = force ? null : await latestInvite(app.id)
  if (!shouldSendGuardianInvite(previous, email, force)) {
    return { invite: previous, error: null, skipped: true }
  }

  const invite: GuardianInvite = {
    id: `gi_${Date.now()}`,
    application_id: app.id,
    guardian_email: email,
    token: makeToken(),
    status: 'pending',
    invited_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  }
  const names = parentNames(app)
  const markPending = opts?.markPending ?? true
  const alreadyDone = app.guardian_status === 'completed' || app.status === 'archived'
  const updated: Application = {
    ...app,
    status: markPending && !alreadyDone ? 'pending_guardian' : app.status,
    guardian_status: markPending && !alreadyDone ? ('pending' as GuardianStatus) : app.guardian_status,
    guardian_email: email,
    data: {
      ...app.data,
      guardian_invite_email: email,
      guardian_legal_first: names.first || app.data?.guardian_legal_first,
      guardian_legal_last: names.last || app.data?.guardian_legal_last,
    },
  }
  await saveApplication(updated)

  const emailWarning = await deliverGuardianEmail(updated, email, invite)
  if (emailWarning) {
    return { invite, error: null, emailWarning }
  }
  return { invite, error: null }
}

/** Send when a parent email is saved and this minor already has an application. */
export async function ensureGuardianInvite(
  app: Application | null | undefined,
): Promise<{ skipped: boolean; emailWarning?: string | null }> {
  if (!app?.id) return { skipped: true }
  const email = String(app.guardian_email || app.data?.guardian_invite_email || '').trim()
  const dob = String(app.data?.dob || '')
  if (!email || !isMinor(dob) || app.guardian_status === 'completed' || app.status === 'archived') {
    return { skipped: true }
  }
  const result = await inviteGuardian(app, email, { force: false, markPending: false })
  return { skipped: Boolean(result.skipped), emailWarning: result.emailWarning }
}

export function guardianNameFromContact(fullName: string | undefined): { first: string; last: string; greeting: string } {
  const names = splitPersonName(fullName)
  return { ...names, greeting: guardianGreetingName(names.first, names.last) }
}

export async function fetchGuardianInviteByToken(token: string): Promise<GuardianInvite | null> {
  if (!token || !supabaseConfigured || !supabase) return null
  const { data } = await supabase
    .from('guardian_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle()
  return (data as GuardianInvite) ?? null
}

export async function completeGuardianVerification(
  applicationId: string,
  token: string,
  payload: GuardianProfilePayload,
  authUid?: string,
): Promise<{ application: Application | null; error: string | null }> {
  const app = await fetchApplicationById(applicationId)

  if (!app) return { application: null, error: 'Application not found.' }

  const invite = await fetchGuardianInviteByToken(token)

  if (!invite || invite.application_id !== applicationId) {
    return { application: null, error: 'Invalid or expired guardian invitation.' }
  }
  if (new Date(invite.expires_at).getTime() < Date.now() && invite.status !== 'completed') {
    return { application: null, error: 'This guardian invitation has expired.' }
  }

  const profileRow = {
    auth_uid: authUid || null,
    email: payload.email,
    name: `${payload.legal_first} ${payload.legal_last}`.trim(),
    application_id: applicationId,
    relationship: payload.relationship,
    phone: payload.phone,
    address: payload.address,
    consent_signature: payload.consent_signature,
    consent_date: payload.consent_date,
    consent_acknowledged: payload.consent_acknowledged,
    doc_gov_id: payload.doc_gov_id || null,
    doc_gov_id_name: payload.doc_gov_id_name || null,
    doc_gov_id_type: payload.doc_gov_id_type || null,
    doc_guardianship: payload.doc_guardianship || null,
    doc_guardianship_name: payload.doc_guardianship_name || null,
    doc_guardianship_type: payload.doc_guardianship_type || null,
    completed_at: new Date().toISOString(),
  }

  if (!supabaseConfigured || !supabase) {
    return { application: null, error: 'Database is not configured.' }
  }
  await supabase.from('guardian_profiles').upsert(profileRow, { onConflict: 'application_id' })
  await supabase
    .from('guardian_invites')
    .update({ status: 'completed', completed_at: profileRow.completed_at })
    .eq('token', token)

  const submitted: Application = {
    ...app,
    status: 'submitted',
    guardian_status: 'completed',
    guardian_email: payload.email,
    submitted_at: app.submitted_at || new Date().toISOString(),
    last_saved: new Date().toISOString(),
    data: {
      ...app.data,
      guardian_invite_email: payload.email,
      guardian_completed: 'yes',
      guardian_name: profileRow.name,
      guardian_relationship: payload.relationship,
      guardian_phone: payload.phone,
      doc_guardian_id: payload.doc_gov_id,
      doc_guardian_id_name: payload.doc_gov_id_name,
      doc_guardian_id_type: payload.doc_gov_id_type,
    },
  }
  await saveApplication(submitted)

  return { application: submitted, error: null }
}
