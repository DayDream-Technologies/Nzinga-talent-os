import { describe, expect, it } from 'vitest'
import { SOP_STATUS } from '@/constants/sop-status'
import {
  completedSectionsFromData,
  findLinkedTalent,
  isApplicationReadyToImport,
  prefillApplicationData,
  representationInterestFromWorkArea,
} from '@/lib/application-prefill'
import type { AgencyProspect } from '@/types/agency'
import type { Application } from '@/types/application'
import type { Talent } from '@/types/talent'

function prospect(overrides: Partial<AgencyProspect> = {}): AgencyProspect {
  return {
    id: 'pros_1',
    accountId: 'NZG-200010',
    name: 'Kai Johnson',
    firstName: 'Kai',
    lastName: 'Johnson',
    email: 'kai@example.com',
    phone: '555-010-2026',
    workArea: 'Modeling',
    stage: 'first_contact',
    source: 'Scout referral',
    submittedAt: '2026-08-01T10:00:00Z',
    notes: 'Staff-only screening notes',
    organization: 'NZG',
    city: 'Chicago',
    state: 'IL',
    dateOfBirth: '1998-04-12',
    parentEmail: '',
    messageEmails: ['kai@example.com'],
    contracts: [],
    ...overrides,
  }
}

describe('application prefill', () => {
  it('maps prospect fields onto the matching application questions', () => {
    const data = prefillApplicationData({ prospect: prospect() })
    expect(data.legal_first).toBe('Kai')
    expect(data.legal_last).toBe('Johnson')
    expect(data.preferred_name).toBe('Kai Johnson')
    expect(data.email).toBe('kai@example.com')
    expect(data.phone).toBe('555-010-2026')
    expect(data.dob).toBe('1998-04-12')
    expect(data.city).toBe('Chicago')
    expect(data.state).toBe('IL')
    expect(data.current_market).toBe('Chicago, IL')
    expect(data.representation_interests).toBe('Modeling')
    expect(data.about_yourself).toBeUndefined()
  })

  it('maps Influencing and Sports work areas to application interest labels', () => {
    expect(representationInterestFromWorkArea('Influencing')).toBe('Influencing / Content Creation')
    expect(representationInterestFromWorkArea('Sports')).toBe('Sports & Athletics')
    const data = prefillApplicationData({
      prospect: prospect({ workArea: 'Influencing', firstName: 'Ava', lastName: 'Lee', name: 'Ava Lee' }),
    })
    expect(data.representation_interests).toBe('Influencing / Content Creation')
  })

  it('prefills guardian email for minors and does not overwrite existing answers', () => {
    const data = prefillApplicationData({
      prospect: prospect({
        dateOfBirth: '2012-01-01',
        isMinor: true,
        parentEmail: 'parent@example.com',
      }),
      existing: { legal_first: 'Already', email: 'kept@example.com' },
    })
    expect(data.legal_first).toBe('Already')
    expect(data.email).toBe('kept@example.com')
    expect(data.guardian_invite_email).toBe('parent@example.com')
    expect(data.legal_last).toBe('Johnson')
  })

  it('prefills from a pipeline talent New Entry record', () => {
    const data = prefillApplicationData({
      talent: {
        name: 'Jordan Lee',
        first_name: 'Jordan',
        last_name: 'Lee',
        stage_name: 'J Lee',
        email: 'j@example.com',
        phone: '555-222-1111',
        dob: '1994-06-01',
        city: 'Atlanta',
        state: 'GA',
        niches: ['Acting'],
        height: '5\'11"',
      },
    })
    expect(data.preferred_name).toBe('J Lee')
    expect(data.city).toBe('Atlanta')
    expect(data.representation_interests).toBe('Acting')
    expect(data.model_height).toBe('5\'11"')
  })

  it('prefills guardian email from a pipeline talent parent contact', () => {
    const data = prefillApplicationData({
      talent: {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        dob: '2012-06-01',
        parent_email: 'pat@example.com',
      },
    })
    expect(data.guardian_invite_email).toBe('pat@example.com')
  })

  it('marks complete sections when required personal fields are present', () => {
    const data = prefillApplicationData({
      prospect: prospect({ workArea: 'Modeling' }),
      existing: {
        country: 'USA',
        preferred_name: 'Kai Johnson',
      },
    })
    const completed = completedSectionsFromData({
      ...data,
      country: 'USA',
      current_market: 'Chicago, IL',
    })
    expect(completed).toContain('personal')
    expect(completed).toContain('interests')
  })
})

describe('import to pipeline helpers', () => {
  const completeApp = {
    id: 'app_1',
    talent_id: 'pros_1',
    access_code: 'KAI1',
    company_code: 'NZG',
    talent_name: 'Kai Johnson',
    talent_email: 'kai@example.com',
    status: 'submitted' as const,
    created_at: '2026-08-01T10:00:00Z',
    data: {
      legal_first: 'Kai',
      legal_last: 'Johnson',
      preferred_name: 'Kai Johnson',
      dob: '1998-04-12',
      email: 'kai@example.com',
      phone: '555-010-2026',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      current_market: 'Chicago',
      representation_interests: 'Modeling',
      experience_level: 'Some Experience',
      about_yourself: 'Working model.',
      currently_available: 'Yes',
      willing_to_travel: 'Yes',
      work_markets: 'Regional',
    },
  } satisfies Application

  it('blocks import until the application is submitted, complete, and not pending guardian', () => {
    expect(isApplicationReadyToImport({ ...completeApp, status: 'in_progress' })).toBe(false)
    expect(isApplicationReadyToImport({ ...completeApp, status: 'pending_guardian' })).toBe(false)
    expect(isApplicationReadyToImport({ ...completeApp, guardian_status: 'pending' })).toBe(false)
    expect(isApplicationReadyToImport(completeApp)).toBe(false)
  })

  it('links an existing pipeline talent by application id, not a CRM prospect id', () => {
    const pipeline = {
      id: 't_stub_app_1',
      application_id: 'app_1',
      email: 'kai@example.com',
      name: 'Kai Johnson',
      applicant_stage_status: SOP_STATUS.underVetting,
    } as Talent
    expect(findLinkedTalent([pipeline], completeApp)?.id).toBe('t_stub_app_1')
    expect(findLinkedTalent([], completeApp)).toBeUndefined()
  })
})
