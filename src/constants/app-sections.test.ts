import { describe, expect, it } from 'vitest'
import {
  ageFromDob,
  getVisibleSections,
  isAppComplete,
  isMinor,
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
        doc_profile_photo: 'storage:application-docs/x/doc_profile_photo/1.jpg',
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
        doc_profile_photo: 'storage:application-docs/x/doc_profile_photo/1.jpg',
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
        doc_sport_photo: 'storage:application-docs/x/doc_sport_photo/1.jpg',
      }),
    ).toContain('sport_years')
  })
})
