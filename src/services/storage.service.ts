import { invokeEdgeFunction } from '@/lib/edge-functions'
import {
  isEmbeddedDataUrl,
  isS3Ref,
  parseS3Key,
  sanitizeStorageFileName,
  toS3Ref,
} from '@/lib/application-files'
import { resolveS3Url, thumbnailUrl, uploadFile as putS3File, type S3FileRef } from '@/lib/s3-storage'
import { supabaseConfigured } from '@/lib/supabase'
import type { UploadedDoc } from '@/types'

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
    cdnUrl: ref.cdnUrl,
    thumbnailUrl: ref.thumbUrl,
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
  const doc = await uploadOwnedFile(file, `applications/${applicationId}/${fieldId}`, {
    docType: fieldId,
    onProgress,
  })
  return {
    url: doc.data,
    storagePath: doc.storagePath || '',
    cdnUrl: doc.cdnUrl,
    thumbnailUrl: doc.thumbnailUrl,
  }
}

export async function resolveApplicationFileUrl(value: string): Promise<string> {
  if (!value || isEmbeddedDataUrl(value)) return value
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  const key = parseS3Key(value)
  if (key) return resolveS3Url(toS3Ref(key))
  return value
}

export async function resolveUploadedDocUrl(doc: UploadedDoc): Promise<string> {
  if (doc.cdnUrl) return doc.cdnUrl
  if (doc.data?.startsWith('data:')) return doc.data
  if (doc.data?.startsWith('http://') || doc.data?.startsWith('https://')) return doc.data
  if (isS3Ref(doc.data) || parseS3Key(doc.data)) return resolveS3Url(doc.data)
  if (doc.storagePath) {
    const key = parseS3Key(doc.storagePath) || parseS3Key(toS3Ref(doc.storagePath))
    if (key) return resolveS3Url(toS3Ref(key))
  }
  return doc.data
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
  if (doc.thumbnailUrl) return doc.thumbnailUrl
  if (doc.data && (isS3Ref(doc.data) || parseS3Key(doc.data))) return thumbnailUrl(doc.data)
  return null
}
