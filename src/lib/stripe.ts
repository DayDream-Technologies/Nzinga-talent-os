import { invokeEdgeFunction } from '@/lib/edge-functions'
import { supabase } from '@/lib/supabase'
import type { ClientInvoice } from '@/types/agency'

export interface StripeInvoiceStatus {
  id: string
  status: string
  paid_at: string | null
  last_error: string | null
  amount_cents: number
  tax_cents: number
}

export function invoiceDueCents(amount: number, taxAmount: number): number {
  return Math.round((amount || 0) * 100) + Math.round((taxAmount || 0) * 100)
}

export function startStripeCheckout(invoiceId: string) {
  return invokeEdgeFunction<{ url?: string; status?: string; invoiceId: string }>('stripe-checkout', {
    action: 'checkout',
    invoiceId,
  })
}

export function fetchStripeInvoiceStatus(invoiceIds: string[]) {
  return invokeEdgeFunction<{ invoices: StripeInvoiceStatus[] }>('stripe-checkout', {
    action: 'status',
    invoiceIds,
  })
}

export async function persistClientInvoice(invoice: ClientInvoice): Promise<void> {
  if (!supabase) return
  const due = invoiceDueCents(invoice.amount, invoice.taxAmount)
  if (due < 50) return
  await supabase.from('client_invoices').insert({
    id: invoice.id,
    invoice_number: invoice.invoiceNumber || null,
    client_name: invoice.clientName,
    talent_name: invoice.talentName || null,
    project: invoice.project,
    amount_cents: Math.round((invoice.amount || 0) * 100),
    tax_cents: Math.round((invoice.taxAmount || 0) * 100),
    status: invoice.status === 'paid' ? 'paid' : 'sent',
    due_at: invoice.dueAt || null,
    paid_at: invoice.paidAt ? new Date(invoice.paidAt).toISOString() : null,
  })
}
