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
  console.debug('[S3 Upload] Requesting presigned URL', { path, contentType, fileSize })
  const result = await invokeEdgeFunction<PresignedUpload>('s3-upload-url', {
    path,
    contentType,
    fileSize,
  })
  if (!result.ok) {
    console.error('[S3 Upload] Presigned URL request failed', {
      error: result.error,
      path,
      contentType,
      fileSize,
      sessionExpired: (result as { sessionExpired?: boolean }).sessionExpired,
    })
    throw new Error(result.error || 'Could not start upload')
  }
  if (!result.data?.uploadUrl || !result.data.key) {
    console.error('[S3 Upload] Presigned URL response missing fields', {
      data: result.data,
      hasUploadUrl: !!result.data?.uploadUrl,
      hasKey: !!result.data?.key,
    })
    throw new Error('Upload URL was not returned. Try again.')
  }
  console.debug('[S3 Upload] Got presigned URL', {
    key: result.data.key,
    cdnUrl: result.data.cdnUrl,
    uploadUrlHost: new URL(result.data.uploadUrl).host,
  })
  return result.data
}

export function uploadToS3(
  file: Blob,
  presignedUrl: string,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const uploadId = `upload_${Date.now()}`
  console.debug(`[S3 Upload][${uploadId}] PUT to S3`, {
    size: file.size,
    contentType,
    urlHost: new URL(presignedUrl).host,
    urlPath: new URL(presignedUrl).pathname,
  })
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', contentType)
    // StorageClass is already encoded in the presigned URL query string
    // (the SDK hoists x-amz-* params). Sending it again as a header
    // adds an unsigned header → S3 returns 403 SignatureDoesNotMatch.
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          onProgress(pct)
        }
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.debug(`[S3 Upload][${uploadId}] Success`, { status: xhr.status })
        resolve()
      } else {
        const body = xhr.responseText?.slice(0, 500)
        console.error(`[S3 Upload][${uploadId}] Failed`, {
          status: xhr.status,
          statusText: xhr.statusText,
          responseHeaders: xhr.getAllResponseHeaders(),
          responseBody: body,
          contentType,
          fileSize: file.size,
        })
        reject(new Error(`Upload failed (${xhr.status}): ${body || xhr.statusText}`))
      }
    }
    xhr.onerror = () => {
      console.error(`[S3 Upload][${uploadId}] Network error`, {
        readyState: xhr.readyState,
        status: xhr.status,
      })
      reject(new Error('Network error during upload'))
    }
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
  const fileName = opts?.fileName || (file instanceof File ? file.name : 'upload')
  console.debug('[S3 Upload] uploadFile start', { path: objectPath, fileName, contentType, size })
  try {
    const signed = await requestUploadUrl(objectPath, contentType, size)
    await uploadToS3(file, signed.uploadUrl, contentType, opts?.onProgress)
    console.debug('[S3 Upload] uploadFile complete', { key: signed.key, cdnUrl: signed.cdnUrl })
    return {
      key: signed.key,
      cdnUrl: signed.cdnUrl,
      thumbUrl: signed.thumbnailUrl,
    }
  } catch (err) {
    console.error('[S3 Upload] uploadFile failed', {
      path: objectPath,
      fileName,
      contentType,
      size,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    throw err
  }
}
