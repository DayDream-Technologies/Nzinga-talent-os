import { describe, expect, it, vi } from 'vitest'
import { resolveProfilePhoto, seedProfilePhoto, uploadProfilePhoto } from '@/lib/profile-photo'
import type { Application } from '@/types/application'
import type { AgencyProspect, AgencyTalent } from '@/types/agency'
import type { Talent } from '@/types/talent'

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: false,
  supabase: null,
  DOCUMENTS_BUCKET: 'documents',
}))

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

describe('uploadProfilePhoto', () => {
  it('embeds the file as a data URL when storage is not configured', async () => {
    const file = new File(['hello'], 'headshot.jpg', { type: 'image/jpeg' })
    const doc = await uploadProfilePhoto(file, 'talent_1', 'talent')
    expect(doc.data.startsWith('data:')).toBe(true)
    expect(doc.name).toBe('headshot.jpg')
    expect(doc.doc_type).toBe('profile_photo')
    expect(doc.uploaded_by).toBe('talent')
    expect(doc.storagePath).toBeUndefined()
  })
})
