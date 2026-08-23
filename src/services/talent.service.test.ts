import { describe, expect, it } from 'vitest'
import { fromTalentRow, toTalentRow } from '@/services/talent.service'
import type { Talent } from '@/types'

const base: Talent = {
  id: 't1',
  account_number: 'NZG-100001',
  name: 'Jordan Lee',
  first_name: 'Jordan',
  last_name: 'Lee',
  stage: 'holding_entry',
  niches: ['Acting'],
  scout_id: null,
  created_at: '2026-08-23T00:00:00.000Z',
  social_handle: '@jordan',
  follower_count: '1000',
  er_pct: '',
  platform: '',
  location: 'Atlanta, GA',
  pillar_scores: [0, 0, 0, 0, 0],
  pillar_rationales: ['', '', '', '', ''],
  jordan_score: 0,
  revenue_path: '',
  scout_summary: '',
  team1_notes: '',
  team1_decision: null,
  compliance: {},
  rep_type: '',
  commission: '',
  term_length: '',
  team2_notes: '',
  team2_decision: null,
  director_decision: null,
  portal_setup: false,
  technical_routing: false,
  warm_handoff: '',
  warm_handoff_confirmed: false,
  revenue_ytd: '0',
  revenue_projected: '0',
  last_contacted: '2026-08-23',
  application_id: 'app1',
  application_status: 'in_progress',
  application_data: { acting_training: 'BFA Acting', sport_primary: 'Track' },
  uploaded_docs: {},
  audit_log: [],
}

describe('talent row mapping', () => {
  it('stores specialty answers in application_data and profile extras off-table', () => {
    const row = toTalentRow(base)
    expect(row.first_name).toBeUndefined()
    expect(row.acting_training).toBeUndefined()
    expect((row.profile as { first_name?: string }).first_name).toBe('Jordan')
    expect((row.application_data as { acting_training?: string }).acting_training).toBe('BFA Acting')
    expect(row.name).toBe('Jordan Lee')
    expect(row.niches).toEqual(['Acting'])

    const roundTrip = fromTalentRow(row)
    expect(roundTrip.first_name).toBe('Jordan')
    expect(roundTrip.application_data?.sport_primary).toBe('Track')
  })
})
