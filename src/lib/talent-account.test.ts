import { describe, expect, it } from 'vitest'
import { buildTalentDirectory, findTalentAccount, talentAccountPath } from '@/lib/talent-account'
import type { AgencyProspect, AgencyTalent } from '@/types/agency'
import type { Talent } from '@/types'

describe('talent account directory', () => {
  const prospects: AgencyProspect[] = [
    {
      id: 'pros_1',
      accountId: 'NZG-200001',
      name: 'Kai Johnson',
      email: 'kai@example.com',
      workArea: 'Acting',
      stage: 'screening',
      source: 'Portal',
      submittedAt: '2026-08-01T10:00:00Z',
      notes: '',
      organization: 'NZG',
      messageEmails: ['kai@example.com'],
      lastLoginAt: '2026-08-01T10:00:00Z',
      contracts: [],
    },
  ]
  const roster: AgencyTalent[] = [
    {
      id: 'talent_maya',
      accountId: 'NZG-200101',
      name: 'Maya Rivera',
      role: 'Signed Model',
      status: 'active',
      workArea: 'Modeling',
      niches: ['Commercial'],
      bankReady: true,
      taxFormsReady: true,
      available: true,
      bookedDates: [],
    },
  ]

  it('indexes prospects and roster by account ID and name', () => {
    const dir = buildTalentDirectory({ pipeline: [] as Talent[], roster, prospects })
    expect(dir.byAccountId.get('NZG-200001')?.name).toBe('Kai Johnson')
    expect(findTalentAccount(dir, { name: 'Maya Rivera' })?.accountId).toBe('NZG-200101')
    expect(talentAccountPath('NZG-200101')).toBe('/talent/NZG-200101')
  })
})
