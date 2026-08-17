import type { Application, GuardianStatus } from '@/types'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { saveApplication } from '@/services/application.service'
import { demoStore } from '@/services/demo-store'

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

const demoInvites: Record<string, GuardianInvite> = {}
const demoProfiles: Record<string, GuardianProfilePayload & { application_id: string; auth_uid?: string }> = {}

/** Invite parent/guardian via Supabase magic-link OTP email. */
export async function inviteGuardian(
  app: Application,
  guardianEmail: string,
): Promise<{ invite: GuardianInvite | null; error: string | null }> {
  const email = guardianEmail.trim().toLowerCase()
  if (!email) return { invite: null, error: 'Guardian email is required.' }

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

  if (!supabaseConfigured || !supabase) {
    demoInvites[invite.token] = invite
    demoInvites[invite.id] = invite
    return { invite, error: null }
  }

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

  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/guardian/verify?app=${encodeURIComponent(app.id)}&token=${encodeURIComponent(invite.token)}`
      : undefined

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
  if (error) return { invite: null, error: error.message }
  return { invite, error: null }
}

export async function fetchGuardianInviteByToken(token: string): Promise<GuardianInvite | null> {
  if (!token) return null
  if (!supabaseConfigured || !supabase) {
    return demoInvites[token] ?? null
  }
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
  const app =
    (!supabaseConfigured || !supabase
      ? demoStore.getApplications()[applicationId]
      : null) || (await import('@/services/application.service').then((m) => m.fetchApplicationById(applicationId)))

  if (!app) return { application: null, error: 'Application not found.' }

  const invite =
    (await fetchGuardianInviteByToken(token)) ||
    (demoInvites[token] ?? null)

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
    demoProfiles[applicationId] = { ...payload, application_id: applicationId, auth_uid: authUid }
    if (demoInvites[token]) {
      demoInvites[token] = {
        ...demoInvites[token],
        status: 'completed',
        completed_at: profileRow.completed_at,
      }
    }
  } else {
    await supabase.from('guardian_profiles').upsert(profileRow, { onConflict: 'application_id' })
    await supabase
      .from('guardian_invites')
      .update({ status: 'completed', completed_at: profileRow.completed_at })
      .eq('token', token)
  }

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

  // Promote into New / Lead once guardian completes (outside staff AppDataContext).
  try {
    const { talentFromApp } = await import('@/constants/app-sections')
    const { nextAccountNumber } = await import('@/lib/account-number')
    if (!supabaseConfigured || !supabase) {
      const talents = demoStore.getTalents()
      const existing = talents.find((t) => t.application_id === applicationId)
      const built = talentFromApp(
        submitted,
        existing?.account_number || nextAccountNumber(talents.map((t) => t.account_number)),
      )
      if (existing) {
        demoStore.setTalents(
          talents.map((t) =>
            t.id === existing.id
              ? { ...existing, ...built, id: existing.id, application_id: applicationId }
              : t,
          ),
        )
      } else {
        demoStore.setTalents([...talents, built])
      }
    }
  } catch (e) {
    console.warn('[completeGuardianVerification] talent upgrade skipped', e)
  }

  return { application: submitted, error: null }
}

export function getDemoGuardianInviteUrl(appId: string, token: string): string {
  return `/guardian/verify?app=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}`
}
