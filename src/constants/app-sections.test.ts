import { describe, expect, it } from 'vitest'
import {
  ageFromDob,
  applyApplicationToTalent,
  getVisibleSections,
  isAppComplete,
  isMinor,
  talentFromApp,
  validateSection,
} from '@/constants/app-sections'
import { STAGE_LABELS } from '@/types/stages'
import type { Application } from '@/types'

describe('NZG short application', () => {
  it('calculates age and minor status from DOB', () => {
    expect(isMinor('2015-01-01')).toBe(true)
    expect(isMinor('1990-06-15')).toBe(false)
    expect(ageFromDob('1990-06-15')).toBeGreaterThan(30)
  })

  it('shows conditional category sections from representation interests', () => {
    const modelingOnly = getVisibleSections({ representation_interests: 'Modeling' })
    expect(modelingOnly.map((s) => s.id)).toContain('modeling')
    expect(modelingOnly.map((s) => s.id)).not.toContain('acting')
    expect(modelingOnly.map((s) => s.id)).not.toContain('sports')

    const multi = getVisibleSections({
      representation_interests: 'Modeling,Acting,Sports & Athletics,Influencing / Content Creation',
    })
    expect(multi.map((s) => s.id)).toEqual(
      expect.arrayContaining(['modeling', 'acting', 'sports', 'influencing']),
    )
  })

  it('requires guardian email for minors in personal section', () => {
    const missing = validateSection('personal', {
      legal_first: 'A',
      legal_last: 'B',
      preferred_name: 'A B',
      dob: '2012-01-01',
      email: 'a@example.com',
      phone: '555-123-4567',
      city: 'X',
      state: 'Y',
      country: 'USA',
      current_market: 'X',
      doc_profile_photo: 'data:image/png;base64,xx',
    })
    expect(missing).toContain('guardian_invite_email')
  })

  it('does not require a profile photo in the personal section', () => {
    const missing = validateSection('personal', {
      legal_first: 'A',
      legal_last: 'B',
      preferred_name: 'A B',
      dob: '1990-01-01',
      email: 'a@example.com',
      phone: '555-123-4567',
      city: 'X',
      state: 'Y',
      country: 'USA',
      current_market: 'X',
    })
    expect(missing).not.toContain('doc_profile_photo')
    expect(missing).toEqual([])
  })

  it('maps stage keys to Build Requirements / SOP labels', () => {
    expect(STAGE_LABELS.holding_entry).toBe('New / Lead')
    expect(STAGE_LABELS.team1_review).toBe('Client Packet Review')
    expect(STAGE_LABELS.signed_onboarding).toBe('Active Client')
    expect(STAGE_LABELS.not_viable).toBe('Declined')
  })

  it('treats hidden category sections as not required for completion', () => {
    const app = {
      id: 'x',
      talent_id: null,
      access_code: 'TEST',
      company_code: 'NZG',
      talent_name: 'Test',
      talent_email: 't@example.com',
      status: 'in_progress',
      created_at: new Date().toISOString(),
      data: {
        representation_interests: 'Influencing / Content Creation',
      },
    } as Application
    expect(validateSection('modeling', app.data)).toEqual([])
    expect(validateSection('acting', app.data)).toEqual([])
    expect(isAppComplete(app)).toBe(false)
  })

  it('enforces 200–500 characters on About You long answers', () => {
    const short = validateSection('general', {
      experience_level: 'Beginner',
      about_yourself: 'too short',
      career_goals: 'too short',
      proud_accomplishments: 'too short',
      why_nzinga_interest: 'too short',
    })
    expect(short).toEqual(
      expect.arrayContaining([
        'about_yourself',
        'career_goals',
        'proud_accomplishments',
        'why_nzinga_interest',
      ]),
    )

    const okText = 'x'.repeat(220)
    expect(
      validateSection('general', {
        experience_level: 'Beginner',
        about_yourself: okText,
        career_goals: okText,
        proud_accomplishments: okText,
        why_nzinga_interest: okText,
      }),
    ).toEqual([])
  })

  it('allows empty acting training but requires 200 chars when provided', () => {
    const base = {
      representation_interests: 'Acting',
      acting_experience_level: 'Beginner',
      acting_categories: 'Commercial',
      doc_acting_headshot: 'data:image/png;base64,xx',
    }
    expect(validateSection('acting', { ...base, acting_training: '' })).toEqual([])
    expect(validateSection('acting', { ...base, acting_training: 'short' })).toContain(
      'acting_training',
    )
    expect(validateSection('acting', { ...base, acting_training: 'y'.repeat(200) })).toEqual([])
  })

  it('requires Instagram or Other link on social section', () => {
    expect(validateSection('social', {})).toEqual(
      expect.arrayContaining(['link_instagram', 'link_other']),
    )
    expect(validateSection('social', { link_instagram: 'https://instagram.com/x' })).toEqual([])
    expect(validateSection('social', { link_other: 'https://example.com' })).toEqual([])
  })

  it('rejects future dates of birth and invalid phones/urls/numbers', () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    const futureIso = future.toISOString().split('T')[0]

    expect(
      validateSection('personal', {
        legal_first: 'A',
        legal_last: 'B',
        preferred_name: 'A B',
        dob: futureIso,
        email: 'a@example.com',
        phone: '555-123-4567',
        city: 'X',
        state: 'Y',
        country: 'USA',
        current_market: 'X',
        doc_profile_photo: 's3:applications/x/doc_profile_photo/1.jpg',
      }),
    ).toContain('dob')

    expect(
      validateSection('personal', {
        legal_first: 'A',
        legal_last: 'B',
        preferred_name: 'A B',
        dob: '1990-01-01',
        email: 'a@example.com',
        phone: '123',
        city: 'X',
        state: 'Y',
        country: 'USA',
        current_market: 'X',
        doc_profile_photo: 's3:applications/x/doc_profile_photo/1.jpg',
      }),
    ).toContain('phone')

    expect(
      validateSection('social', {
        link_instagram: 'not-a-url',
      }),
    ).toContain('link_instagram')

    expect(
      validateSection('sports', {
        representation_interests: 'Sports & Athletics',
        sport_primary: 'Soccer',
        sport_position: 'Forward',
        sport_level: 'College',
        sport_years: 'abc',
        sport_highlights: 'Wins',
        doc_sport_photo: 's3:applications/x/doc_sport_photo/1.jpg',
      }),
    ).toContain('sport_years')
  })

  it('copies acting, modeling, and sports answers onto the talent record', () => {
    const app = {
      id: 'app_specialty',
      talent_id: null,
      access_code: 'SPEC1',
      company_code: 'NZG',
      talent_name: 'Jordan Lee',
      talent_email: 'j@example.com',
      status: 'in_progress' as const,
      created_at: new Date().toISOString(),
      data: {
        legal_first: 'Jordan',
        legal_last: 'Lee',
        preferred_name: 'Jordan',
        representation_interests: 'Acting,Modeling,Sports & Athletics',
        acting_experience_level: 'Working',
        acting_categories: 'Film',
        acting_training: 'BFA Acting',
        model_height: '5\'11"',
        model_categories: 'Editorial',
        sport_primary: 'Track',
        sport_position: 'Sprinter',
        sport_highlights: 'Conference champion',
      },
    }
    const talent = talentFromApp(app as Application, 'NZG-100010')
    expect(talent.application_data?.acting_training).toBe('BFA Acting')
    expect(talent.application_data?.model_categories).toBe('Editorial')
    expect(talent.application_data?.sport_primary).toBe('Track')
    expect(talent.niches).toEqual(expect.arrayContaining(['Acting', 'Modeling', 'Sports & Athletics']))
    expect(talent.height).toBe('5\'11"')

    const existing = talentFromApp(
      { ...app, data: { legal_first: 'Jordan', legal_last: 'Lee' } } as Application,
      'NZG-100010',
    )
    const updated = applyApplicationToTalent(existing, app as Application)
    expect(updated.application_data?.acting_categories).toBe('Film')
    expect(updated.application_data?.sport_highlights).toBe('Conference champion')
    expect(updated.stage).toBe(existing.stage)
  })

  it('sets Application Submitted / Under Vetting on import without regressing later SOP status', () => {
    const submitted = {
      id: 'app_sop',
      talent_id: null,
      access_code: 'SOP1',
      company_code: 'NZG',
      talent_name: 'Kai Johnson',
      talent_email: 'kai@example.com',
      status: 'submitted' as const,
      created_at: new Date().toISOString(),
      data: { legal_first: 'Kai', legal_last: 'Johnson' },
    } as Application
    const created = talentFromApp(submitted, 'NZG-100020')
    expect(created.stage).toBe('holding_entry')
    expect(created.applicant_stage_status).toBe('Application Submitted / Under Vetting')
    expect(created.application_status).toBe('submitted')

    const later = applyApplicationToTalent(
      { ...created, stage: 'team2_audit', applicant_stage_status: 'Approved - Future', jordan_score: 4.2 },
      submitted,
    )
    expect(later.stage).toBe('team2_audit')
    expect(later.applicant_stage_status).toBe('Approved - Future')
    expect(later.jordan_score).toBe(4.2)
  })
})
