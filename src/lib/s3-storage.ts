import { invokeEdgeFunction } from '@/lib/edge-functions'
import {
  isS3Ref,
  parseS3Key as parseS3KeyBase,
  S3_FILE_PREFIX,
  toS3Ref,
} from '@/lib/application-files'

export { isS3Ref, S3_FILE_PREFIX, toS3Ref }

export const CDN_BASE_URL = String(import.meta.env.VITE_CDN_URL || '').replace(/\/$/, '')

export interface S3FileRef {
  key: string
  cdnUrl: string
  thumbUrl: string
}

export interface PresignedUpload {
  uploadUrl: string
  key: string
  cdnUrl: string
  thumbnailUrl: string
}

export function parseS3Key(value: string): string | null {
  const base = parseS3KeyBase(value)
  if (base) return base
  if (CDN_BASE_URL && value.startsWith(`${CDN_BASE_URL}/`)) {
    return value.slice(CDN_BASE_URL.length + 1)
  }
  return null
}

export function resolveS3Url(ref: string): string {
  const key = parseS3Key(ref)
  if (!key) return ref
  if (!CDN_BASE_URL) return ref.startsWith('http') ? ref : `${S3_FILE_PREFIX}${key}`
  return `${CDN_BASE_URL}/${key}`
}

export function thumbnailUrl(ref: string): string {
  const key = parseS3Key(ref)
  if (!key) return resolveS3Url(ref)
  const stem = key.replace(/\.[^.]+$/, '')
  const thumbKey = stem.startsWith('thumbnails/') ? `${stem}.webp` : `thumbnails/${stem}.webp`
  if (!CDN_BASE_URL) return thumbKey
  return `${CDN_BASE_URL}/${thumbKey.replace(/^thumbnails\/thumbnails\//, 'thumbnails/')}`
}

export async function requestUploadUrl(
  path: string,
  contentType: string,
  fileSize: number,
): Promise<PresignedUpload> {
  const result = await invokeEdgeFunction<PresignedUpload>('s3-upload-url', {
    path,
    contentType,
    fileSize,
  })
  if (!result.ok) throw new Error(result.error || 'Could not start upload')
  if (!result.data?.uploadUrl || !result.data.key) {
    throw new Error('Upload URL was not returned. Try again.')
  }
  return result.data
}

export function uploadToS3(
  file: Blob,
  presignedUrl: string,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.setRequestHeader('x-amz-storage-class', 'INTELLIGENT_TIERING')
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(file)
  })
}

export async function uploadFile(
  file: File | Blob,
  path: string,
  opts?: { contentType?: string; fileName?: string; onProgress?: (pct: number) => void },
): Promise<S3FileRef> {
  const contentType =
    opts?.contentType || (file instanceof File ? file.type : '') || 'application/octet-stream'
  const size = file.size
  const objectPath = path.replace(/\/+$/, '')
  const signed = await requestUploadUrl(objectPath, contentType, size)
  await uploadToS3(file, signed.uploadUrl, contentType, opts?.onProgress)
  return {
    key: signed.key,
    cdnUrl: signed.cdnUrl,
    thumbUrl: signed.thumbnailUrl,
  }
}
