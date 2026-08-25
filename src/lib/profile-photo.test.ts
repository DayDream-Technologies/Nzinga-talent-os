import { describe, expect, it } from 'vitest'
import { resolveProfilePhoto, seedProfilePhoto } from '@/lib/profile-photo'
import type { Application } from '@/types/application'
import type { AgencyProspect, AgencyTalent } from '@/types/agency'
import type { Talent } from '@/types/talent'

const appPhoto = {
  name: 'app.jpg',
  data: 'data:image/jpeg;base64,app',
  type: 'image/jpeg',
}

describe('resolveProfilePhoto', () => {
  it('prefers a staff-updated pipeline photo over the application file', () => {
    const pipeline = {
      uploaded_docs: { profile_photo: seedProfilePhoto('Maya Rivera', 'MR') },
    } as Talent
    const application = {
      data: {
        doc_profile_photo: appPhoto.data,
        doc_profile_photo_name: appPhoto.name,
        doc_profile_photo_type: appPhoto.type,
      },
    } as Application

    const resolved = resolveProfilePhoto({ pipelineTalent: pipeline, application })
    expect(resolved?.name).toContain('Maya_Rivera')
    expect(resolved?.data).not.toBe(appPhoto.data)
  })

  it('prefers a roster photo over the pipeline photo', () => {
    const pipeline = {
      uploaded_docs: { profile_photo: seedProfilePhoto('Maya Rivera', 'MR') },
    } as Talent
    const rosterTalent = {
      profilePhoto: seedProfilePhoto('Kai Johnson', 'KJ', '#2563eb'),
    } as AgencyTalent
    expect(resolveProfilePhoto({ pipelineTalent: pipeline, rosterTalent })?.name).toContain(
      'Kai_Johnson',
    )
  })

  it('falls back to the application profile photo', () => {
    const application = {
      data: {
        doc_profile_photo: appPhoto.data,
        doc_profile_photo_name: appPhoto.name,
        doc_profile_photo_type: appPhoto.type,
      },
    } as Application
    expect(resolveProfilePhoto({ application })?.name).toBe('app.jpg')
  })

  it('uses roster photo when pipeline has none', () => {
    const rosterTalent = {
      profilePhoto: seedProfilePhoto('Kai Johnson', 'KJ', '#2563eb'),
    } as AgencyTalent
    const prospect = { profilePhoto: null } as AgencyProspect
    expect(resolveProfilePhoto({ rosterTalent, prospect })?.name).toContain('Kai_Johnson')
  })
})
