import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import {
  authenticateRequest,
  corsHeaders,
  getSupabaseAdmin,
  jsonResponse,
  errorResponse,
} from '../shared/auth.ts'

interface AdminUsersRequest {
  action:
    | 'update_role'
    | 'deactivate'
    | 'reactivate'
    | 'list'
    | 'list_roles'
    | 'create_role'
    | 'update_role_def'
    | 'delete_role'
  user_id?: string
  role?: string
  slug?: string
  name?: string
  description?: string
  is_system?: boolean
  stage_access?: string[]
  module_paths?: string[]
  permissions?: string[]
  action_stage?: string
}

async function requireAdmin(authUid: string) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .select('id, role, company_code, name')
    .eq('auth_uid', authUid)
    .single()
  if (error || !data) return null
  if (data.role === 'director') return data
  const { data: roleRow } = await admin.from('roles').select('permissions').eq('slug', data.role).maybeSingle()
  const perms = (roleRow?.permissions as string[] | undefined) || []
  if (perms.includes('admin_access')) return data
  return null
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

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return base || 'custom_role'
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

  const director = await requireAdmin(authUser.id)
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

  if (action === 'list_roles') {
    const { data, error } = await admin.from('roles').select('*').order('name')
    if (error) return errorResponse(error.message, 500, origin)
    return jsonResponse({ roles: data ?? [] }, 200, origin)
  }

  if (action === 'create_role') {
    if (!body.name?.trim()) return errorResponse('name is required', 400, origin)
    let slug = (body.slug || slugify(body.name)).trim()
    const { data: clash } = await admin.from('roles').select('slug').eq('slug', slug).maybeSingle()
    if (clash) {
      let n = 2
      while (true) {
        const candidate = `${slug}_${n}`
        const { data: exists } = await admin.from('roles').select('slug').eq('slug', candidate).maybeSingle()
        if (!exists) {
          slug = candidate
          break
        }
        n += 1
      }
    }
    const permissions = (body.permissions || []).filter((p) => p !== 'admin_access')
    const { data, error } = await admin
      .from('roles')
      .insert({
        slug,
        name: body.name.trim(),
        description: body.description || '',
        is_system: false,
        stage_access: body.stage_access || [],
        module_paths: body.module_paths || [],
        permissions,
        action_stage: body.action_stage || 'holding_entry',
      })
      .select()
      .single()
    if (error) return errorResponse(error.message, 500, origin)
    await writeAudit(director.id, 'role_created', 'role', slug, { name: body.name, slug })
    return jsonResponse({ role: data }, 200, origin)
  }

  if (action === 'update_role_def') {
    if (!body.slug) return errorResponse('slug is required', 400, origin)
    const { data: existing, error: existingErr } = await admin.from('roles').select('*').eq('slug', body.slug).single()
    if (existingErr || !existing) return errorResponse('Role not found', 404, origin)
    const permissions = existing.is_system
      ? body.permissions || existing.permissions
      : (body.permissions || existing.permissions || []).filter((p: string) => p !== 'admin_access')
    const { data, error } = await admin
      .from('roles')
      .update({
        name: body.name?.trim() || existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        stage_access: body.stage_access || existing.stage_access,
        module_paths: body.module_paths || existing.module_paths,
        permissions,
        action_stage: body.action_stage || existing.action_stage,
      })
      .eq('slug', body.slug)
      .select()
      .single()
    if (error) return errorResponse(error.message, 500, origin)
    await writeAudit(director.id, 'role_updated', 'role', body.slug, { name: data.name })
    return jsonResponse({ role: data }, 200, origin)
  }

  if (action === 'delete_role') {
    if (!body.slug) return errorResponse('slug is required', 400, origin)
    const { data: existing } = await admin.from('roles').select('*').eq('slug', body.slug).maybeSingle()
    if (!existing) return errorResponse('Role not found', 404, origin)
    if (existing.is_system) return errorResponse('System roles cannot be deleted', 400, origin)
    const { count } = await admin.from('users').select('id', { count: 'exact', head: true }).eq('role', body.slug)
    if ((count || 0) > 0) return errorResponse('Cannot delete a role that is still assigned to users', 400, origin)
    const { error } = await admin.from('roles').delete().eq('slug', body.slug)
    if (error) return errorResponse(error.message, 500, origin)
    await writeAudit(director.id, 'role_deleted', 'role', body.slug, { name: existing.name })
    return jsonResponse({ ok: true }, 200, origin)
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
    const { data: roleRow } = await admin.from('roles').select('slug').eq('slug', role).maybeSingle()
    if (!roleRow) {
      return errorResponse('Invalid role', 400, origin)
    }
    if (target.id === director.id && role !== director.role && director.role === 'director') {
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
