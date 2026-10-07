import { describe, expect, it } from 'vitest'
import { invoiceDueCents } from '@/lib/stripe'
import {
  shouldApplyPaymentStatus,
  stripeUpdateFromEvent,
  verifyStripeSignature,
} from '../../supabase/functions/shared/stripe-protocol'

describe('Stripe invoice totals', () => {
  it('charges subtotal plus tax in cents', () => {
    expect(invoiceDueCents(10000, 888)).toBe(1_088_800)
    expect(invoiceDueCents(2800, 0)).toBe(280_000)
  })
})

describe('Stripe webhook status', () => {
  it('marks a settled payment paid and leaves an ACH processing payment unpaid', () => {
    expect(stripeUpdateFromEvent('payment_intent.succeeded', { metadata: { invoice_id: 'inv_nike_1' }, id: 'pi_1' })).toMatchObject({
      invoiceId: 'inv_nike_1',
      status: 'paid',
    })
    expect(stripeUpdateFromEvent('payment_intent.processing', { metadata: { invoice_id: 'inv_nike_1' }, id: 'pi_1' })?.status).toBe('processing')
    expect(stripeUpdateFromEvent('checkout.session.completed', {
      id: 'cs_1',
      payment_status: 'unpaid',
      payment_intent: 'pi_1',
      metadata: { invoice_id: 'inv_nike_1' },
    })?.status).toBe('processing')
    expect(shouldApplyPaymentStatus('paid', 'failed')).toBe(false)
    expect(shouldApplyPaymentStatus('processing', 'paid')).toBe(true)
  })

  it('accepts a Stripe signature', async () => {
    const secret = 'whsec_test'
    const timestamp = '1712667600'
    const rawBody = '{"id":"evt_1","type":"payment_intent.succeeded"}'
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`))
    const digest = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
    const ok = await verifyStripeSignature(secret, `t=${timestamp},v1=${digest}`, rawBody, 1712667600)
    expect(ok).toBe(true)
    const bad = await verifyStripeSignature(secret, `t=${timestamp},v1=00`, rawBody, 1712667600)
    expect(bad).toBe(false)
  })
})
