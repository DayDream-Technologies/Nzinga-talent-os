import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { authenticateRequest, getSupabaseAdmin, corsHeaders, jsonResponse, errorResponse } from '../shared/auth.ts'

async function refreshRcTokens(
  tokenRow: Record<string, unknown>,
  authUid: string,
  serverUrl: string,
): Promise<Record<string, unknown> | null> {
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
      refresh_token: tokenRow.refresh_token as string,
    }),
  })

  if (!refreshRes.ok) return null

  const newTokens = await refreshRes.json()
  const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

  const supabaseAdmin = getSupabaseAdmin()
  await supabaseAdmin.from('user_rc_tokens').update({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
    token_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq('auth_uid', authUid)

  return {
    ...tokenRow,
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
    token_expires_at: expiresAt,
  }
}

async function fetchRcPhoneNumber(accessToken: string, serverUrl: string): Promise<string> {
  try {
    const res = await fetch(`${serverUrl}/restapi/v1.0/account/~/extension/~/phone-number`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      const records = (data.records as Array<Record<string, unknown>>) || []
      const primary = records.find((r) => r.primary) || records[0]
      if (primary?.phoneNumber) return String(primary.phoneNumber)
    }
  } catch { /* fall through */ }

  try {
    const extRes = await fetch(`${serverUrl}/restapi/v1.0/account/~/extension/~`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (extRes.ok) {
      const ext = await extRes.json()
      return ext.contact?.businessPhone || ext.contact?.phoneNumber || ''
    }
  } catch { /* non-fatal */ }

  return ''
}

async function createWebhookSubscription(
  accessToken: string,
  serverUrl: string,
): Promise<string | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!supabaseUrl) return null

  const webhookUrl = `${supabaseUrl}/functions/v1/ringcentral-webhook`
  const verificationToken = Deno.env.get('RC_WEBHOOK_VERIFICATION_TOKEN')

  const deliveryMode: Record<string, string> = {
    transportType: 'WebHook',
    address: webhookUrl,
  }
  if (verificationToken) {
    deliveryMode.verificationToken = verificationToken
  }

  try {
    const res = await fetch(`${serverUrl}/restapi/v1.0/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        eventFilters: ['/restapi/v1.0/account/~/extension/~/telephony/sessions'],
        deliveryMode,
      }),
    })

    if (!res.ok) {
      console.error('Webhook subscription failed:', res.status, await res.text())
      return null
    }

    const sub = await res.json()
    return String(sub.id || '')
  } catch (err) {
    console.error('Webhook subscription request failed:', err)
    return null
  }
}

async function deleteWebhookSubscription(
  accessToken: string,
  serverUrl: string,
  subscriptionId: string,
): Promise<void> {
  if (!subscriptionId) return
  try {
    await fetch(`${serverUrl}/restapi/v1.0/subscription/${subscriptionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (err) {
    console.error('Failed to delete webhook subscription:', err)
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined
  const url = new URL(req.url)

  let parsedBody: Record<string, unknown> = {}
  if (req.method === 'POST') {
    try {
      parsedBody = (await req.json()) as Record<string, unknown>
    } catch {
      /* empty or invalid JSON — allowed for some routes */
    }
  }

  let action = url.searchParams.get('action') || 'authorize'
  if (typeof parsedBody.action === 'string' && parsedBody.action) {
    action = parsedBody.action
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  const clientId = Deno.env.get('RC_CLIENT_ID')
  const clientSecret = Deno.env.get('RC_CLIENT_SECRET')
  const serverUrl = Deno.env.get('RC_SERVER_URL') || 'https://platform.ringcentral.com'
  const redirectUri = Deno.env.get('RC_REDIRECT_URI')

  if (!clientId || !clientSecret || !redirectUri) {
    return errorResponse('RingCentral is not configured', 503, origin)
  }

  if (action === 'authorize') {
    const user = await authenticateRequest(req)
    if (!user) return errorResponse('Unauthorized', 401, origin)

    const state = btoa(JSON.stringify({ auth_uid: user.id, ts: Date.now() }))
    const authUrl = `${serverUrl}/restapi/oauth/authorize?` +
      `response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`

    return jsonResponse({ auth_url: authUrl }, 200, origin)
  }

  if (action === 'callback') {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const appUrl = Deno.env.get('APP_URL') || origin || ''

    if (!code || !state) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/settings?rc=error&reason=missing_code` },
      })
    }

    let stateData: { auth_uid: string }
    try {
      stateData = JSON.parse(atob(state))
    } catch {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/settings?rc=error&reason=invalid_state` },
      })
    }

    const credentials = btoa(`${clientId}:${clientSecret}`)
    const tokenRes = await fetch(`${serverUrl}/restapi/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      console.error('RC token exchange failed:', await tokenRes.text())
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/settings?rc=error&reason=token_exchange` },
      })
    }

    const tokens = await tokenRes.json()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    let extensionId = ''
    try {
      const extRes = await fetch(`${serverUrl}/restapi/v1.0/account/~/extension/~`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (extRes.ok) {
        const ext = await extRes.json()
        extensionId = String(ext.id || '')
      }
    } catch { /* non-fatal */ }

    const phoneNumber = await fetchRcPhoneNumber(tokens.access_token, serverUrl)

    const supabaseAdmin = getSupabaseAdmin()

    // Remove stale subscription if reconnecting
    const { data: existingRow } = await supabaseAdmin
      .from('user_rc_tokens')
      .select('rc_subscription_id')
      .eq('auth_uid', stateData.auth_uid)
      .single()

    if (existingRow?.rc_subscription_id) {
      await deleteWebhookSubscription(tokens.access_token, serverUrl, existingRow.rc_subscription_id)
    }

    const subscriptionId = await createWebhookSubscription(tokens.access_token, serverUrl)

    const { error: upsertErr } = await supabaseAdmin.from('user_rc_tokens').upsert({
      auth_uid: stateData.auth_uid,
      rc_account_id: tokens.owner_id || '',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      rc_extension_id: extensionId,
      rc_phone_number: phoneNumber,
      rc_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'auth_uid' })

    if (upsertErr) {
      console.error('Failed to store RC tokens:', upsertErr)
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/settings?rc=error&reason=store_tokens` },
      })
    }

    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/settings?rc=connected` },
    })
  }

  if (action === 'refresh' && req.method === 'POST') {
    const user = await authenticateRequest(req)
    if (!user) return errorResponse('Unauthorized', 401, origin)

    const supabaseAdmin = getSupabaseAdmin()
    const { data: tokenRow, error: fetchErr } = await supabaseAdmin
      .from('user_rc_tokens')
      .select('*')
      .eq('auth_uid', user.id)
      .single()

    if (fetchErr || !tokenRow) {
      return errorResponse('No RingCentral connection found', 404, origin)
    }

    const refreshed = await refreshRcTokens(tokenRow, user.id, serverUrl)
    if (!refreshed) {
      return errorResponse('Token refresh failed — please reconnect', 502, origin)
    }

    return jsonResponse({
      status: 'refreshed',
      expires_at: refreshed.token_expires_at,
    }, 200, origin)
  }

  if (action === 'disconnect' && req.method === 'POST') {
    const user = await authenticateRequest(req)
    if (!user) return errorResponse('Unauthorized', 401, origin)

    const supabaseAdmin = getSupabaseAdmin()
    const { data: tokenRow } = await supabaseAdmin
      .from('user_rc_tokens')
      .select('*')
      .eq('auth_uid', user.id)
      .single()

    if (tokenRow) {
      let accessToken = tokenRow.access_token as string
      if (new Date(tokenRow.token_expires_at as string) < new Date()) {
        const refreshed = await refreshRcTokens(tokenRow, user.id, serverUrl)
        if (refreshed) accessToken = refreshed.access_token as string
      }
      if (tokenRow.rc_subscription_id) {
        await deleteWebhookSubscription(accessToken, serverUrl, tokenRow.rc_subscription_id as string)
      }
    }

    await supabaseAdmin.from('user_rc_tokens').delete().eq('auth_uid', user.id)

    return jsonResponse({ status: 'disconnected' }, 200, origin)
  }

  if (action === 'status') {
    const user = await authenticateRequest(req)
    if (!user) return errorResponse('Unauthorized', 401, origin)

    const supabaseAdmin = getSupabaseAdmin()
    const { data: tokenRow } = await supabaseAdmin
      .from('user_rc_tokens')
      .select('rc_phone_number, token_expires_at, rc_extension_id')
      .eq('auth_uid', user.id)
      .single()

    if (!tokenRow) {
      return jsonResponse({ connected: false }, 200, origin)
    }

    const expired = new Date(tokenRow.token_expires_at) < new Date()
    return jsonResponse({
      connected: true,
      expired,
      phone_number: tokenRow.rc_phone_number,
      extension_id: tokenRow.rc_extension_id,
    }, 200, origin)
  }

  return errorResponse('Invalid action', 400, origin)
})
