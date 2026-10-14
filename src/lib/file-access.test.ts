import { describe, expect, it } from 'vitest'
import {
  applicationUploadFieldIds,
  fileFromApplication,
  immediateFileUrl,
  isDurableCdnUrl,
  isS3BucketHttpUrl,
  isViewableHttpUrl,
  s3KeyFromBucketUrl,
} from '@/lib/file-access'

describe('viewable file urls', () => {
  it('keeps https CDN urls and rejects s3 refs and bucket links', () => {
    expect(isViewableHttpUrl('https://cdn.example.com/applications/a/photo.jpg')).toBe(true)
    expect(isViewableHttpUrl('s3:applications/a/doc_gov_id/id.jpg')).toBe(false)
    expect(isS3BucketHttpUrl('https://nzinga.s3.us-east-1.amazonaws.com/applications/a/id.jpg')).toBe(true)
    expect(isDurableCdnUrl('https://cdn.example.com/applications/a/photo.jpg')).toBe(true)
    expect(isDurableCdnUrl('https://nzinga.s3.us-east-1.amazonaws.com/applications/a/id.jpg')).toBe(false)
    expect(isDurableCdnUrl('s3:applications/a/id.jpg')).toBe(false)
  })

  it('does not treat an s3 ref or bucket url as something an image can load', () => {
    expect(immediateFileUrl({ data: 's3:applications/a/doc_gov_id/id.jpg' })).toBe('')
    expect(
      immediateFileUrl({
        data: 's3:applications/a/doc_gov_id/id.jpg',
        cdnUrl: 'https://nzinga.s3.us-east-1.amazonaws.com/applications/a/doc_gov_id/id.jpg',
      }),
    ).toBe('')
    expect(
      immediateFileUrl({
        data: 's3:applications/a/doc_model_headshot/1.jpg',
        cdnUrl: 'https://cdn.example.com/applications/a/doc_model_headshot/1.jpg',
      }),
    ).toBe('https://cdn.example.com/applications/a/doc_model_headshot/1.jpg')
  })

  it('reads an object key back out of a bucket url', () => {
    expect(
      s3KeyFromBucketUrl('https://nzinga.s3.us-east-1.amazonaws.com/applications/app1/doc_gov_id/id.jpg'),
    ).toBe('applications/app1/doc_gov_id/id.jpg')
  })
})

describe('application uploads', () => {
  it('lists doc fields and keeps a CDN url without treating companion keys as files', () => {
    const data = {
      doc_model_headshot: 's3:applications/x/doc_model_headshot/1.jpg',
      doc_model_headshot_name: 'kai-headshot.jpg',
      doc_model_headshot_type: 'image/jpeg',
      doc_model_headshot_cdn: 'https://cdn.example.com/applications/x/doc_model_headshot/1.jpg',
      doc_gov_id: 'https://bucket.s3.us-east-1.amazonaws.com/applications/x/doc_gov_id/id.jpg',
      doc_gov_id_name: 'id.jpg',
    }
    expect(applicationUploadFieldIds(data)).toEqual(['doc_model_headshot', 'doc_gov_id'])
    const headshot = fileFromApplication(data, 'doc_model_headshot', 'Headshot')
    expect(headshot?.name).toBe('kai-headshot.jpg')
    expect(headshot?.cdnUrl).toBe('https://cdn.example.com/applications/x/doc_model_headshot/1.jpg')
    expect(headshot?.data).toBe('s3:applications/x/doc_model_headshot/1.jpg')
    const id = fileFromApplication(data, 'doc_gov_id', 'Government ID')
    expect(id?.data).toBe('s3:applications/x/doc_gov_id/id.jpg')
    expect(id?.cdnUrl).toBeUndefined()
  })
})
