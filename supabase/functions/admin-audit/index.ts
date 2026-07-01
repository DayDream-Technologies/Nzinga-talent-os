import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import {
  authenticateRequest,
  corsHeaders,
  getSupabaseAdmin,
  jsonResponse,
  errorResponse,
} from '../shared/auth.ts'

interface AdminAuditRequest {
  action: 'query' | 'export'
  event_type?: string
  user_id?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

async function requireDirector(authUid: string) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .select('id, role')
    .eq('auth_uid', authUid)
    .single()
  if (error || !data || data.role !== 'director') return null
  return data
}

serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin)
  }

  const authUser = await authenticateRequest(req)
  if (!authUser) {
    return errorResponse('Unauthorized', 401, origin)
  }

  const director = await requireDirector(authUser.id)
  if (!director) {
    return errorResponse('Forbidden — director access required', 403, origin)
  }

  let body: AdminAuditRequest
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const admin = getSupabaseAdmin()
  const limit = Math.min(body.limit ?? 50, 200)
  const offset = body.offset ?? 0

  let query = admin
    .from('audit_log')
    .select('*, users(name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (body.event_type) query = query.eq('action', body.event_type)
  if (body.user_id) query = query.eq('user_id', body.user_id)
  if (body.from) query = query.gte('created_at', body.from)
  if (body.to) query = query.lte('created_at', body.to)

  const { data, error, count } = await query
  if (error) return errorResponse(error.message, 500, origin)

  if (body.action === 'export') {
    const rows = (data ?? []).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      user: row.users?.name ?? row.user_id,
      details: JSON.stringify(row.details ?? {}),
    }))
    return jsonResponse({ rows, total: count ?? rows.length }, 200, origin)
  }

  return jsonResponse({ entries: data ?? [], total: count ?? 0 }, 200, origin)
})
