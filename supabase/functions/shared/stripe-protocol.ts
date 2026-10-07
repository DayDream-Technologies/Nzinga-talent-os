export type StripePaymentStatus = 'processing' | 'paid' | 'failed'

export interface StripePaymentUpdate {
  invoiceId: string
  status: StripePaymentStatus
  paymentIntentId?: string
  checkoutSessionId?: string
  error?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function idOf(value: unknown): string {
  if (typeof value === 'string') return value
  return text(asRecord(value)?.id)
}

function metadataInvoiceId(object: Record<string, unknown>): string {
  const metadata = asRecord(object.metadata)
  return text(metadata?.invoice_id)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

/** Stripe signs `timestamp + "." + rawBody` and sends `t=...,v1=hex`. */
export async function verifyStripeSignature(
  secret: string,
  header: string,
  rawBody: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  skewSeconds = 300,
): Promise<boolean> {
  if (!secret || !header) return false
  const parts = header.split(',').map((part) => part.trim())
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) || ''
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3))
  const ts = Number(timestamp)
  if (!timestamp || !Number.isFinite(ts) || Math.abs(nowSeconds - ts) > skewSeconds || signatures.length === 0) {
    return false
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`))
  const digest = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return signatures.some((signature) => timingSafeEqual(signature, digest))
}

export function shouldApplyPaymentStatus(current: string, next: StripePaymentStatus): boolean {
  if (current === 'paid') return false
  if (current === next) return false
  if (current === 'processing' && next === 'processing') return false
  return true
}

/** Map a Stripe event object onto an invoice update. Null means ignore. */
export function stripeUpdateFromEvent(type: string, object: unknown): StripePaymentUpdate | null {
  const row = asRecord(object)
  if (!row) return null
  const invoiceId = metadataInvoiceId(row)
  const paymentIntentId = idOf(row.payment_intent) || (type.startsWith('payment_intent.') ? text(row.id) : '')
  const checkoutSessionId = type.startsWith('checkout.session.') ? text(row.id) : ''
  const error = text(asRecord(row.last_payment_error)?.message) || text(row.failure_message)

  if (type === 'payment_intent.succeeded' || type === 'invoice.paid' || type === 'checkout.session.async_payment_succeeded') {
    if (!invoiceId) return null
    return { invoiceId, status: 'paid', paymentIntentId: paymentIntentId || undefined, checkoutSessionId: checkoutSessionId || undefined }
  }

  if (type === 'checkout.session.completed') {
    if (!invoiceId) return null
    const paymentStatus = text(row.payment_status)
    if (paymentStatus === 'paid') {
      return { invoiceId, status: 'paid', paymentIntentId: paymentIntentId || undefined, checkoutSessionId: checkoutSessionId || undefined }
    }
    return { invoiceId, status: 'processing', paymentIntentId: paymentIntentId || undefined, checkoutSessionId: checkoutSessionId || undefined }
  }

  if (type === 'payment_intent.processing') {
    if (!invoiceId) return null
    return { invoiceId, status: 'processing', paymentIntentId: paymentIntentId || undefined }
  }

  if (
    type === 'payment_intent.payment_failed' ||
    type === 'charge.failed' ||
    type === 'checkout.session.async_payment_failed'
  ) {
    if (!invoiceId && !paymentIntentId) return null
    return {
      invoiceId,
      status: 'failed',
      paymentIntentId: paymentIntentId || undefined,
      checkoutSessionId: checkoutSessionId || undefined,
      error: error || 'Payment failed',
    }
  }

  return null
}
