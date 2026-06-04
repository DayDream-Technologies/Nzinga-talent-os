import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getSupabaseAdmin, corsHeaders, jsonResponse, errorResponse } from '../shared/auth.ts'

/**
 * RingCentral Webhook endpoint.
 * Receives call event notifications (telephony sessions) and:
 * 1. Matches inbound calls to talent records via phone number
 * 2. Creates history entries for inbound calls
 * 3. Updates existing outbound call entries with duration and recording URLs
 *
 * Setup: Create a subscription via RingCentral API pointing to this function's URL.
 * Event filters: /restapi/v1.0/account/~/extension/~/telephony/sessions
 */
serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  // RingCentral sends a validation request when setting up webhooks
  const verificationToken = req.headers.get('Validation-Token')
  if (verificationToken) {
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        'Validation-Token': verificationToken,
      },
    })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin)
  }

  // Verify webhook signature if configured
  const expectedToken = Deno.env.get('RC_WEBHOOK_VERIFICATION_TOKEN')
  if (expectedToken) {
    const providedToken = req.headers.get('Verification-Token')
    if (providedToken && providedToken !== expectedToken) {
      return errorResponse('Invalid verification token', 403, origin)
    }
  }

  let event: Record<string, unknown>
  try {
    event = await req.json()
  } catch {
    return errorResponse('Invalid JSON', 400, origin)
  }

  const supabaseAdmin = getSupabaseAdmin()

  // RingCentral telephony session events
  const body = event.body as Record<string, unknown> | undefined
  if (!body) {
    return jsonResponse({ status: 'ignored', reason: 'no body' }, 200, origin)
  }

  const parties = (body.parties as Array<Record<string, unknown>>) || []

  for (const party of parties) {
    const direction = party.direction as string | undefined
    const status = (party.status as Record<string, string>)?.code
    const from = (party.from as Record<string, string>)?.phoneNumber || ''
    const to = (party.to as Record<string, string>)?.phoneNumber || ''
    const sessionId = body.telephonySessionId as string || body.sessionId as string || ''
    const duration = party.duration as number | undefined

    // Only process completed calls or recordings
    if (status !== 'Disconnected' && status !== 'Completed') continue

    const phoneToMatch = direction === 'Inbound' ? from : to

    // Try to match the phone number to a talent
    if (phoneToMatch) {
      const { data: matchedTalents } = await supabaseAdmin
        .from('talents')
        .select('id, name, phone')
        .or(`phone.eq.${phoneToMatch},phone.eq.${phoneToMatch.replace(/^\+1/, '')}`)
        .limit(1)

      const talentId = matchedTalents?.[0]?.id || null

      if (direction === 'Inbound' && talentId) {
        // Find which user received the call
        const toNumber = to
        const { data: rcUser } = await supabaseAdmin
          .from('user_rc_tokens')
          .select('user_id')
          .eq('rc_phone_number', toNumber)
          .single()

        // Look up the app-level user id
        let staffUserId: string | null = null
        if (rcUser) {
          const { data: userRow } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('auth_uid', rcUser.user_id)
            .single()
          staffUserId = userRow?.id || null
        }

        // Create inbound call history entry
        await supabaseAdmin.from('history').insert({
          id: `call_in_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          talent_id: talentId,
          user_id: staffUserId,
          type: 'call',
          text: `Inbound call from ${from}${duration ? ` (${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')})` : ''}`,
          ts: new Date().toISOString(),
          flagged: false,
          is_document: false,
          call_direction: 'inbound',
          call_duration_seconds: duration || null,
        })
      }

      // Update existing outbound call entries with duration
      if (direction === 'Outbound' && talentId && duration) {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data: recentCalls } = await supabaseAdmin
          .from('history')
          .select('id')
          .eq('talent_id', talentId)
          .eq('type', 'call')
          .eq('call_direction', 'outbound')
          .is('call_duration_seconds', null)
          .gte('ts', fiveMinAgo)
          .order('ts', { ascending: false })
          .limit(1)

        if (recentCalls?.[0]) {
          await supabaseAdmin.from('history').update({
            call_duration_seconds: duration,
          }).eq('id', recentCalls[0].id)
        }
      }
    }

    // Handle recording availability (separate event type sometimes)
    const recordings = (party.recordings as Array<Record<string, unknown>>) || []
    for (const recording of recordings) {
      const recordingUrl = recording.contentUri as string
      if (!recordingUrl) continue

      // Find the most recent matching call entry and add the recording URL
      if (phoneToMatch) {
        const { data: matchedTalents } = await supabaseAdmin
          .from('talents')
          .select('id')
          .or(`phone.eq.${phoneToMatch},phone.eq.${phoneToMatch.replace(/^\+1/, '')}`)
          .limit(1)

        const talentId = matchedTalents?.[0]?.id
        if (talentId) {
          const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
          const { data: recentCalls } = await supabaseAdmin
            .from('history')
            .select('id')
            .eq('talent_id', talentId)
            .eq('type', 'call')
            .is('call_recording_url', null)
            .gte('ts', tenMinAgo)
            .order('ts', { ascending: false })
            .limit(1)

          if (recentCalls?.[0]) {
            await supabaseAdmin.from('history').update({
              call_recording_url: recordingUrl,
            }).eq('id', recentCalls[0].id)
          }
        }
      }
    }
  }

  return jsonResponse({ status: 'processed' }, 200, origin)
})
