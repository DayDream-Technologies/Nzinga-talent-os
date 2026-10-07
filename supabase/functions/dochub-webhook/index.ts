import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getSupabaseAdmin, jsonResponse } from '../shared/auth.ts'
import { envelopeIds, shouldAdvanceStatus, statusFromDocHubEvent, verifyDocHubSignature } from '../shared/dochub-protocol.ts'

serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const secret = Deno.env.get('DOCHUB_WEBHOOK_SECRET')
  if (!secret) return jsonResponse({ error: 'Webhook secret is not configured.' }, 503)

  const rawBody = await req.text()
  const timestamp = req.headers.get('x-dochub-timestamp') || ''
  const signature = req.headers.get('x-dochub-signature-256') || ''
  const valid = await verifyDocHubSignature(secret, timestamp, rawBody, signature)
  if (!valid) return jsonResponse({ error: 'Invalid signature.' }, 401)

  let payload: { type?: string; id?: string; data?: unknown }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'Invalid JSON.' }, 400)
  }

  const type = payload.type || req.headers.get('x-dochub-event') || ''
  const eventId = payload.id || req.headers.get('x-dochub-event-id') || ''
  if (!type || !eventId) return jsonResponse({ error: 'Missing event id.' }, 400)
  if (type === 'webhook.ping') return jsonResponse({ ok: true, ping: true })

  const next = statusFromDocHubEvent(type, payload.data)
  const ids = envelopeIds(payload.data)
  const admin = getSupabaseAdmin()

  const { error: insertError } = await admin.from('dochub_webhook_events').insert({
    event_id: eventId,
    event_type: type,
  })
  if (insertError) {
    if (insertError.code === '23505') return jsonResponse({ ok: true, duplicate: true })
    console.error('[dochub-webhook] event insert', insertError.message)
    return jsonResponse({ error: 'Could not record the event.' }, 500)
  }

  if (!next || (!ids.documentId && !ids.signRequestId)) {
    return jsonResponse({ ok: true, ignored: true })
  }

  let query = admin.from('dochub_envelopes').select('id, status')
  query = ids.signRequestId ? query.eq('sign_request_id', ids.signRequestId) : query.eq('document_id', ids.documentId!)
  const { data: rows, error: readError } = await query.limit(1)
  if (readError) return jsonResponse({ error: readError.message }, 500)
  const row = rows?.[0]
  if (!row) return jsonResponse({ ok: true, unmatched: true })
  if (!shouldAdvanceStatus(row.status, next)) return jsonResponse({ ok: true, unchanged: true })

  const { error: updateError } = await admin
    .from('dochub_envelopes')
    .update({ status: next, last_event_id: eventId, updated_at: new Date().toISOString() })
    .eq('id', row.id)
  if (updateError) return jsonResponse({ error: updateError.message }, 500)
  return jsonResponse({ ok: true, status: next })
})
