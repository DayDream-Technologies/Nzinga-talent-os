import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getSupabaseAdmin, jsonResponse } from '../shared/auth.ts'
import { shouldApplyPaymentStatus, stripeUpdateFromEvent, verifyStripeSignature } from '../shared/stripe-protocol.ts'

serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!secret) return jsonResponse({ error: 'Webhook secret is not configured.' }, 503)

  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature') || ''
  const valid = await verifyStripeSignature(secret, signature, rawBody)
  if (!valid) return jsonResponse({ error: 'Invalid signature.' }, 401)

  let payload: { id?: string; type?: string; data?: { object?: unknown } }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'Invalid JSON.' }, 400)
  }

  const eventId = payload.id || ''
  const type = payload.type || ''
  if (!eventId || !type) return jsonResponse({ error: 'Missing event id.' }, 400)

  const admin = getSupabaseAdmin()
  const { error: insertError } = await admin.from('stripe_webhook_events').insert({
    event_id: eventId,
    event_type: type,
  })
  if (insertError) {
    if (insertError.code === '23505') return jsonResponse({ ok: true, duplicate: true })
    console.error('[stripe-webhook] event insert', insertError.message)
    return jsonResponse({ error: 'Could not record the event.' }, 500)
  }

  const update = stripeUpdateFromEvent(type, payload.data?.object)
  if (!update) return jsonResponse({ ok: true, ignored: true })

  let query = admin
    .from('client_invoices')
    .select('id, status, client_name, talent_name, project, amount_cents, tax_cents, stripe_payment_intent_id')
  query = update.invoiceId
    ? query.eq('id', update.invoiceId)
    : query.eq('stripe_payment_intent_id', update.paymentIntentId || '')
  const { data: rows, error: readError } = await query.limit(1)
  if (readError) return jsonResponse({ error: readError.message }, 500)
  const invoice = rows?.[0]
  if (!invoice) return jsonResponse({ ok: true, unmatched: true })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (update.paymentIntentId) patch.stripe_payment_intent_id = update.paymentIntentId
  if (update.checkoutSessionId) patch.stripe_checkout_session_id = update.checkoutSessionId
  if (update.error) patch.last_error = update.error

  if (shouldApplyPaymentStatus(invoice.status, update.status)) {
    patch.status = update.status
    if (update.status === 'paid') {
      patch.paid_at = new Date().toISOString()
      patch.last_error = null
    }
  }

  const { error: updateError } = await admin.from('client_invoices').update(patch).eq('id', invoice.id)
  if (updateError) return jsonResponse({ error: updateError.message }, 500)

  if (update.status === 'paid' && invoice.status !== 'paid') {
    const dollars = (Number(invoice.amount_cents) + Number(invoice.tax_cents)) / 100
    await admin.from('escrow_receipts').upsert({
      invoice_id: invoice.id,
      client_name: invoice.client_name,
      talent_name: invoice.talent_name,
      project: invoice.project,
      amount: dollars,
      stripe_payment_intent_id: update.paymentIntentId || invoice.stripe_payment_intent_id,
      received_at: new Date().toISOString(),
    }, { onConflict: 'invoice_id' })
  }

  return jsonResponse({ ok: true, status: patch.status || invoice.status })
})
