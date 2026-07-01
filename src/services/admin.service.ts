import type { Role, User } from '@/types'
import { invokeEdgeFunction } from '@/lib/edge-functions'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { fetchAllUsers } from '@/services/invite.service'

export interface AuditEntry {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  created_at: string
  users?: { name: string; email: string } | null
}

export interface SystemSetting {
  key: string
  value: unknown
  updated_at: string
  updated_by: string | null
}

export interface CompanyCodeRow {
  code: string
  active: boolean
  created_at: string
}

export async function listUsers(companyCode: string): Promise<{ users: User[]; error: string | null }> {
  const edge = await invokeEdgeFunction<{ users: User[] }>('admin-users', { action: 'list' })
  if (edge.ok) return { users: edge.data.users, error: null }

  const fallback = await fetchAllUsers(companyCode)
  return { users: fallback, error: edge.error }
}

export async function updateUserRole(
  userId: string,
  role: Role,
): Promise<{ user: User | null; error: string | null }> {
  const result = await invokeEdgeFunction<{ user: User }>('admin-users', {
    action: 'update_role',
    user_id: userId,
    role,
  })
  if (!result.ok) return { user: null, error: result.error }
  return { user: result.data.user, error: null }
}

export async function setUserActive(
  userId: string,
  active: boolean,
): Promise<{ user: User | null; error: string | null }> {
  const result = await invokeEdgeFunction<{ user: User }>('admin-users', {
    action: active ? 'reactivate' : 'deactivate',
    user_id: userId,
  })
  if (!result.ok) return { user: null, error: result.error }
  return { user: result.data.user, error: null }
}

export async function queryAuditLog(params: {
  event_type?: string
  user_id?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}): Promise<{ entries: AuditEntry[]; total: number; error: string | null }> {
  const result = await invokeEdgeFunction<{ entries: AuditEntry[]; total: number }>('admin-audit', {
    action: 'query',
    ...params,
  })
  if (result.ok) {
    return { entries: result.data.entries, total: result.data.total, error: null }
  }

  if (supabaseConfigured && supabase) {
    const { data, count, error } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1)
    if (!error) {
      return { entries: (data ?? []) as AuditEntry[], total: count ?? 0, error: null }
    }
  }

  return { entries: [], total: 0, error: result.error }
}

export async function getSystemSettings(): Promise<{
  settings: SystemSetting[]
  error: string | null
}> {
  const result = await invokeEdgeFunction<{ settings: SystemSetting[] }>('admin-settings', {
    action: 'get_all',
  })
  if (result.ok) return { settings: result.data.settings, error: null }

  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase.from('system_settings').select('*').order('key')
    if (!error) return { settings: (data ?? []) as SystemSetting[], error: null }
  }

  return {
    settings: [
      { key: 'app_name', value: 'Nzinga Talent OS', updated_at: '', updated_by: null },
      { key: 'demo_mode', value: false, updated_at: '', updated_by: null },
      { key: 'email_sender_name', value: 'Nzinga Talent Group', updated_at: '', updated_by: null },
    ],
    error: result.error,
  }
}

export async function updateSystemSetting(
  key: string,
  value: unknown,
): Promise<{ setting: SystemSetting | null; error: string | null }> {
  const result = await invokeEdgeFunction<{ setting: SystemSetting }>('admin-settings', {
    action: 'update',
    key,
    value,
  })
  if (!result.ok) return { setting: null, error: result.error }
  return { setting: result.data.setting, error: null }
}

export async function listCompanyCodes(): Promise<{
  codes: CompanyCodeRow[]
  error: string | null
}> {
  const result = await invokeEdgeFunction<{ codes: CompanyCodeRow[] }>('admin-settings', {
    action: 'list_company_codes',
  })
  if (result.ok) return { codes: result.data.codes, error: null }

  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase.from('company_codes').select('*').order('code')
    if (!error) return { codes: (data ?? []) as CompanyCodeRow[], error: null }
  }

  return {
    codes: [
      { code: 'NZG', active: true, created_at: '' },
      { code: 'NZINGA', active: true, created_at: '' },
      { code: 'TCG', active: true, created_at: '' },
    ],
    error: result.error,
  }
}

export async function toggleCompanyCode(
  code: string,
  active: boolean,
): Promise<{ error: string | null }> {
  const result = await invokeEdgeFunction('admin-settings', {
    action: 'toggle_company_code',
    code,
    active,
  })
  return { error: result.ok ? null : result.error }
}

export async function addCompanyCode(code: string): Promise<{ error: string | null }> {
  const result = await invokeEdgeFunction('admin-settings', {
    action: 'add_company_code',
    code: code.toUpperCase(),
  })
  return { error: result.ok ? null : result.error }
}
