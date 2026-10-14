import { describe, expect, it } from 'vitest'
import {
  archiveApplicationRecord,
  mergeApplicationData,
  restoreApplicationRecord,
  sanitizeApplicationData,
} from '@/services/application.service'
import type { Application } from '@/types'

describe('application data persistence', () => {
  it('does not drop specialty fields when merging a later save', () => {
    const existing = {
      legal_first: 'Ava',
      representation_interests: 'Acting,Modeling',
      acting_experience_level: 'Working',
      acting_categories: 'Film,Television',
      acting_training: 'Conservatory program in New York focused on camera work.',
    }
    const incoming = {
      legal_first: 'Ava',
      representation_interests: 'Acting,Modeling',
      model_height: '5\'10"',
      model_experience: 'Editorial bookings in Atlanta.',
    }
    const merged = mergeApplicationData(existing, incoming)
    expect(merged.acting_experience_level).toBe('Working')
    expect(merged.acting_categories).toBe('Film,Television')
    expect(merged.acting_training).toContain('Conservatory')
    expect(merged.model_height).toBe('5\'10"')
    expect(merged.model_experience).toContain('Editorial')
  })

  it('keeps newer specialty answers when an older save arrives late', () => {
    const existing = {
      acting_credits: 'Lead in indie feature',
      last_touch: 'new',
    }
    const incoming = {
      acting_credits: '',
      last_touch: 'stale',
    }
    const merged = mergeApplicationData(existing, incoming, {
      existingSavedAt: '2026-08-23T18:00:00.000Z',
      incomingSavedAt: '2026-08-23T17:00:00.000Z',
    })
    expect(merged.acting_credits).toBe('Lead in indie feature')
    expect(merged.last_touch).toBe('new')
  })

  it('strips embedded data URLs and legacy storage refs but keeps S3 refs and text', () => {
    const cleaned = sanitizeApplicationData({
      acting_training: 'Meisner studio',
      doc_acting_headshot: 'data:image/png;base64,aaaa',
      doc_acting_resume: 's3:applications/x/doc_acting_resume/resume.pdf',
      doc_old: 'storage:application-docs/x/resume.pdf',
    })
    expect(cleaned.acting_training).toBe('Meisner studio')
    expect(cleaned.doc_acting_headshot).toBeUndefined()
    expect(cleaned.doc_acting_resume).toBe('s3:applications/x/doc_acting_resume/resume.pdf')
    expect(cleaned.doc_old).toBeUndefined()
  })

  it('stores bucket links as private s3 refs and keeps only a real CDN url', () => {
    const cleaned = sanitizeApplicationData({
      doc_gov_id: 'https://nzinga.s3.us-east-1.amazonaws.com/applications/app1/doc_gov_id/id.jpg',
      doc_gov_id_cdn: 'https://nzinga.s3.us-east-1.amazonaws.com/applications/app1/doc_gov_id/id.jpg',
      doc_model_headshot_cdn: 'https://cdn.example.com/applications/app1/doc_model_headshot/1.jpg',
      link_instagram: 'https://instagram.com/kai',
    })
    expect(cleaned.doc_gov_id).toBe('s3:applications/app1/doc_gov_id/id.jpg')
    expect(cleaned.doc_gov_id_cdn).toBeUndefined()
    expect(cleaned.doc_model_headshot_cdn).toBe('https://cdn.example.com/applications/app1/doc_model_headshot/1.jpg')
    expect(cleaned.link_instagram).toBe('https://instagram.com/kai')
  })
})

describe('application archive', () => {
  const app: Application = {
    id: 'app1',
    talent_id: null,
    access_code: 'CODE',
    company_code: 'NZG',
    talent_name: 'Ava Stone',
    talent_email: 'ava@example.com',
    status: 'submitted',
    created_at: '2026-08-01T00:00:00.000Z',
    data: { legal_first: 'Ava' },
  }

  it('keeps the previous status so an admin can restore it', () => {
    const archived = archiveApplicationRecord(app, '2026-10-12T12:00:00.000Z')
    expect(archived.status).toBe('archived')
    expect(archived.archived_from).toBe('submitted')
    expect(archived.archived_at).toBe('2026-10-12T12:00:00.000Z')
    expect(archiveApplicationRecord(archived)).toBe(archived)

    const restored = restoreApplicationRecord(archived, '2026-10-12T13:00:00.000Z')
    expect(restored.status).toBe('submitted')
    expect(restored.archived_from).toBeNull()
    expect(restored.archived_at).toBeNull()
  })

  it('restores a legacy archived row to in progress when the prior status is missing', () => {
    const restored = restoreApplicationRecord({ ...app, status: 'archived' })
    expect(restored.status).toBe('in_progress')
  })
})
