import type { User } from '@/types'
import { USERS } from '@/constants/seed-data'
import { COMPANY_CODES } from '@/constants/roles'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export function validateCompanyCode(code: string): boolean {
  return Boolean(COMPANY_CODES[code.toUpperCase()])
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) return null
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    return (profile as User) ?? null
  }
  return USERS.find((u) => u.email === email && u.password === password) ?? null
}

export async function logout(): Promise<void> {
  if (supabaseConfigured && supabase) {
    await supabase.auth.signOut()
  }
}
