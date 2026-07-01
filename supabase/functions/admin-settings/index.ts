import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import {
  authenticateRequest,
  corsHeaders,
  getSupabaseAdmin,
  jsonResponse,
  errorResponse,
} from '../shared/auth.ts'

interface AdminSettingsRequest {
  action: 'get_all' | 'update' | 'list_company_codes' | 'toggle_company_code' | 'add_company_code'
  key?: string
  value?: unknown
  code?: string
  active?: boolean
}

async function requireDirector(authUid: string) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .select('id, role, company_code')
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

  let body: AdminSettingsRequest
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const admin = getSupabaseAdmin()
  const { action } = body

  if (action === 'get_all') {
    const { data, error } = await admin.from('system_settings').select('*').order('key')
    if (error) return errorResponse(error.message, 500, origin)
    return jsonResponse({ settings: data ?? [] }, 200, origin)
  }

  if (action === 'list_company_codes') {
    const { data, error } = await admin.from('company_codes').select('*').order('code')
    if (error) return errorResponse(error.message, 500, origin)
    return jsonResponse({ codes: data ?? [] }, 200, origin)
  }

  if (action === 'add_company_code') {
    if (!body.code) return errorResponse('code is required', 400, origin)
    const code = body.code.toUpperCase().trim()
    const { data, error } = await admin
      .from('company_codes')
      .insert({ code, active: true })
      .select()
      .single()
    if (error) return errorResponse(error.message, 500, origin)
    await writeAudit(director.id, 'company_code_added', 'company_code', code, { code })
    return jsonResponse({ code: data }, 200, origin)
  }

  if (action === 'toggle_company_code') {
    if (!body.code) return errorResponse('code is required', 400, origin)
    const { data, error } = await admin
      .from('company_codes')
      .update({ active: body.active ?? false })
      .eq('code', body.code)
      .select()
      .single()
    if (error) return errorResponse(error.message, 500, origin)
    await writeAudit(director.id, 'company_code_toggled', 'company_code', body.code, {
      active: body.active,
    })
    return jsonResponse({ code: data }, 200, origin)
  }

  if (action === 'update') {
    if (!body.key) return errorResponse('key is required', 400, origin)
    const { data, error } = await admin
      .from('system_settings')
      .upsert({
        key: body.key,
        value: body.value ?? {},
        updated_by: director.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) return errorResponse(error.message, 500, origin)
    await writeAudit(director.id, 'settings_change', 'system_settings', body.key, {
      value: body.value,
    })
    return jsonResponse({ setting: data }, 200, origin)
  }

  return errorResponse('Invalid action', 400, origin)
})
