import { describe, expect, it } from 'vitest'
import { mergeDocHubEnvelope } from '@/lib/dochub'
import {
  shouldAdvanceStatus,
  statusFromDocHubEvent,
  verifyDocHubSignature,
} from '../../supabase/functions/shared/dochub-protocol'
import type { ProspectContract } from '@/types/agency'

const contract = (patch: Partial<ProspectContract> = {}): ProspectContract => ({
  id: 'ctr_1',
  title: 'Agreement',
  status: 'pending_signature',
  startDate: '2026-10-01',
  uploadedAt: '2026-10-01T00:00:00.000Z',
  document: { name: 'a.pdf', data: 'data:', type: 'application/pdf' },
  ...patch,
})

describe('DocHub webhook status', () => {
  it('maps terminal document status and ignores pings', () => {
    expect(statusFromDocHubEvent('webhook.ping', {})).toBeNull()
    expect(statusFromDocHubEvent('signer.finalized', {})).toBe('signed')
    expect(statusFromDocHubEvent('document.status_changed', { sign_request: { status: 'FINALIZED' } })).toBe('completed')
    expect(statusFromDocHubEvent('document.status_changed', { sign_request: { status: 'EXPIRED' } })).toBe('expired')
    expect(shouldAdvanceStatus('sent', 'signed')).toBe(true)
    expect(shouldAdvanceStatus('completed', 'sent')).toBe(false)
  })

  it('accepts a DocHub HMAC signature', async () => {
    const secret = 'test-secret'
    const timestamp = '1712667600'
    const rawBody = '{"type":"webhook.ping","id":"evt_1"}'
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`))
    const digest = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
    const ok = await verifyDocHubSignature(secret, timestamp, rawBody, `dochub_v1=${digest}`, 1712667600)
    expect(ok).toBe(true)
    const bad = await verifyDocHubSignature(secret, timestamp, rawBody, 'dochub_v1=00', 1712667600)
    expect(bad).toBe(false)
  })
})

describe('mergeDocHubEnvelope', () => {
  it('marks the signed agreement current and the previous one past', () => {
    const next = mergeDocHubEnvelope(
      [contract({ id: 'old', status: 'current' }), contract()],
      {
        contract_id: 'ctr_1',
        status: 'completed',
        document_id: 'doc_1',
        document_url: 'https://dochub.com/d/doc_1',
        expires_at: null,
        signer_name: 'Maya',
      },
    )
    expect(next.find((c) => c.id === 'old')?.status).toBe('past')
    expect(next.find((c) => c.id === 'ctr_1')).toMatchObject({
      status: 'current',
      dochubStatus: 'completed',
      dochubUrl: 'https://dochub.com/d/doc_1',
      signedName: 'Maya',
    })
  })
})
