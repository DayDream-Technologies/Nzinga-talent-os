import type { ProspectProfile, Talent, TalentStage, User } from '@/types'
import { USERS } from '@/constants/seed-data'
import { COMPANY_CODES } from '@/constants/roles'
import { AUTH_EMAIL_PATHS, getAuthEmailRedirectUrl } from '@/lib/auth-redirect'
import { clearLocalAuthSession, supabase, supabaseConfigured } from '@/lib/supabase'
import { isFreshLoginActive } from '@/lib/session-storage'
import { fetchTalentByEmailOrApplication } from '@/services/talent.service'

/** Director-approved talent may use the talent portal (signed onboarding and beyond). */
export function isTalentPortalApproved(stage: TalentStage | string | null | undefined): boolean {
  return stage === 'signed_onboarding' || stage === 'archived'
}

export const TALENT_UNDER_REVIEW_MESSAGE =
  'Your application is still under review. Talent login is available after director approval and signed onboarding.'

export const TALENT_LOGIN_DEMO_MESSAGE =
  'Talent login is not available in demo mode. Connect Supabase to enable approved talent access.'

export function validateCompanyCode(code: string): boolean {
  return Boolean(COMPANY_CODES[code.toUpperCase()])
}

export async function validateCompanyCodeFromDB(code: string): Promise<boolean> {
  if (!supabaseConfigured || !supabase) {
    return validateCompanyCode(code)
  }
  const { data } = await supabase
    .from('company_codes')
    .select('code')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single()
  return !!data
}

export async function loginWithCredentials(
  email: string,
  password: string,
  companyCode?: string,
): Promise<User | null> {
  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) return null
    let query = supabase
      .from('users')
      .select('*')
      .eq('auth_uid', data.user.id)
    if (companyCode) {
      query = query.eq('company_code', companyCode.toUpperCase())
    }
    const { data: profile } = await query.maybeSingle()
    if (!profile) {
      await supabase.auth.signOut()
      return null
    }
    const { writeAuditEvent } = await import('@/services/audit.service')
    await writeAuditEvent({
      action: 'login',
      entity_type: 'session',
      entity_id: profile.id,
      user_id: profile.id,
      details: { email: profile.email, method: 'password' },
    })
    return profile as User
  }
  return USERS.find((u) => u.email === email && u.password === password) ?? null
}

export async function restoreSession(): Promise<User | null> {
  if (!supabaseConfigured || !supabase) return null
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      if (!isFreshLoginActive()) await clearLocalAuthSession()
      return null
    }
    if (!session?.user) return null
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_uid', session.user.id)
      .maybeSingle()
    // Prospect (or orphan) auth sessions have no staff profile — not an error
    return (profile as User) ?? null
  } catch {
    // Stale refresh tokens often surface as CORS/network Failed to fetch
    if (!isFreshLoginActive()) await clearLocalAuthSession()
    return null
  }
}

export async function logout(): Promise<void> {
  if (supabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      await clearLocalAuthSession()
    }
  }
}

// ─── Prospect Auth ───────────────────────────────────────────────────────────

async function ensureProspectProfile(
  authUid: string,
  email: string,
  name: string,
): Promise<{ profile: ProspectProfile | null; error: string | null }> {
  if (!supabase) return { profile: null, error: 'Database not configured (demo mode).' }

  const { data: existing } = await supabase
    .from('prospect_profiles')
    .select('*')
    .eq('auth_uid', authUid)
    .maybeSingle()

  if (existing) {
    return { profile: existing as ProspectProfile, error: null }
  }

  const { data: profile, error } = await supabase
    .from('prospect_profiles')
    .upsert({ auth_uid: authUid, email, name }, { onConflict: 'auth_uid' })
    .select()
    .single()

  if (error) {
    return { profile: null, error: error.message }
  }
  return { profile: profile as ProspectProfile, error: null }
}

export async function prospectSignup(
  email: string,
  password: string,
  name: string,
): Promise<{ profile: ProspectProfile | null; error: string | null }> {
  if (!supabaseConfigured || !supabase) {
    return { profile: null, error: 'Database not configured (demo mode).' }
  }

  const emailRedirectTo = getAuthEmailRedirectUrl(AUTH_EMAIL_PATHS.confirmed)

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, account_type: 'prospect' },
      emailRedirectTo,
    },
  })

  if (authError || !authData.user) {
    const msg = authError?.message ?? 'Signup failed.'
    if (/already|registered|exists/i.test(msg)) {
      return {
        profile: null,
        error: 'An account with this email already exists. Log in to resume your application.',
      }
    }
    return { profile: null, error: friendlyAuthError(msg) }
  }

  // Email confirmation on → usually no session yet. Profile is created by DB trigger
  // (008_prospect_profile_trigger). Client INSERT would fail RLS as anon.
  if (!authData.session) {
    return {
      profile: {
        id: '',
        auth_uid: authData.user.id,
        email,
        name,
        application_id: null,
        created_at: new Date().toISOString(),
      },
      error: null,
    }
  }

  return ensureProspectProfile(authData.user.id, email, name)
}

export async function prospectLogin(
  email: string,
  password: string,
): Promise<{ profile: ProspectProfile | null; error: string | null }> {
  if (!supabaseConfigured || !supabase) {
    return { profile: null, error: 'Database not configured (demo mode).' }
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { profile: null, error: authError?.message ?? 'Login failed.' }
  }

  const metaName =
    (authData.user.user_metadata?.name as string | undefined) ||
    email.split('@')[0] ||
    'Prospect'

  const result = await ensureProspectProfile(authData.user.id, email, metaName)
  if (result.profile) {
    const lastLoginAt = new Date().toISOString()
    const { data: updated } = await supabase
      .from('prospect_profiles')
      .update({ last_login_at: lastLoginAt })
      .eq('auth_uid', authData.user.id)
      .select()
      .maybeSingle()
    if (updated) {
      return { profile: updated as ProspectProfile, error: null }
    }
    return {
      profile: { ...result.profile, last_login_at: lastLoginAt },
      error: null,
    }
  }
  return result
}

/**
 * Prospect account login for the talent home portal.
 * Requires Supabase and a pipeline talent at signed_onboarding (or archived).
 * Signs out and returns a clear under-review message when not yet approved.
 */
export async function loginApprovedTalent(
  email: string,
  password: string,
): Promise<{ profile: ProspectProfile | null; talent: Talent | null; error: string | null }> {
  if (!supabaseConfigured || !supabase) {
    return { profile: null, talent: null, error: TALENT_LOGIN_DEMO_MESSAGE }
  }

  const { profile, error } = await prospectLogin(email, password)
  if (error || !profile) {
    return {
      profile: null,
      talent: null,
      error: error ? friendlyAuthError(error) : 'Login failed.',
    }
  }

  let talent: Talent | null = null
  try {
    talent = await fetchTalentByEmailOrApplication({
      email: profile.email,
      applicationId: profile.application_id,
    })
  } catch {
    await logout()
    return {
      profile: null,
      talent: null,
      error: 'Unable to verify your talent status. Please try again shortly.',
    }
  }

  if (!talent || !isTalentPortalApproved(talent.stage)) {
    await logout()
    return { profile: null, talent: null, error: TALENT_UNDER_REVIEW_MESSAGE }
  }

  return { profile, talent, error: null }
}

/** Restore an approved talent session from an existing prospect auth session. */
export async function restoreApprovedTalentSession(): Promise<{
  profile: ProspectProfile | null
  talent: Talent | null
  error: string | null
}> {
  if (!supabaseConfigured || !supabase) {
    return { profile: null, talent: null, error: TALENT_LOGIN_DEMO_MESSAGE }
  }

  const profile = await getProspectProfile()
  if (!profile) {
    return { profile: null, talent: null, error: null }
  }

  let talent: Talent | null = null
  try {
    talent = await fetchTalentByEmailOrApplication({
      email: profile.email,
      applicationId: profile.application_id,
    })
  } catch {
    return {
      profile: null,
      talent: null,
      error: 'Unable to verify your talent status. Please try again shortly.',
    }
  }

  if (!talent || !isTalentPortalApproved(talent.stage)) {
    await logout()
    return { profile: null, talent: null, error: TALENT_UNDER_REVIEW_MESSAGE }
  }

  return { profile, talent, error: null }
}

export async function sendPasswordResetEmail(
  email: string,
): Promise<{ error: string | null; demo?: boolean }> {
  const trimmed = email.trim()
  if (!trimmed) return { error: 'Email is required.' }

  if (!supabaseConfigured || !supabase) {
    // Demo / local mode: treat as sent so staff workflows are testable
    return { error: null, demo: true }
  }
  const redirectTo = getAuthEmailRedirectUrl(AUTH_EMAIL_PATHS.resetPassword)
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo })
  if (error) return { error: friendlyAuthError(error.message) }
  return { error: null }
}

/** Staff lookup of prospect portal profile by email (includes last_login_at). */
export async function getProspectProfileByEmail(
  email: string,
): Promise<ProspectProfile | null> {
  if (!supabaseConfigured || !supabase || !email.trim()) return null
  const { data } = await supabase
    .from('prospect_profiles')
    .select('*')
    .ilike('email', email.trim())
    .maybeSingle()
  return (data as ProspectProfile) ?? null
}

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  if (!supabaseConfigured || !supabase) {
    return { error: 'Not available in demo mode.' }
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Map Supabase auth error messages to user-friendly copy.
 */
export function friendlyAuthError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
    return 'Incorrect email or password. Please try again or reset your password below.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Your email has not been confirmed yet. Check your inbox for a confirmation message from Nzinga Management Agency and follow the Confirm Email button.'
  }
  if (
    lower.includes('email rate limit') ||
    lower.includes('rate limit exceeded') ||
    (lower.includes('rate limit') && lower.includes('email'))
  ) {
    return 'Too many verification emails were sent recently. Please wait a few minutes and try again. If you already received a message from Nzinga Management Agency, you can use that link or ignore extra copies.'
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (lower.includes('user not found')) {
    return 'No account found with this email. Did you mean to create a new application?'
  }
  return raw
}

export async function getProspectProfile(): Promise<ProspectProfile | null> {
  if (!supabaseConfigured || !supabase) return null
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session?.user) {
      if (error) await clearLocalAuthSession()
      return null
    }
    const { data } = await supabase
      .from('prospect_profiles')
      .select('*')
      .eq('auth_uid', session.user.id)
      .maybeSingle()
    return (data as ProspectProfile) ?? null
  } catch {
    await clearLocalAuthSession()
    return null
  }
}
