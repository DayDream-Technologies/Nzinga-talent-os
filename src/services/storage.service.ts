import {
  parseApplicationStoragePath,
  sanitizeStorageFileName,
  toApplicationStorageRef,
} from '@/lib/application-files'
import { APPLICATION_DOCS_BUCKET, DOCUMENTS_BUCKET, supabase, supabaseConfigured } from '@/lib/supabase'
import type { UploadedDoc } from '@/types'

export async function uploadApplicationFile(
  applicationId: string,
  fieldId: string,
  file: File,
): Promise<{ url: string; storagePath: string }> {
  if (!supabaseConfigured || !supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        resolve({ url: ev.target?.result as string, storagePath: '' })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Log in to upload files so they can be saved with your application.')
  }

  const path = `${applicationId}/${fieldId}/${Date.now()}_${sanitizeStorageFileName(file.name)}`
  const allowedTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ])
  const contentType = file.type && allowedTypes.has(file.type) ? file.type : 'application/octet-stream'
  const { error: uploadError } = await supabase.storage.from(APPLICATION_DOCS_BUCKET).upload(path, file, {
    upsert: true,
    contentType,
  })
  if (uploadError) {
    console.error('[uploadApplicationFile]', uploadError.message, { path, contentType, size: file.size })
    throw new Error(uploadError.message || 'Could not upload file. Please try again.')
  }

  return { url: toApplicationStorageRef(path), storagePath: path }
}

export async function resolveApplicationFileUrl(value: string): Promise<string> {
  if (!value || value.startsWith('data:')) return value
  const path = parseApplicationStoragePath(value)
  if (!path || !supabaseConfigured || !supabase) return value
  const { data, error } = await supabase.storage.from(APPLICATION_DOCS_BUCKET).createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) return value
  return data.signedUrl
}

export async function resolveUploadedDocUrl(doc: UploadedDoc): Promise<string> {
  if (doc.data?.startsWith('data:')) return doc.data
  const fromValue = await resolveApplicationFileUrl(doc.data)
  if (fromValue !== doc.data) return fromValue
  if (!doc.storagePath || !supabaseConfigured || !supabase) return doc.data
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(doc.storagePath, 3600)
  if (error || !data?.signedUrl) {
    const appSigned = await supabase.storage.from(APPLICATION_DOCS_BUCKET).createSignedUrl(doc.storagePath, 3600)
    return appSigned.data?.signedUrl || doc.data
  }
  return data.signedUrl
}

export async function uploadDocument(
  talentId: string,
  docId: string,
  file: File,
): Promise<UploadedDoc> {
  if (!supabaseConfigured || !supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        resolve({
          name: file.name,
          data: ev.target?.result as string,
          type: file.type,
        })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const path = `${talentId}/${docId}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path)
  return {
    name: file.name,
    data: urlData.publicUrl,
    type: file.type,
    storagePath: path,
  }
}

export async function getDocumentUrl(doc: UploadedDoc): Promise<string> {
  if (!doc.storagePath || !supabaseConfigured || !supabase) {
    return doc.data
  }
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}
