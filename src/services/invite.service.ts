import type { Role, User } from '@/types'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export interface InvitePayload {
  email: string
  name: string
  role: Role
  title: string
  company_code: string
}

export async function inviteUser(payload: InvitePayload): Promise<{ user: User | null; error: string | null }> {
  if (!supabaseConfigured || !supabase) {
    return { user: null, error: 'Database not configured.' }
  }

  const tempPassword = generateTempPassword()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: tempPassword,
    options: {
      data: { name: payload.name, role: payload.role },
    },
  })

  if (authError) {
    return { user: null, error: authError.message }
  }

  if (!authData.user) {
    return { user: null, error: 'Failed to create auth user.' }
  }

  const initials = payload.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const newUser: Omit<User, 'password'> & { auth_uid: string } = {
    id: `u_${Date.now()}`,
    name: payload.name,
    initials,
    role: payload.role,
    email: payload.email,
    title: payload.title,
    color: roleColor(payload.role),
    auth_uid: authData.user.id,
    company_code: payload.company_code,
  }

  const { data: profile, error: insertError } = await supabase
    .from('users')
    .insert(newUser)
    .select()
    .single()

  if (insertError) {
    return { user: null, error: insertError.message }
  }

  return { user: profile as User, error: null }
}

export async function fetchAllUsers(companyCode: string): Promise<User[]> {
  if (!supabaseConfigured || !supabase) return []
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('company_code', companyCode)
    .order('name')
  return (data ?? []) as User[]
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pw = ''
  for (let i = 0; i < 12; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  return pw
}

function roleColor(role: Role): string {
  const colors: Record<Role, string> = {
    scout: '#7c3aed',
    team1_lead: '#f59e0b',
    ops_specialist: '#3b82f6',
    team2_lead: '#06b6d4',
    director: '#10b981',
    success_manager: '#ec4899',
  }
  return colors[role] ?? '#6b7280'
}
