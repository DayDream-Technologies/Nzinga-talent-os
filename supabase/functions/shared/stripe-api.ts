export class StripeError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function formBody(fields: Record<string, string>): string {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(fields)) body.set(key, value)
  return body.toString()
}

async function stripe(secretKey: string, path: string, fields?: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: fields ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(fields ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: fields ? formBody(fields) : undefined,
  })
  const json = await res.json().catch(() => ({})) as Record<string, unknown>
  if (!res.ok) {
    const error = json.error && typeof json.error === 'object' ? (json.error as Record<string, unknown>).message : ''
    throw new StripeError(typeof error === 'string' && error ? error : `Stripe returned ${res.status}`, res.status)
  }
  return json
}

export async function createCheckoutSession(
  secretKey: string,
  input: {
    invoiceId: string
    invoiceNumber: string
    title: string
    amountCents: number
    successUrl: string
    cancelUrl: string
  },
): Promise<{ id: string; url: string }> {
  const name = `${input.invoiceNumber} — ${input.title}`.slice(0, 120)
  const json = await stripe(secretKey, '/checkout/sessions', {
    mode: 'payment',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.invoiceId,
    'payment_method_types[0]': 'card',
    'payment_method_types[1]': 'us_bank_account',
    'payment_method_options[us_bank_account][financial_connections][permissions][0]': 'payment_method',
    'payment_method_options[us_bank_account][verification_method]': 'automatic',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(input.amountCents),
    'line_items[0][price_data][product_data][name]': name,
    'metadata[invoice_id]': input.invoiceId,
    'payment_intent_data[metadata][invoice_id]': input.invoiceId,
    'payment_intent_data[metadata][invoice_number]': input.invoiceNumber,
  })
  const id = typeof json.id === 'string' ? json.id : ''
  const url = typeof json.url === 'string' ? json.url : ''
  if (!id || !url) throw new StripeError('Stripe did not return a checkout link.', 502)
  return { id, url }
}

export async function retrieveCheckoutSession(
  secretKey: string,
  sessionId: string,
): Promise<{ url: string; status: string; paymentStatus: string } | null> {
  try {
    const json = await stripe(secretKey, `/checkout/sessions/${encodeURIComponent(sessionId)}`)
    return {
      url: typeof json.url === 'string' ? json.url : '',
      status: typeof json.status === 'string' ? json.status : '',
      paymentStatus: typeof json.payment_status === 'string' ? json.payment_status : '',
    }
  } catch {
    return null
  }
}
