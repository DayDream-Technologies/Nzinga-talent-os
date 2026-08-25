import { describe, expect, it } from 'vitest'
import {
  agentMailto,
  belongingToTalent,
  formatMoney,
  invoiceCommission,
  isTalentPortalPath,
  opportunityStatusLabel,
  trustBalance,
} from '@/lib/talent-portal'
import { INVOICES_SEED, ESCROW_SEED, CALENDAR_EVENTS_SEED } from '@/constants/agency-seed'

describe('talent portal helpers', () => {
  it('keeps staff talent account URLs off the public portal list', () => {
    expect(isTalentPortalPath('/talent/home')).toBe(true)
    expect(isTalentPortalPath('/talent/money')).toBe(true)
    expect(isTalentPortalPath('/talent/NZG-200101')).toBe(false)
  })

  it('splits Maya booking commission', () => {
    const inv = INVOICES_SEED.find((row) => row.id === 'inv_nike_1')!
    const split = invoiceCommission(inv)
    expect(split.commission).toBe(2000)
    expect(split.talentShare).toBe(8000)
    expect(formatMoney(split.talentShare)).toBe('$8,000')
  })

  it('filters calendar and trust funds to Maya', () => {
    const shoots = belongingToTalent(CALENDAR_EVENTS_SEED, 'Maya Rivera', (e) => [e.talentName]).filter(
      (e) => e.type === 'booking',
    )
    expect(shoots).toHaveLength(2)
    expect(trustBalance(ESCROW_SEED, 'Maya Rivera')).toBe(8000)
  })

  it('builds a prefilled agent mailto link', () => {
    const href = agentMailto({
      agentName: 'Sarah Chen',
      agentEmail: 'sarah.chen@nzinga.co',
      talentName: 'Maya Rivera',
    })
    expect(href).toContain('mailto:sarah.chen@nzinga.co')
    expect(href).toContain(encodeURIComponent('Message from Maya Rivera'))
  })

  it('maps ticket statuses for talent-facing opportunity labels', () => {
    expect(opportunityStatusLabel('open')).toBe('Submitted')
    expect(opportunityStatusLabel('in_progress')).toBe('In review')
    expect(opportunityStatusLabel('resolved')).toBe('Confirmed')
  })
})
