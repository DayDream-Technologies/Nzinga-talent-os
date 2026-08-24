import { describe, expect, it } from 'vitest'
import { emptyUdf, interestsToTalentTypes, mergeUdf, prefillUdfFromApplication } from '@/lib/talent-udf'
import type { Application } from '@/types/application'
import type { TalentType } from '@/types/udf'

const sampleApp: Application = {
  id: 'app_test',
  talent_id: 't1',
  access_code: 'TEST1',
  company_code: 'NZG',
  talent_name: 'Jordan Lee',
  talent_email: 'jordan@example.com',
  status: 'submitted',
  created_at: '2026-08-01T00:00:00Z',
  data: {
    preferred_name: 'J Lee',
    representation_interests: 'Modeling,Acting',
    model_height: "5'10\"",
    acting_training: 'Meisner studio',
    career_goals: 'Book national campaigns',
    influencer_followers: '10K',
  },
}

describe('talent UDF helpers', () => {
  it('maps representation interests to talent types', () => {
    expect(interestsToTalentTypes('Modeling, Influencing / Content Creation, Sports & Athletics')).toEqual([
      'Modeling',
      'Influencing',
      'Sports',
    ])
  })

  it('prefills empty UDF fields from application data', () => {
    const udf = prefillUdfFromApplication(sampleApp)
    expect(udf.stageName).toBe('J Lee')
    expect(udf.talentTypes).toEqual(['Modeling', 'Acting'])
    expect(udf.height).toBe("5'10\"")
    expect(udf.actingTraining).toBe('Meisner studio')
    expect(udf.careerGoals).toBe('Book national campaigns')
    expect(udf.totalFollowers).toBe('10K')
  })

  it('lets staff edits win over application prefill', () => {
    const stored = { ...emptyUdf(), stageName: 'Staff Name', talentTypes: ['Sports'] as TalentType[] }
    const merged = mergeUdf(emptyUdf(), prefillUdfFromApplication(sampleApp), stored)
    expect(merged.stageName).toBe('Staff Name')
    expect(merged.talentTypes).toEqual(['Sports'])
    expect(merged.height).toBe("5'10\"")
  })
})
