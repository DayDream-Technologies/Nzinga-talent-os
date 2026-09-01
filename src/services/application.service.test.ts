import { describe, expect, it } from 'vitest'
import { mergeApplicationData, sanitizeApplicationData } from '@/services/application.service'

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
})
