import { describe, expect, it, vi } from 'vitest'
import { uploadApplicationFile, uploadOwnedFile } from '@/services/storage.service'

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: false,
  supabase: null,
}))

describe('storage.service demo fallback', () => {
  it('embeds files as data URLs when S3 is not configured', async () => {
    const file = new File(['hello'], 'id.pdf', { type: 'application/pdf' })
    const doc = await uploadOwnedFile(file, 'talents/t1/documents/gov_id', { uploadedBy: 'scout' })
    expect(doc.data.startsWith('data:')).toBe(true)
    expect(doc.name).toBe('id.pdf')
    expect(doc.uploaded_by).toBe('scout')
  })

  it('returns an application file url that is a data URL in demo mode', async () => {
    const file = new File(['pic'], 'headshot.jpg', { type: 'image/jpeg' })
    const result = await uploadApplicationFile('app1', 'doc_profile_photo', file)
    expect(result.url.startsWith('data:')).toBe(true)
  })
})
