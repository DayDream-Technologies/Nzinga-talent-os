import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { authenticateRequest, getSupabaseAdmin, corsHeaders, jsonResponse, errorResponse } from '../shared/auth.ts'

serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined
  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'authorize'

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

  // GET: authorize — returns the OAuth URL for the user to visit
  if (action === 'authorize') {
    const user = await authenticateRequest(req)
    if (!user) return errorResponse('Unauthorized', 401, origin)

    const state = btoa(JSON.stringify({ user_id: user.id, ts: Date.now() }))
    const authUrl = `${serverUrl}/restapi/oauth/authorize?` +
      `response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`

    return jsonResponse({ auth_url: authUrl }, 200, origin)
  }

  // GET: callback — exchanges code for tokens (called by RingCentral redirect)
  if (action === 'callback') {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code || !state) {
      return errorResponse('Missing code or state', 400, origin)
    }

    let stateData: { user_id: string }
    try {
      stateData = JSON.parse(atob(state))
    } catch {
      return errorResponse('Invalid state parameter', 400, origin)
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
      const err = await tokenRes.text()
      console.error('RC token exchange failed:', err)
      return errorResponse('Token exchange failed', 502, origin)
    }

    const tokens = await tokenRes.json()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Fetch extension info to get phone number
    let extensionId = ''
    let phoneNumber = ''
    try {
      const extRes = await fetch(`${serverUrl}/restapi/v1.0/account/~/extension/~`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (extRes.ok) {
        const ext = await extRes.json()
        extensionId = String(ext.id || '')
        const directNum = ext.contact?.businessPhone || ext.contact?.phoneNumber || ''
        phoneNumber = directNum
      }
    } catch { /* non-fatal */ }

    const supabaseAdmin = getSupabaseAdmin()
    const { error: upsertErr } = await supabaseAdmin.from('user_rc_tokens').upsert({
      user_id: stateData.user_id,
      rc_account_id: tokens.owner_id || '',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      rc_extension_id: extensionId,
      rc_phone_number: phoneNumber,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (upsertErr) {
      console.error('Failed to store RC tokens:', upsertErr)
      return errorResponse('Failed to store tokens', 500, origin)
    }

    // Redirect user back to app with success indicator
    const appUrl = Deno.env.get('APP_URL') || origin || ''
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/settings?rc=connected` },
    })
  }

  // POST: refresh — refresh an expired token
  if (action === 'refresh' && req.method === 'POST') {
    const user = await authenticateRequest(req)
    if (!user) return errorResponse('Unauthorized', 401, origin)

    const supabaseAdmin = getSupabaseAdmin()
    const { data: tokenRow, error: fetchErr } = await supabaseAdmin
      .from('user_rc_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !tokenRow) {
      return errorResponse('No RingCentral connection found', 404, origin)
    }

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
      return errorResponse('Token refresh failed — please reconnect', 502, origin)
    }

    const newTokens = await refreshRes.json()
    const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

    await supabaseAdmin.from('user_rc_tokens').update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)

    return jsonResponse({ status: 'refreshed', expires_at: expiresAt }, 200, origin)
  }

  // POST: disconnect — remove RC connection
  if (action === 'disconnect' && req.method === 'POST') {
    const user = await authenticateRequest(req)
    if (!user) return errorResponse('Unauthorized', 401, origin)

    const supabaseAdmin = getSupabaseAdmin()
    await supabaseAdmin.from('user_rc_tokens').delete().eq('user_id', user.id)

    return jsonResponse({ status: 'disconnected' }, 200, origin)
  }

  // POST: status — check connection status
  if (action === 'status') {
    const user = await authenticateRequest(req)
    if (!user) return errorResponse('Unauthorized', 401, origin)

    const supabaseAdmin = getSupabaseAdmin()
    const { data: tokenRow } = await supabaseAdmin
      .from('user_rc_tokens')
      .select('rc_phone_number, token_expires_at, rc_extension_id')
      .eq('user_id', user.id)
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
