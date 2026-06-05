import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getSupabaseAdmin, corsHeaders, jsonResponse, errorResponse } from '../shared/auth.ts'
import { phonesMatch } from '../shared/phone.ts'

/**
 * RingCentral Webhook endpoint.
 * Receives call event notifications (telephony sessions) and:
 * 1. Matches inbound calls to talent records via phone number
 * 2. Creates history entries for inbound calls
 * 3. Updates existing outbound call entries with duration and recording URLs
 */
serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

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

  const body = event.body as Record<string, unknown> | undefined
  if (!body) {
    return jsonResponse({ status: 'ignored', reason: 'no body' }, 200, origin)
  }

  const parties = (body.parties as Array<Record<string, unknown>>) || []

  async function findTalentByPhone(phone: string) {
    if (!phone) return null
    const { data: talents } = await supabaseAdmin
      .from('talents')
      .select('id, name, phone')
      .not('phone', 'is', null)
      .neq('phone', '')

    return talents?.find((t) => phonesMatch(t.phone, phone)) || null
  }

  for (const party of parties) {
    const direction = party.direction as string | undefined
    const status = (party.status as Record<string, string>)?.code
    const from = (party.from as Record<string, string>)?.phoneNumber || ''
    const to = (party.to as Record<string, string>)?.phoneNumber || ''
    const duration = party.duration as number | undefined

    if (status !== 'Disconnected' && status !== 'Completed') continue

    const phoneToMatch = direction === 'Inbound' ? from : to
    const matchedTalent = await findTalentByPhone(phoneToMatch)
    const talentId = matchedTalent?.id || null

    if (direction === 'Inbound' && talentId) {
      const toNumber = to
      const { data: rcUsers } = await supabaseAdmin
        .from('user_rc_tokens')
        .select('auth_uid, rc_phone_number')

      const rcUser = rcUsers?.find((r) => r.rc_phone_number && phonesMatch(r.rc_phone_number, toNumber))

      let staffUserId: string | null = null
      if (rcUser) {
        const { data: userRow } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('auth_uid', rcUser.auth_uid)
          .single()
        staffUserId = userRow?.id || null
      }

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

    const recordings = (party.recordings as Array<Record<string, unknown>>) || []
    for (const recording of recordings) {
      const recordingUrl = recording.contentUri as string
      if (!recordingUrl) continue

      const talentForRecording = await findTalentByPhone(phoneToMatch)
      if (talentForRecording?.id) {
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        const { data: recentCalls } = await supabaseAdmin
          .from('history')
          .select('id')
          .eq('talent_id', talentForRecording.id)
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

  return jsonResponse({ status: 'processed' }, 200, origin)
})
