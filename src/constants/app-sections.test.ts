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
      phone: '555',
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
    // Incomplete overall, but modeling/acting should not add missing fields
    expect(validateSection('modeling', app.data)).toEqual([])
    expect(validateSection('acting', app.data)).toEqual([])
    expect(isAppComplete(app)).toBe(false)
  })
})
