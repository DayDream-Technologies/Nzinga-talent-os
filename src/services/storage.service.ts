import { invokeEdgeFunction } from '@/lib/edge-functions'
import {
  isS3Ref,
  parseS3Key,
  sanitizeStorageFileName,
  toS3Ref,
} from '@/lib/application-files'
import { immediateFileUrl, isDurableCdnUrl, isViewableHttpUrl, storedObjectKey } from '@/lib/file-access'
import { thumbnailUrl, uploadFile as putS3File, type S3FileRef } from '@/lib/s3-storage'
import { supabaseConfigured } from '@/lib/supabase'
import type { UploadedDoc } from '@/types'

const downloadCache = new Map<string, { url: string; exp: number }>()

export async function requestDownloadUrl(key: string): Promise<string> {
  const hit = downloadCache.get(key)
  if (hit && hit.exp > Date.now()) return hit.url
  const result = await invokeEdgeFunction<{ downloadUrl?: string }>('s3-upload-url', {
    action: 'download',
    key,
  })
  const url = result.ok ? result.data?.downloadUrl : ''
  if (!result.ok || !isViewableHttpUrl(url)) {
    throw new Error(result.ok ? 'Could not open this file' : result.error)
  }
  downloadCache.set(key, { url, exp: Date.now() + 90_000 })
  return url
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function docFromS3(
  file: { name: string; type: string },
  ref: S3FileRef,
  extra?: Partial<UploadedDoc>,
): UploadedDoc {
  return {
    name: file.name,
    data: toS3Ref(ref.key),
    type: file.type,
    storagePath: ref.key,
    cdnUrl: isDurableCdnUrl(ref.cdnUrl) ? ref.cdnUrl : undefined,
    thumbnailUrl: isDurableCdnUrl(ref.thumbUrl) ? ref.thumbUrl : undefined,
    uploaded_at: new Date().toISOString(),
    status: 'received',
    ...extra,
  }
}

export async function uploadOwnedFile(
  file: File | Blob,
  pathPrefix: string,
  opts?: {
    fileName?: string
    contentType?: string
    uploadedBy?: string
    docType?: string
    onProgress?: (pct: number) => void
  },
): Promise<UploadedDoc> {
  const name = opts?.fileName || (file instanceof File ? file.name : 'upload')
  const type = opts?.contentType || (file instanceof File ? file.type : '') || 'application/octet-stream'
  const asFile = file instanceof File ? file : new File([file], name, { type })

  if (!supabaseConfigured) {
    return {
      name,
      data: await readAsDataUrl(asFile),
      type,
      uploaded_by: opts?.uploadedBy,
      uploaded_at: new Date().toISOString(),
      status: 'received',
      doc_type: opts?.docType,
    }
  }

  const prefix = pathPrefix.replace(/\/+$/, '')
  const path = `${prefix}/${sanitizeStorageFileName(name)}`
  const ref = await putS3File(asFile, path, { contentType: type, onProgress: opts?.onProgress })
  return docFromS3({ name, type }, ref, {
    uploaded_by: opts?.uploadedBy,
    doc_type: opts?.docType,
  })
}

export async function uploadApplicationFile(
  applicationId: string,
  fieldId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; storagePath: string; cdnUrl?: string; thumbnailUrl?: string }> {
  console.debug('[AppUpload] Starting', {
    applicationId,
    fieldId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    supabaseConfigured,
  })
  try {
    const doc = await uploadOwnedFile(file, `applications/${applicationId}/${fieldId}`, {
      docType: fieldId,
      onProgress,
    })
    console.debug('[AppUpload] Success', {
      applicationId,
      fieldId,
      storagePath: doc.storagePath,
      cdnUrl: doc.cdnUrl,
      hasData: !!doc.data,
    })
    return {
      url: doc.data,
      storagePath: doc.storagePath || '',
      cdnUrl: doc.cdnUrl,
      thumbnailUrl: doc.thumbnailUrl,
    }
  } catch (err) {
    console.error('[AppUpload] Failed', {
      applicationId,
      fieldId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    throw err
  }
}

export async function resolveApplicationFileUrl(value: string): Promise<string> {
  return resolveUploadedDocUrl({ name: 'file', data: value, type: 'application/octet-stream' })
}

export async function resolveUploadedDocUrl(doc: UploadedDoc): Promise<string> {
  const immediate = immediateFileUrl(doc)
  if (immediate) return immediate
  const key = storedObjectKey(doc)
  if (key && supabaseConfigured) {
    try {
      return await requestDownloadUrl(key)
    } catch (err) {
      console.error('[AppUpload] Could not open stored file', {
        error: err instanceof Error ? err.message : String(err),
      })
      return ''
    }
  }
  return ''
}

export async function uploadDocument(
  talentId: string,
  docId: string,
  file: File,
  uploadedBy?: string,
): Promise<UploadedDoc> {
  return uploadOwnedFile(file, `talents/${talentId}/documents/${docId}`, {
    uploadedBy,
    docType: docId,
  })
}

export async function getDocumentUrl(doc: UploadedDoc): Promise<string> {
  return resolveUploadedDocUrl(doc)
}

export function displayThumbUrl(doc: UploadedDoc): string | null {
  if (isDurableCdnUrl(doc.thumbnailUrl)) return doc.thumbnailUrl
  if (doc.data && (isS3Ref(doc.data) || parseS3Key(doc.data))) {
    const thumb = thumbnailUrl(doc.data)
    return isDurableCdnUrl(thumb) ? thumb : null
  }
  return null
}
