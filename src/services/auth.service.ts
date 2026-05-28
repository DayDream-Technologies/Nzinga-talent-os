import type { ProspectProfile, User } from '@/types'
import { USERS } from '@/constants/seed-data'
import { COMPANY_CODES } from '@/constants/roles'
import { supabase, supabaseConfigured } from '@/lib/supabase'

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
    const { data: profile } = await query.single()
    if (!profile) {
      await supabase.auth.signOut()
      return null
    }
    return profile as User
  }
  return USERS.find((u) => u.email === email && u.password === password) ?? null
}

export async function restoreSession(): Promise<User | null> {
  if (!supabaseConfigured || !supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_uid', session.user.id)
    .single()
  return (profile as User) ?? null
}

export async function logout(): Promise<void> {
  if (supabaseConfigured && supabase) {
    await supabase.auth.signOut()
  }
}

// ─── Prospect Auth ───────────────────────────────────────────────────────────

export async function prospectSignup(
  email: string,
  password: string,
  name: string,
): Promise<{ profile: ProspectProfile | null; error: string | null }> {
  if (!supabaseConfigured || !supabase) {
    return { profile: null, error: 'Database not configured (demo mode).' }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, account_type: 'prospect' } },
  })

  if (authError || !authData.user) {
    return { profile: null, error: authError?.message ?? 'Signup failed.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('prospect_profiles')
    .insert({ auth_uid: authData.user.id, email, name })
    .select()
    .single()

  if (profileError) {
    return { profile: null, error: profileError.message }
  }

  return { profile: profile as ProspectProfile, error: null }
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

  const { data: profile } = await supabase
    .from('prospect_profiles')
    .select('*')
    .eq('auth_uid', authData.user.id)
    .single()

  if (!profile) {
    return { profile: null, error: 'No prospect profile found for this account.' }
  }

  return { profile: profile as ProspectProfile, error: null }
}

export async function getProspectProfile(): Promise<ProspectProfile | null> {
  if (!supabaseConfigured || !supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  const { data } = await supabase
    .from('prospect_profiles')
    .select('*')
    .eq('auth_uid', session.user.id)
    .single()
  return (data as ProspectProfile) ?? null
}
