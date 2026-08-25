import { describe, expect, it } from 'vitest'
import {
  agentMailto,
  belongingToTalent,
  formatCallTime,
  formatMoney,
  invoiceCommission,
  isTalentOpportunity,
  isTalentPortalPath,
  opportunityDecisionPatch,
  opportunityStatusLabel,
  paidEarningsForYear,
  trustBalance,
  usageRightsTimeline,
  yearEnd1099Csv,
} from '@/lib/talent-portal'
import { INVOICES_SEED, ESCROW_SEED, CALENDAR_EVENTS_SEED, SUPPORT_TICKETS_SEED, AGENCY_TALENT_SEED } from '@/constants/agency-seed'

describe('talent portal helpers', () => {
  it('keeps staff talent account URLs off the public portal list', () => {
    expect(isTalentPortalPath('/talent/home')).toBe(true)
    expect(isTalentPortalPath('/talent/money')).toBe(true)
    expect(isTalentPortalPath('/talent/settings')).toBe(true)
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

  it('patches staff tickets when talent confirms or declines an opportunity', () => {
    const ticket = SUPPORT_TICKETS_SEED.find((row) => row.id === 'tkt_1')!
    expect(isTalentOpportunity(ticket)).toBe(true)
    const confirmed = opportunityDecisionPatch(ticket, 'confirm', '2026-08-24T15:00:00Z')
    expect(confirmed.status).toBe('resolved')
    expect(confirmed.talentDecision).toBe('confirmed')
    expect(confirmed.body).toContain('Talent confirmed on 2026-08-24')
    const declined = opportunityDecisionPatch(ticket, 'decline', '2026-08-24T15:00:00Z')
    expect(declined.status).toBe('closed')
    expect(declined.talentDecision).toBe('declined')
  })

  it('builds a usage-rights timeline from contracts, buyouts, and roster notes', () => {
    const maya = AGENCY_TALENT_SEED.find((row) => row.id === 'talent_maya')!
    const items = usageRightsTimeline({
      name: 'Maya Rivera',
      tickets: SUPPORT_TICKETS_SEED,
      invoices: INVOICES_SEED,
      usageRights: maya.udf?.usageRights,
    })
    expect(items.some((row) => row.id === 'tkt_3')).toBe(true)
    expect(items.some((row) => row.id === 'inv_nike_4')).toBe(true)
    expect(items.some((row) => row.source === 'roster')).toBe(true)
  })

  it('exports paid invoice talent share for a 1099 year', () => {
    const rows = paidEarningsForYear(INVOICES_SEED, 'Maya Rivera', '2026')
    expect(rows.map((row) => row.id)).toEqual(['inv_maya_paid'])
    const csv = yearEnd1099Csv(INVOICES_SEED, 'Maya Rivera', '2026')
    expect(csv).toContain('Spring Lookbook Day Rate')
    expect(csv).toContain('2800')
    expect(formatCallTime('07:00')).toBe('7:00 AM')
    expect(CALENDAR_EVENTS_SEED.find((row) => row.id === 'cal_2')?.callTime).toBe('07:00')
  })
})
