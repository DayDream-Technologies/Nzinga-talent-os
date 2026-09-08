import { describe, expect, it } from 'vitest'
import { migrateRoleSlug } from '@/lib/migrate-role'
import { splitGross } from '@/lib/commission'
import { historyForMassBlast } from '@/lib/history-ledger'
import { hasScheduleConflict, isWithinAgencyHours, rangesOverlap } from '@/lib/calendar-hours'
import { mapProviderScreeningStatus, screeningAllowsPacketSubmit } from '@/lib/screening'
import { calculateRenewalWindow } from '@/lib/renewal'
import { clientPacketSubmitBlockers } from '@/lib/client-packet'
import { viewportBand, staffGridColumns } from '@/lib/viewport'
import { integrationMessage } from '@/lib/integrations'

describe('migrateRoleSlug', () => {
  it('maps deprecated roles onto the four-role workspace', () => {
    expect(migrateRoleSlug('ops_specialist')).toBe('account_manager')
    expect(migrateRoleSlug('team2_lead')).toBe('account_manager')
    expect(migrateRoleSlug('team1_lead')).toBe('success_manager')
    expect(migrateRoleSlug('scout')).toBe('scout')
  })
})

describe('splitGross', () => {
  it('applies 20/80 on a $10,000 booking', () => {
    const split = splitGross(10000, 20)
    expect(split.agencyCommission).toBe(2000)
    expect(split.talentShare).toBe(8000)
  })
})

describe('historyForMassBlast', () => {
  it('writes one history row per recipient', () => {
    const rows = historyForMassBlast({
      recipients: [
        { email: 'a@x.com', accountNumber: 'NZG-1' },
        { email: 'b@x.com', accountNumber: 'NZG-2' },
      ],
      type: 'email',
      text: 'Hello',
      subject: 'Blast',
    })
    expect(rows).toHaveLength(2)
    expect(rows[0].blast_id).toBe(rows[1].blast_id)
    expect(rows[0].category).toBe('communication')
  })
})

describe('calendar hours', () => {
  it('detects overlaps and weekday hours', () => {
    expect(
      rangesOverlap('2026-09-03T10:00:00', '2026-09-03T11:00:00', '2026-09-03T10:30:00', '2026-09-03T11:30:00'),
    ).toBe(true)
    expect(
      hasScheduleConflict(
        { startsAt: '2026-09-03T10:00:00', endsAt: '2026-09-03T11:00:00' },
        [{ startsAt: '2026-09-03T09:00:00', endsAt: '2026-09-03T09:30:00' }],
      ),
    ).toBe(false)
    const wednesday = '2026-09-02T10:00:00'
    expect(isWithinAgencyHours(wednesday)).toBe(true)
  })
})

describe('screening', () => {
  it('maps provider status and packet gate', () => {
    expect(mapProviderScreeningStatus('Clear')).toBe('cleared')
    expect(screeningAllowsPacketSubmit('cleared')).toBe(true)
    expect(screeningAllowsPacketSubmit('not_started')).toBe(false)
  })
})

describe('renewal window', () => {
  it('rolls a 1-year term from current end', () => {
    const w = calculateRenewalWindow({ currentStart: '2026-08-01', currentEnd: '2027-07-31', term: '1y' })
    expect(w.start).toBe('2027-07-31')
    expect(w.end).toBe('2028-07-31')
  })
})

describe('client packet blockers', () => {
  it('requires screening and recommendation in addition to Jordan/Discovery/ID', () => {
    const blockers = clientPacketSubmitBlockers({
      pillar_rationales: ['a', 'b', 'c', 'd', 'e'],
      pillar_scores: [3, 3, 3, 3, 4],
      jordan_score: 3.5,
      revenue_path: 'path',
      scout_summary: 'summary',
      niches: ['Model'],
      discovery_call_notes: 'notes',
      uploaded_docs: { gov_id: { name: 'id', data: 'x', type: 'image/jpeg' } },
    })
    expect(blockers).toContain('Application review')
    expect(blockers).toContain('Safety screening')
    expect(blockers).toContain('Final Scout Review')
  })
})

describe('viewport bands', () => {
  it('maps 1280 / 768 breakpoints', () => {
    expect(viewportBand(1440)).toBe('desktop')
    expect(viewportBand(1024)).toBe('tablet')
    expect(viewportBand(390)).toBe('mobile')
    expect(staffGridColumns('mobile', '1.1fr 1fr')).toBe('1fr')
    expect(staffGridColumns('tablet', '1fr 1fr 1fr')).toBe('repeat(2, minmax(0, 1fr))')
  })
})

describe('integration coming-soon copy', () => {
  it('keeps repo setup notes off public portals', () => {
    expect(integrationMessage('twilio', 'public')).toMatch(/coming soon/i)
    expect(integrationMessage('twilio', 'public')).not.toMatch(/EXTERNAL_ATTENTION/)
    expect(integrationMessage('dochub', 'staff')).toMatch(/EXTERNAL_ATTENTION/)
    expect(integrationMessage('chase', 'public')).toMatch(/coming soon/i)
  })
})
