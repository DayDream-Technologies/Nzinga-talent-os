import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { authenticateRequest, getSupabaseAdmin, corsHeaders, jsonResponse, errorResponse } from '../shared/auth.ts'

interface SendEmailRequest {
  to: string
  to_name?: string
  subject: string
  html_body?: string
  text_body?: string
  reply_to?: string
  from_name?: string
}

/**
 * Sends an email via Resend (or another provider by swapping sendViaProvider).
 * From address is always the platform domain (hello@talentmanagerx.com).
 * Reply-To and display name are configurable per org/message.
 */
async function sendViaResend(params: {
  apiKey: string
  from: string
  to: string
  subject: string
  html?: string
  text?: string
  replyTo?: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const body: Record<string, unknown> = {
    from: params.from,
    to: [params.to],
    subject: params.subject,
  }
  if (params.html) body.html = params.html
  else if (params.text) body.text = params.text
  if (params.replyTo) body.reply_to = params.replyTo

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.text()
    console.error('[send-email] provider error:', res.status, errBody)
    let detail = 'Email delivery failed'
    try {
      const parsed = JSON.parse(errBody)
      if (parsed?.message) detail = parsed.message
      else if (parsed?.error) detail = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error)
    } catch {
      if (errBody) detail = errBody.slice(0, 300)
    }
    return { ok: false, error: detail }
  }

  const result = await res.json()
  return { ok: true, id: result.id }
}

serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin)
  }

  const user = await authenticateRequest(req)
  if (!user) {
    return errorResponse('Unauthorized', 401, origin)
  }

  // Verify caller is a staff user (not a prospect)
  const supabaseAdmin = getSupabaseAdmin()
  const { data: staffUser } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, company_code')
    .eq('auth_uid', user.id)
    .single()

  if (!staffUser) {
    return errorResponse('Only staff users can send emails', 403, origin)
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  const defaultFromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || 'hello@talentmanagerx.com'
  const defaultFromName = Deno.env.get('EMAIL_FROM_NAME') || 'Nzinga Talent Group'

  if (!apiKey) {
    return errorResponse('Email service is not configured. Set RESEND_API_KEY in Supabase secrets.', 503, origin)
  }

  let body: SendEmailRequest
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const { to, to_name, subject, html_body, text_body, reply_to, from_name } = body

  if (!to || !subject) {
    return errorResponse('to and subject are required', 400, origin)
  }

  if (!html_body && !text_body) {
    return errorResponse('html_body or text_body is required', 400, origin)
  }

  const displayName = from_name || defaultFromName
  const fromField = `${displayName} <${defaultFromAddress}>`
  const replyTo = reply_to || staffUser.email

  const result = await sendViaResend({
    apiKey,
    from: fromField,
    to: to_name ? `${to_name} <${to}>` : to,
    subject,
    html: html_body,
    text: text_body,
    replyTo,
  })

  if (!result.ok) {
    return errorResponse(result.error || 'Email delivery failed', 502, origin)
  }

  // Log the sent email for audit/activity feed
  try {
    await supabaseAdmin.from('sent_emails').insert({
      sender_user_id: staffUser.id,
      sender_name: staffUser.name,
      sender_email: staffUser.email,
      from_display: fromField,
      reply_to: replyTo,
      to_email: to,
      to_name: to_name || null,
      subject,
      provider_id: result.id || null,
      company_code: staffUser.company_code || 'NZG',
    })
  } catch (logErr) {
    console.warn('[send-email] audit log failed (non-fatal):', logErr)
  }

  return jsonResponse({ status: 'sent', provider_id: result.id }, 200, origin)
})
