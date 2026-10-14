import { parseS3Key, toS3Ref } from '@/lib/application-files'
import { resolveS3Url } from '@/lib/s3-storage'
import type { ApplicationData } from '@/types/application'
import type { UploadedDoc } from '@/types/talent'

/** A URL an <img> or iframe can request. `s3:` refs are not viewable. */
export function isViewableHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/** Virtual-hosted or path-style Amazon S3 URLs. These are not stored. */
export function isS3BucketHttpUrl(value: unknown): value is string {
  if (!isViewableHttpUrl(value)) return false
  const host = new URL(value).hostname.toLowerCase()
  return host === 's3.amazonaws.com' || host.endsWith('.s3.amazonaws.com') || /\.s3[.-][a-z0-9-]+\.amazonaws\.com$/.test(host)
}

/**
 * A CDN URL that is safe to keep beside the private `s3:` ref.
 * Raw bucket URLs are rejected so government IDs and other uploads are not stored as durable public links.
 */
export function isDurableCdnUrl(value: unknown): value is string {
  return isViewableHttpUrl(value) && !isS3BucketHttpUrl(value)
}

/** Turn a bucket HTTPS URL back into an object key when it points at an app prefix. */
export function s3KeyFromBucketUrl(value: string): string | null {
  if (!isS3BucketHttpUrl(value)) return null
  try {
    const path = decodeURIComponent(new URL(value).pathname).replace(/^\/+/, '')
    return parseS3Key(path)
  } catch {
    return null
  }
}

export function storedObjectKey(doc: {
  data?: string
  cdnUrl?: string
  storagePath?: string
} | null | undefined): string | null {
  if (!doc) return null
  return (
    parseS3Key(doc.data || '') ||
    (doc.data && isS3BucketHttpUrl(doc.data) ? s3KeyFromBucketUrl(doc.data) : null) ||
    parseS3Key(doc.cdnUrl || '') ||
    (doc.cdnUrl && isS3BucketHttpUrl(doc.cdnUrl) ? s3KeyFromBucketUrl(doc.cdnUrl) : null) ||
    parseS3Key(doc.storagePath || '') ||
    (doc.storagePath ? parseS3Key(toS3Ref(doc.storagePath)) : null)
  )
}

/** Synchronous display URL. Empty when the file still needs a short-lived signed GET. */
export function immediateFileUrl(doc: {
  data?: string
  cdnUrl?: string
  storagePath?: string
} | null | undefined): string {
  if (!doc) return ''
  if (doc.data?.startsWith('data:')) return doc.data
  if (isDurableCdnUrl(doc.cdnUrl)) return doc.cdnUrl
  if (isDurableCdnUrl(doc.data)) return doc.data
  const key = storedObjectKey(doc)
  if (!key) return ''
  const resolved = resolveS3Url(toS3Ref(key))
  return isDurableCdnUrl(resolved) ? resolved : ''
}

export function applicationUploadFieldIds(data: ApplicationData | undefined): string[] {
  if (!data) return []
  return Object.keys(data).filter(
    (key) =>
      key.startsWith('doc_') &&
      !key.endsWith('_name') &&
      !key.endsWith('_type') &&
      !key.endsWith('_cdn') &&
      Boolean(data[key]),
  )
}

export function fileFromApplication(
  data: ApplicationData,
  fieldId: string,
  fallbackName: string,
): UploadedDoc | null {
  const raw = data[fieldId]
  if (!raw || typeof raw === 'boolean') return null
  const value = String(raw)
  if (!value) return null
  const key = parseS3Key(value) || (isS3BucketHttpUrl(value) ? s3KeyFromBucketUrl(value) : null)
  const storedCdn = data[`${fieldId}_cdn`]
  const resolved = key ? resolveS3Url(toS3Ref(key)) : ''
  const cdnUrl = isDurableCdnUrl(storedCdn) ? String(storedCdn) : isDurableCdnUrl(resolved) ? resolved : undefined
  return {
    name: String(data[`${fieldId}_name`] || fallbackName),
    data: key ? toS3Ref(key) : value,
    type: String(data[`${fieldId}_type`] || 'application/octet-stream'),
    storagePath: key || undefined,
    cdnUrl,
    doc_type: fieldId.replace(/^doc_/, ''),
    uploaded_at: new Date().toISOString(),
    uploaded_by: 'applicant',
    status: 'received',
  }
}
