import { describe, expect, it } from 'vitest'
import { canSubmitClientPacket, clientPacketSubmitBlockers } from '@/lib/client-packet'

const complete = {
  pillar_rationales: ['a', 'b', 'c', 'd', 'e'],
  pillar_scores: [3, 3, 3, 4, 5],
  jordan_score: 3.6,
  revenue_path: 'Brand deals',
  scout_summary: 'Strong fit',
  niches: ['Modeling'],
  discovery_call_notes: 'Ready, responsive, no conflicts.',
  uploaded_docs: { gov_id: { name: 'id.pdf', data: 'data:application/pdf;base64,x', type: 'application/pdf' } },
}

describe('client packet submit gate', () => {
  it('blocks submit without discovery notes or government ID', () => {
    expect(clientPacketSubmitBlockers({ ...complete, discovery_call_notes: '' })).toContain('Discovery Call notes')
    expect(clientPacketSubmitBlockers({ ...complete, uploaded_docs: {} })).toContain('Government-issued ID')
    expect(canSubmitClientPacket({ ...complete, jordan_score: 3.2 })).toBe(false)
  })

  it('allows submit when Jordan Score, discovery notes, and gov ID are complete', () => {
    expect(clientPacketSubmitBlockers(complete)).toEqual([])
    expect(canSubmitClientPacket(complete)).toBe(true)
  })
})
