import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { authenticateRequest, getSupabaseAdmin, corsHeaders, jsonResponse, errorResponse } from '../shared/auth.ts'

async function getValidTokenRow(authUid: string, serverUrl: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: tokenRow, error: tokenErr } = await supabaseAdmin
    .from('user_rc_tokens')
    .select('*')
    .eq('auth_uid', authUid)
    .single()

  if (tokenErr || !tokenRow) return { error: 'RingCentral not connected. Go to Settings to link your account.' }

  if (new Date(tokenRow.token_expires_at) < new Date()) {
    const clientId = Deno.env.get('RC_CLIENT_ID')!
    const clientSecret = Deno.env.get('RC_CLIENT_SECRET')!
    const credentials = btoa(`${clientId}:${clientSecret}`)

    const refreshRes = await fetch(`${serverUrl}/restapi/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenRow.refresh_token,
      }),
    })

    if (!refreshRes.ok) {
      return { error: 'RC token expired — please reconnect in Settings' }
    }

    const newTokens = await refreshRes.json()
    tokenRow.access_token = newTokens.access_token
    tokenRow.refresh_token = newTokens.refresh_token
    tokenRow.token_expires_at = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

    await supabaseAdmin.from('user_rc_tokens').update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      token_expires_at: tokenRow.token_expires_at,
      updated_at: new Date().toISOString(),
    }).eq('auth_uid', authUid)
  }

  return { tokenRow }
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
  if (!user) return errorResponse('Unauthorized', 401, origin)

  const serverUrl = Deno.env.get('RC_SERVER_URL') || 'https://platform.ringcentral.com'

  let body: { talent_id: string; phone_number: string; message: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const { talent_id, phone_number, message } = body
  if (!talent_id || !phone_number || !message) {
    return errorResponse('talent_id, phone_number, and message are required', 400, origin)
  }

  if (message.length > 1000) {
    return errorResponse('Message exceeds maximum length of 1000 characters', 400, origin)
  }

  const tokenResult = await getValidTokenRow(user.id, serverUrl)
  if ('error' in tokenResult) {
    return errorResponse(tokenResult.error!, 403, origin)
  }

  const tokenRow = tokenResult.tokenRow!
  const fromNumber = tokenRow.rc_phone_number
  if (!fromNumber) {
    return errorResponse('No phone number associated with your RingCentral account', 400, origin)
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const smsRes = await fetch(
      `${serverUrl}/restapi/v1.0/account/~/extension/~/sms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRow.access_token}`,
        },
        body: JSON.stringify({
          from: { phoneNumber: fromNumber },
          to: [{ phoneNumber: phone_number }],
          text: message,
        }),
      },
    )

    if (!smsRes.ok) {
      const errText = await smsRes.text()
      console.error('SMS send error:', smsRes.status, errText)
      return errorResponse('Failed to send SMS', 502, origin)
    }

    const smsData = await smsRes.json()

    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_uid', user.id)
      .single()

    const staffUserId = userRow?.id || null
    const historyId = `sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    await supabaseAdmin.from('history').insert({
      id: historyId,
      talent_id,
      user_id: staffUserId,
      type: 'sms',
      text: `SMS to ${phone_number}: ${message.slice(0, 100)}${message.length > 100 ? '…' : ''}`,
      ts: new Date().toISOString(),
      flagged: false,
      is_document: false,
      sms_direction: 'outbound',
    })

    return jsonResponse({
      status: 'sent',
      message_id: smsData.id,
      history_id: historyId,
    }, 200, origin)
  } catch (err) {
    console.error('SMS request failed:', err)
    return errorResponse('SMS service unavailable', 503, origin)
  }
})
