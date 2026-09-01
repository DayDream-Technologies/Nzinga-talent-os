import { describe, expect, it } from 'vitest'
import { sanitizeHistoryRows, toHistoryRow } from '@/services/history.service'
import { resolvePipelineTalentId } from '@/lib/resolve-history-talent'
import type { HistoryEntry, Talent } from '@/types'

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'h1',
    talent_id: 'talent_maya',
    user_id: 'auth-uuid',
    type: 'note',
    text: 'Called Maya',
    ts: '2026-08-23T20:14:47.000Z',
    flagged: false,
    is_document: false,
    ...overrides,
  }
}

describe('history persistence sanitization', () => {
  it('maps extra client fields onto known history columns', () => {
    const row = toHistoryRow(
      entry({
        follow_up_needed: true,
        follow_up_date: '2026-08-24',
        method: 'call',
        staff_name: 'Sarah',
        account_number: 'NZG-200101',
      }),
    )
    expect(row.follow_up_needed).toBe(true)
    expect(row.follow_up_date).toBe('2026-08-24')
    expect(row.method).toBe('call')
    expect(row.staff_name).toBe('Sarah')
    expect(row.talent_id).toBe('talent_maya')
    expect(row.account_number).toBe('NZG-200101')
  })

  it('nulls talent_id and user_id that are not in the pipeline tables', () => {
    const cleaned = sanitizeHistoryRows(
      [toHistoryRow(entry())],
      new Set(['t1']),
      new Set(['u1']),
    )
    expect(cleaned[0].talent_id).toBeNull()
    expect(cleaned[0].user_id).toBeNull()
  })

  it('keeps talent_id when the pipeline talent exists', () => {
    const cleaned = sanitizeHistoryRows(
      [toHistoryRow(entry({ talent_id: 't1', user_id: 'u5' }))],
      new Set(['t1']),
      new Set(['u5']),
    )
    expect(cleaned[0].talent_id).toBe('t1')
    expect(cleaned[0].user_id).toBe('u5')
  })

  it('does not treat unverified ids as valid even if extra rows are returned', () => {
    const cleaned = sanitizeHistoryRows(
      [toHistoryRow(entry({ talent_id: 'pros_rico', user_id: 'auth-uuid' }))],
      new Set(['t1', 't2']),
      new Set(['u1']),
    )
    expect(cleaned[0].talent_id).toBeNull()
    expect(cleaned[0].user_id).toBeNull()
  })
})

describe('resolvePipelineTalentId', () => {
  const talents = [
    { id: 't1', email: 'maya@example.com', application_id: 'app_1' },
    { id: 't2', email: 'leo@example.com', application_id: null },
  ] as Talent[]

  it('returns the id when it already belongs to a pipeline talent', () => {
    expect(resolvePipelineTalentId(talents, { id: 't1' })).toBe('t1')
  })

  it('does not use an agency-only id', () => {
    expect(resolvePipelineTalentId(talents, { id: 'talent_maya' })).toBeNull()
  })

  it('matches by application id then email', () => {
    expect(resolvePipelineTalentId(talents, { id: 'pros_1', applicationId: 'app_1' })).toBe('t1')
    expect(
      resolvePipelineTalentId(talents, { id: 'talent_leo', email: 'leo@example.com' }),
    ).toBe('t2')
  })

  it('matches by account number', () => {
    const withAccount = [
      { id: 't9', email: 'a@x.com', application_id: null, account_number: 'NZG-100009' },
    ] as Talent[]
    expect(resolvePipelineTalentId(withAccount, { id: 'talent_x', accountId: 'NZG-100009' })).toBe(
      't9',
    )
  })
})
