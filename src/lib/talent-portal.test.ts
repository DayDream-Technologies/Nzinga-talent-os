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
import type { AgencyTalent, CalendarEvent, ClientInvoice, EscrowDeposit, SupportTicket } from '@/types/agency'

const invoices: ClientInvoice[] = [
  {
    id: 'inv_shoot',
    clientId: 'client_1',
    clientName: 'Northwind',
    talentName: 'Maya Rivera',
    project: 'Commercial Shoot',
    amount: 10000,
    commissionPct: 20,
    status: 'sent',
    issuedAt: '2026-08-14',
    dueAt: '2026-09-13',
    interestApplied: 0,
    taxId: '13-1234567',
    taxRatePct: 0,
    taxAmount: 0,
    document: null,
  },
  {
    id: 'inv_usage',
    clientId: 'client_1',
    clientName: 'Northwind',
    talentName: 'Maya Rivera',
    project: 'Usage Buyout — Social Cutdowns',
    amount: 2800,
    commissionPct: 20,
    status: 'sent',
    issuedAt: '2026-08-12',
    dueAt: '2026-09-11',
    interestApplied: 0,
    taxId: '13-1234567',
    taxRatePct: 0,
    taxAmount: 0,
    invoiceNumber: 'INV-2026-004',
    document: null,
  },
  {
    id: 'inv_paid',
    clientId: 'client_1',
    clientName: 'Northwind',
    talentName: 'Maya Rivera',
    project: 'Spring Lookbook Day Rate',
    amount: 3500,
    commissionPct: 20,
    status: 'paid',
    issuedAt: '2026-06-02',
    dueAt: '2026-07-02',
    paidAt: '2026-06-28',
    interestApplied: 0,
    taxId: '13-1234567',
    taxRatePct: 0,
    taxAmount: 0,
    document: null,
  },
]

const calendar: CalendarEvent[] = [
  {
    id: 'cal_1',
    title: 'Shoot day 1',
    date: '2026-08-12',
    talentName: 'Maya Rivera',
    type: 'booking',
    callTime: '07:00',
  },
  {
    id: 'cal_2',
    title: 'Shoot day 2',
    date: '2026-08-13',
    talentName: 'Maya Rivera',
    type: 'booking',
    callTime: '07:00',
  },
]

const escrow: EscrowDeposit[] = [
  {
    id: 'esc_1',
    clientName: 'Northwind',
    talentName: 'Maya Rivera',
    project: 'Commercial Shoot',
    amount: 8000,
    receivedAt: '2026-08-14',
    status: 'pending',
    notes: '',
  },
]

const tickets: SupportTicket[] = [
  {
    id: 'tkt_1',
    subject: 'Confirm availability',
    clientId: 'client_1',
    clientName: 'Northwind',
    talentName: 'Maya Rivera',
    status: 'open',
    type: 'availability',
    priority: 'high',
    createdAt: '2026-08-05T08:15:00Z',
    dueDate: '2026-08-08',
    body: 'Need a yes or no.',
    assignee: 'Agent',
  },
  {
    id: 'tkt_3',
    subject: 'Usage rights clarification',
    clientId: 'client_1',
    clientName: 'Northwind',
    talentName: 'Maya Rivera',
    status: 'open',
    type: 'contract',
    priority: 'high',
    createdAt: '2026-08-06T15:30:00Z',
    dueDate: '2026-08-10',
    body: 'Confirm territory.',
    assignee: 'Agent',
  },
]

const roster = {
  id: 'talent_maya',
  udf: { usageRights: 'North America, 1 year from first use.' },
} as AgencyTalent

describe('talent portal helpers', () => {
  it('keeps staff talent account URLs off the public portal list', () => {
    expect(isTalentPortalPath('/talent/home')).toBe(true)
    expect(isTalentPortalPath('/talent/money')).toBe(true)
    expect(isTalentPortalPath('/talent/settings')).toBe(true)
    expect(isTalentPortalPath('/talent/NZG-200101')).toBe(false)
  })

  it('splits a booking commission', () => {
    const split = invoiceCommission(invoices[0])
    expect(split.commission).toBe(2000)
    expect(split.talentShare).toBe(8000)
    expect(formatMoney(split.talentShare)).toBe('$8,000')
  })

  it('filters calendar and trust funds to one talent', () => {
    const shoots = belongingToTalent(calendar, 'Maya Rivera', (e) => [e.talentName]).filter(
      (e) => e.type === 'booking',
    )
    expect(shoots).toHaveLength(2)
    expect(trustBalance(escrow, 'Maya Rivera')).toBe(8000)
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
    const ticket = tickets[0]
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
    const items = usageRightsTimeline({
      name: 'Maya Rivera',
      tickets,
      invoices,
      usageRights: roster.udf?.usageRights,
    })
    expect(items.some((row) => row.id === 'tkt_3')).toBe(true)
    expect(items.some((row) => row.id === 'inv_usage')).toBe(true)
    expect(items.some((row) => row.source === 'roster')).toBe(true)
  })

  it('exports paid invoice talent share for a 1099 year', () => {
    const rows = paidEarningsForYear(invoices, 'Maya Rivera', '2026')
    expect(rows.map((row) => row.id)).toEqual(['inv_paid'])
    const csv = yearEnd1099Csv(invoices, 'Maya Rivera', '2026')
    expect(csv).toContain('Spring Lookbook Day Rate')
    expect(csv).toContain('2800')
    expect(formatCallTime('07:00')).toBe('7:00 AM')
    expect(calendar.find((row) => row.id === 'cal_2')?.callTime).toBe('07:00')
  })
})
