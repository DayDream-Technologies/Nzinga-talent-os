import { describe, expect, it } from 'vitest'
import { isS3Ref, parseS3Key, toS3Ref } from '@/lib/application-files'
import { resolveS3Url, thumbnailUrl } from '@/lib/s3-storage'

describe('S3 refs', () => {
  it('detects and parses s3: keys', () => {
    expect(isS3Ref('s3:talents/abc/profile/1.jpg')).toBe(true)
    expect(isS3Ref('data:image/jpeg;base64,xx')).toBe(false)
    expect(parseS3Key('s3:talents/abc/profile/1.jpg')).toBe('talents/abc/profile/1.jpg')
    expect(parseS3Key('talents/abc/documents/gov_id/file.pdf')).toBe('talents/abc/documents/gov_id/file.pdf')
    expect(toS3Ref('talents/abc/profile/1.jpg')).toBe('s3:talents/abc/profile/1.jpg')
  })

  it('builds thumbnail keys next to the original', () => {
    expect(thumbnailUrl('s3:talents/abc/profile/1.jpg')).toBe('thumbnails/talents/abc/profile/1.webp')
  })

  it('leaves s3 refs unchanged when no CDN is configured', () => {
    expect(resolveS3Url('s3:talents/abc/profile/1.jpg')).toBe('s3:talents/abc/profile/1.jpg')
  })
})
