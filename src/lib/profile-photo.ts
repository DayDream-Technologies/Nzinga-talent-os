import { sanitizeStorageFileName } from '@/lib/application-files'
import { DOCUMENTS_BUCKET, supabase, supabaseConfigured } from '@/lib/supabase'
import type { Application } from '@/types/application'
import type { AgencyProspect, AgencyTalent } from '@/types/agency'
import type { Talent, UploadedDoc } from '@/types/talent'

function photoFromApplication(app: Application | null | undefined): UploadedDoc | null {
  const data = app?.data
  const raw = data?.doc_profile_photo
  if (!raw || typeof raw === 'boolean') return null
  const value = String(raw)
  if (!value) return null
  return {
    name: String(data.doc_profile_photo_name || 'Profile Photo'),
    data: value,
    type: String(data.doc_profile_photo_type || 'image/jpeg'),
    doc_type: 'profile_photo',
    uploaded_at: new Date().toISOString(),
    uploaded_by: 'applicant',
    status: 'received',
  }
}

export function initialsAvatarDataUrl(initials: string, bg = '#7c3aed'): string {
  const safe = initials.replace(/[^A-Za-z0-9]/g, '').slice(0, 3) || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect fill="${bg}" width="256" height="256"/><text x="128" y="152" font-size="96" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="700">${safe}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function seedProfilePhoto(name: string, initials: string, bg?: string): UploadedDoc {
  return {
    name: `${name.replace(/\s+/g, '_')}_profile.svg`,
    data: initialsAvatarDataUrl(initials, bg),
    type: 'image/svg+xml',
    doc_type: 'profile_photo',
    uploaded_at: '2026-04-16T13:30:00Z',
    uploaded_by: 'seed',
    status: 'verified',
  }
}

export function isImageDoc(doc: UploadedDoc | null | undefined): boolean {
  if (!doc) return false
  return Boolean(doc.type?.startsWith('image/')) || /\.(png|jpe?g|gif|webp|svg)$/i.test(doc.name || '')
}

/** Staff photo on the account/roster wins over pipeline and application files. */
export function resolveProfilePhoto(opts: {
  pipelineTalent?: Talent | null
  rosterTalent?: AgencyTalent | null
  prospect?: AgencyProspect | null
  application?: Application | null
}): UploadedDoc | null {
  if (opts.rosterTalent?.profilePhoto?.data) return opts.rosterTalent.profilePhoto
  if (opts.prospect?.profilePhoto?.data) return opts.prospect.profilePhoto
  const pipeline = opts.pipelineTalent?.uploaded_docs?.profile_photo
  if (pipeline?.data) return pipeline
  return photoFromApplication(opts.application)
}

export function readImageFileAsDoc(file: File, uploadedBy: string = 'staff'): Promise<UploadedDoc> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        name: file.name,
        data: String(reader.result || ''),
        type: file.type || 'image/jpeg',
        doc_type: 'profile_photo',
        uploaded_at: new Date().toISOString(),
        uploaded_by: uploadedBy,
        status: 'received',
      })
    }
    reader.onerror = () => reject(reader.error || new Error('Could not read photo'))
    reader.readAsDataURL(file)
  })
}

const PROFILE_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
])

/** Upload a profile photo to Supabase Storage, or embed as a data URL in demo/offline mode. */
export async function uploadProfilePhoto(
  file: File,
  ownerId: string,
  uploadedBy: string = 'staff',
): Promise<UploadedDoc> {
  if (!supabaseConfigured || !supabase) {
    return readImageFileAsDoc(file, uploadedBy)
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Log in to upload a profile photo.')
  }

  const safeOwner = sanitizeStorageFileName(ownerId || 'unassigned')
  const path = `${safeOwner}/profile_photo/${Date.now()}_${sanitizeStorageFileName(file.name)}`
  const contentType = file.type && PROFILE_PHOTO_TYPES.has(file.type) ? file.type : 'application/octet-stream'
  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    upsert: true,
    contentType,
  })
  if (uploadError) {
    console.error('[uploadProfilePhoto]', uploadError.message, { path, contentType, size: file.size })
    throw new Error(uploadError.message || 'Could not upload photo. Please try again.')
  }

  const { data: urlData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path)
  return {
    name: file.name,
    data: urlData.publicUrl,
    type: file.type || 'image/jpeg',
    storagePath: path,
    doc_type: 'profile_photo',
    uploaded_at: new Date().toISOString(),
    uploaded_by: uploadedBy,
    status: 'received',
  }
}
