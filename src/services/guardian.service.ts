import type { Application, GuardianStatus } from '@/types'
import { AUTH_EMAIL_PATHS, getAuthEmailRedirectUrl } from '@/lib/auth-redirect'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { fetchApplicationById, saveApplication } from '@/services/application.service'
import { friendlyAuthError } from '@/services/auth.service'

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

/** Invite parent/guardian via Supabase magic-link OTP email. */
export async function inviteGuardian(
  app: Application,
  guardianEmail: string,
): Promise<{ invite: GuardianInvite | null; error: string | null; emailWarning?: string | null }> {
  const email = guardianEmail.trim().toLowerCase()
  if (!email) return { invite: null, error: 'Guardian email is required.' }
  if (!supabaseConfigured || !supabase) {
    return { invite: null, error: 'Database is not configured.', emailWarning: null }
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

  const updated: Application = {
    ...app,
    status: 'pending_guardian',
    guardian_status: 'pending' as GuardianStatus,
    guardian_email: email,
    data: { ...app.data, guardian_invite_email: email },
  }
  await saveApplication(updated)

  const { error: insertErr } = await supabase.from('guardian_invites').upsert({
    id: invite.id,
    application_id: invite.application_id,
    guardian_email: invite.guardian_email,
    token: invite.token,
    status: invite.status,
    invited_at: invite.invited_at,
    expires_at: invite.expires_at,
  })
  if (insertErr) {
    console.warn('[inviteGuardian] insert failed, continuing with OTP:', insertErr.message)
  }

  const redirectTo = getAuthEmailRedirectUrl(AUTH_EMAIL_PATHS.guardianVerify, {
    app: app.id,
    token: invite.token,
  })

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        account_type: 'guardian',
        application_id: app.id,
        invite_token: invite.token,
      },
    },
  })
  // Application is already pending_guardian — do not block minor submit if OTP email fails.
  if (error) {
    console.warn('[inviteGuardian] OTP email failed:', error.message)
    return {
      invite,
      error: null,
      emailWarning: friendlyAuthError(error.message || 'Could not send the parent verification email automatically.'),
    }
  }
  return { invite, error: null }
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
