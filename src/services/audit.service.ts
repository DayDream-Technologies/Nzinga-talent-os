import { supabase, supabaseConfigured } from '@/lib/supabase'

export {
  queryAuditLog,
  type AuditEntry,
} from './admin.service'

export async function writeAuditEvent(entry: {
  action: string
  entity_type: string
  entity_id?: string | null
  details?: Record<string, unknown>
  user_id?: string | null
}): Promise<{ error: string | null }> {
  if (!supabaseConfigured || !supabase) return { error: null }

  let userId = entry.user_id ?? null
  if (!userId) {
    const { data: auth } = await supabase.auth.getUser()
    if (auth.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_uid', auth.user.id)
        .maybeSingle()
      userId = profile?.id ?? null
    }
  }

  const { error } = await supabase.from('audit_log').insert({
    user_id: userId,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    details: entry.details ?? {},
  })

  return { error: error?.message ?? null }
}
