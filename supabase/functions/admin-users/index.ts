import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import {
  authenticateRequest,
  corsHeaders,
  getSupabaseAdmin,
  jsonResponse,
  errorResponse,
} from '../shared/auth.ts'

interface AdminUsersRequest {
  action: 'update_role' | 'deactivate' | 'reactivate' | 'list'
  user_id?: string
  role?: string
}

async function requireDirector(authUid: string) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .select('id, role, company_code, name')
    .eq('auth_uid', authUid)
    .single()
  if (error || !data || data.role !== 'director') return null
  return data
}

async function writeAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown>,
) {
  const admin = getSupabaseAdmin()
  await admin.from('audit_log').insert({
    user_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  })
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

  let body: AdminUsersRequest
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const admin = getSupabaseAdmin()
  const { action, user_id, role } = body

  if (action === 'list') {
    const { data, error } = await admin
      .from('users')
      .select('id, name, email, role, title, color, initials, company_code, active, created_at')
      .eq('company_code', director.company_code)
      .order('name')
    if (error) return errorResponse(error.message, 500, origin)
    return jsonResponse({ users: data ?? [] }, 200, origin)
  }

  if (!user_id) {
    return errorResponse('user_id is required', 400, origin)
  }

  const { data: target, error: targetErr } = await admin
    .from('users')
    .select('id, name, email, role, auth_uid, company_code, active')
    .eq('id', user_id)
    .single()

  if (targetErr || !target) {
    return errorResponse('User not found', 404, origin)
  }

  if (target.company_code !== director.company_code) {
    return errorResponse('Cannot modify users outside your company', 403, origin)
  }

  if (action === 'update_role') {
    if (!role) return errorResponse('role is required', 400, origin)
    const validRoles = [
      'scout',
      'team1_lead',
      'ops_specialist',
      'team2_lead',
      'director',
      'success_manager',
    ]
    if (!validRoles.includes(role)) {
      return errorResponse('Invalid role', 400, origin)
    }
    if (target.id === director.id && role !== 'director') {
      return errorResponse('Cannot demote yourself', 400, origin)
    }

    const { data: updated, error } = await admin
      .from('users')
      .update({ role })
      .eq('id', user_id)
      .select()
      .single()

    if (error) return errorResponse(error.message, 500, origin)

    await writeAudit(director.id, 'role_change', 'user', user_id, {
      previous_role: target.role,
      new_role: role,
      target_name: target.name,
    })

    return jsonResponse({ user: updated }, 200, origin)
  }

  if (action === 'deactivate' || action === 'reactivate') {
    const active = action === 'reactivate'
    if (target.id === director.id && !active) {
      return errorResponse('Cannot deactivate yourself', 400, origin)
    }

    const { data: updated, error } = await admin
      .from('users')
      .update({ active })
      .eq('id', user_id)
      .select()
      .single()

    if (error) return errorResponse(error.message, 500, origin)

    if (target.auth_uid) {
      if (!active) {
        await admin.auth.admin.updateUserById(target.auth_uid, { ban_duration: '876000h' })
      } else {
        await admin.auth.admin.updateUserById(target.auth_uid, { ban_duration: 'none' })
      }
    }

    await writeAudit(director.id, active ? 'user_reactivated' : 'user_deactivated', 'user', user_id, {
      target_name: target.name,
      target_email: target.email,
    })

    return jsonResponse({ user: updated }, 200, origin)
  }

  return errorResponse('Invalid action', 400, origin)
})
