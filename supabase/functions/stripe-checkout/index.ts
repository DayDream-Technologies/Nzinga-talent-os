import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders, errorResponse, getSupabaseAdmin, jsonResponse } from '../shared/auth.ts'
import { StripeError, createCheckoutSession, retrieveCheckoutSession } from '../shared/stripe-api.ts'

interface CheckoutBody {
  action?: 'checkout' | 'status'
  invoiceId?: string
  invoiceIds?: string[]
}

function returnBase(req: Request): string {
  const origin = req.headers.get('origin') || ''
  const app = (Deno.env.get('APP_URL') || 'https://talentmanagerx.com').replace(/\/$/, '')
  if (origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000') return origin
  if (origin === app) return origin
  try {
    const host = new URL(origin).hostname
    if (host === 'talentmanagerx.com' || host.endsWith('.talentmanagerx.com')) return origin
  } catch {
    /* use the configured app url */
  }
  return app
}

serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405, origin)

  let body: CheckoutBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const admin = getSupabaseAdmin()

  if (body.action === 'status') {
    const ids = (body.invoiceIds || []).map((id) => id.trim()).filter(Boolean).slice(0, 50)
    if (!ids.length) return jsonResponse({ invoices: [] }, 200, origin)
    const { data, error } = await admin
      .from('client_invoices')
      .select('id, status, paid_at, last_error, amount_cents, tax_cents')
      .in('id', ids)
    if (error) return errorResponse(error.message, 500, origin)
    return jsonResponse({ invoices: data || [] }, 200, origin)
  }

  const invoiceId = (body.invoiceId || '').trim()
  if (!invoiceId) return errorResponse('invoiceId is required.', 400, origin)

  const secretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!secretKey) return errorResponse('Stripe is not configured. Set STRIPE_SECRET_KEY in Supabase secrets.', 503, origin)

  const { data: invoice, error } = await admin
    .from('client_invoices')
    .select('id, invoice_number, project, amount_cents, tax_cents, status, stripe_checkout_session_id, checkout_url')
    .eq('id', invoiceId)
    .maybeSingle()
  if (error) return errorResponse(error.message, 500, origin)
  if (!invoice) return errorResponse('That invoice is not available to pay.', 404, origin)
  if (invoice.status === 'paid') return jsonResponse({ status: 'paid', invoiceId }, 200, origin)
  if (invoice.status === 'processing') {
    return jsonResponse({ status: 'processing', invoiceId }, 200, origin)
  }

  const dueCents = Number(invoice.amount_cents) + Number(invoice.tax_cents)
  if (!Number.isFinite(dueCents) || dueCents < 50) {
    return errorResponse('This invoice total is too small to charge.', 400, origin)
  }

  if (invoice.stripe_checkout_session_id) {
    const existing = await retrieveCheckoutSession(secretKey, invoice.stripe_checkout_session_id)
    if (existing?.status === 'open' && existing.url) {
      return jsonResponse({ url: existing.url, invoiceId }, 200, origin)
    }
    if (existing?.paymentStatus === 'paid') {
      return jsonResponse({ status: 'paid', invoiceId }, 200, origin)
    }
  }

  const base = returnBase(req)
  try {
    const session = await createCheckoutSession(secretKey, {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number || invoice.id,
      title: invoice.project,
      amountCents: dueCents,
      successUrl: `${base}/client/billing?checkout=success&invoice=${encodeURIComponent(invoice.id)}`,
      cancelUrl: `${base}/client/billing?checkout=cancel&invoice=${encodeURIComponent(invoice.id)}`,
    })
    const { error: saveError } = await admin
      .from('client_invoices')
      .update({
        stripe_checkout_session_id: session.id,
        checkout_url: session.url,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)
    if (saveError) return errorResponse(saveError.message, 500, origin)
    return jsonResponse({ url: session.url, invoiceId }, 200, origin)
  } catch (err) {
    const message = err instanceof StripeError ? err.message : 'Stripe checkout failed.'
    return errorResponse(message, 502, origin)
  }
})
