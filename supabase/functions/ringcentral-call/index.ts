import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { authenticateRequest, getSupabaseAdmin, corsHeaders, jsonResponse, errorResponse } from '../shared/auth.ts'

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

  let body: { talent_id: string; phone_number: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const { talent_id, phone_number } = body
  if (!talent_id || !phone_number) {
    return errorResponse('talent_id and phone_number are required', 400, origin)
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Look up user's stored RC tokens
  const { data: tokenRow, error: tokenErr } = await supabaseAdmin
    .from('user_rc_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (tokenErr || !tokenRow) {
    return errorResponse('RingCentral not connected. Go to Settings to link your account.', 403, origin)
  }

  // Check if token is expired and needs refresh
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
      return errorResponse('RC token expired — please reconnect in Settings', 401, origin)
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
    }).eq('user_id', user.id)
  }

  // Initiate RingOut call
  const fromNumber = tokenRow.rc_phone_number
  if (!fromNumber) {
    return errorResponse('No phone number associated with your RingCentral account', 400, origin)
  }

  try {
    const callRes = await fetch(
      `${serverUrl}/restapi/v1.0/account/~/extension/~/ring-out`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRow.access_token}`,
        },
        body: JSON.stringify({
          from: { phoneNumber: fromNumber },
          to: { phoneNumber: phone_number },
          playPrompt: true,
        }),
      },
    )

    if (!callRes.ok) {
      const errText = await callRes.text()
      console.error('RingOut error:', callRes.status, errText)
      return errorResponse('Failed to initiate call', 502, origin)
    }

    const callData = await callRes.json()

    // Log the call to history
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_uid', user.id)
      .single()

    const staffUserId = userRow?.id || null

    await supabaseAdmin.from('history').insert({
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      talent_id,
      user_id: staffUserId,
      type: 'call',
      text: `Outbound call initiated to ${phone_number}`,
      ts: new Date().toISOString(),
      flagged: false,
      is_document: false,
      call_direction: 'outbound',
    })

    return jsonResponse({
      status: 'initiated',
      session_id: callData.id,
    }, 200, origin)
  } catch (err) {
    console.error('RingOut request failed:', err)
    return errorResponse('Call service unavailable', 503, origin)
  }
})
