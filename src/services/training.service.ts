import type { Role } from '@/types'
import type { TrainingVideo, TrainingVideoInput } from '@/types/training'
import { persistErrorMessage } from '@/lib/persist-error'
import { sanitizeStorageFileName } from '@/lib/application-files'
import { isHttpVideoUrl } from '@/lib/video-embed'
import { canManageTrainingVideos } from '@/constants/roles'
import {
  supabase,
  supabaseConfigured,
  TRAINING_VIDEOS_BUCKET,
} from '@/lib/supabase'
import { readStorage, writeStorage } from '@/lib/session-storage'
import { writeAuditEvent } from '@/services/audit.service'

const DEMO_KEY = (companyCode: string) => `nto_training_videos_${companyCode.toUpperCase()}`

const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'])
const MAX_UPLOAD_BYTES = 104857600

export function videoVisibleToRole(
  video: TrainingVideo,
  role: Role,
  manageAll: boolean,
): boolean {
  if (manageAll) return true
  if (!video.target_roles?.length) return true
  return video.target_roles.includes(role)
}

export function validateTrainingVideoInput(
  input: TrainingVideoInput,
  hasFile: boolean,
): string | null {
  if (!input.title.trim()) return 'Title is required.'
  const url = input.video_url.trim()
  if (!hasFile && !url) return 'Paste a video link or upload a video file.'
  if (url && !isHttpVideoUrl(url)) return 'Enter a valid http(s) video URL.'
  return null
}

function normalizeVideo(row: TrainingVideo): TrainingVideo {
  return {
    ...row,
    title: row.title?.trim() || '',
    description: row.description || '',
    video_url: row.video_url || '',
    storage_path: row.storage_path || null,
    target_roles: Array.isArray(row.target_roles) ? row.target_roles.filter(Boolean) : [],
  }
}

function readDemo(companyCode: string): TrainingVideo[] {
  const raw = readStorage(DEMO_KEY(companyCode))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as TrainingVideo[]
    return Array.isArray(parsed) ? parsed.map(normalizeVideo) : []
  } catch {
    return []
  }
}

function writeDemo(companyCode: string, videos: TrainingVideo[]) {
  writeStorage(DEMO_KEY(companyCode), JSON.stringify(videos))
}

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `tv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function listTrainingVideos(
  companyCode: string,
  role: Role,
): Promise<{ videos: TrainingVideo[]; error: string | null }> {
  const code = companyCode.toUpperCase()
  const manageAll = canManageTrainingVideos(role)

  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('training_videos')
      .select('*')
      .eq('company_code', code)
      .order('created_at', { ascending: false })
    if (error) return { videos: [], error: persistErrorMessage(error) }
    const videos = ((data ?? []) as TrainingVideo[])
      .map(normalizeVideo)
      .filter((v) => videoVisibleToRole(v, role, manageAll))
    return { videos, error: null }
  }

  return {
    videos: readDemo(code).filter((v) => videoVisibleToRole(v, role, manageAll)),
    error: null,
  }
}

export async function createTrainingVideo(params: {
  companyCode: string
  userId: string
  role: Role
  input: TrainingVideoInput
  file?: File | null
}): Promise<{ video: TrainingVideo | null; error: string | null }> {
  if (!canManageTrainingVideos(params.role)) {
    return { video: null, error: 'Only directors can add training videos.' }
  }
  const hasFile = Boolean(params.file)
  const validation = validateTrainingVideoInput(params.input, hasFile)
  if (validation) return { video: null, error: validation }

  const code = params.companyCode.toUpperCase()
  const now = new Date().toISOString()
  const id = newId()
  let storagePath: string | null = params.input.storage_path || null
  let videoUrl = params.input.video_url.trim()

  if (params.file) {
    const uploaded = await uploadTrainingVideoFile(code, id, params.file)
    if (uploaded.error) return { video: null, error: uploaded.error }
    storagePath = uploaded.storagePath
    if (!videoUrl) videoUrl = uploaded.storagePath ? `storage:${uploaded.storagePath}` : ''
  }

  const row: TrainingVideo = {
    id,
    company_code: code,
    title: params.input.title.trim(),
    description: params.input.description.trim(),
    video_url: videoUrl,
    storage_path: storagePath,
    target_roles: params.input.target_roles,
    created_by: params.userId,
    created_at: now,
    updated_at: now,
  }

  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('training_videos')
      .insert({
        id: row.id,
        company_code: row.company_code,
        title: row.title,
        description: row.description,
        video_url: row.video_url,
        storage_path: row.storage_path,
        target_roles: row.target_roles,
        created_by: row.created_by,
      })
      .select('*')
      .maybeSingle()
    if (error) return { video: null, error: persistErrorMessage(error) }
    const saved = normalizeVideo((data ?? row) as TrainingVideo)
    await writeAuditEvent({
      action: 'training_video_created',
      entity_type: 'training_video',
      entity_id: saved.id,
      details: { title: saved.title, company_code: code },
      user_id: params.userId,
    })
    return { video: saved, error: null }
  }

  const next = [row, ...readDemo(code)]
  writeDemo(code, next)
  return { video: row, error: null }
}

export async function updateTrainingVideo(params: {
  companyCode: string
  role: Role
  id: string
  input: TrainingVideoInput
  file?: File | null
}): Promise<{ video: TrainingVideo | null; error: string | null }> {
  if (!canManageTrainingVideos(params.role)) {
    return { video: null, error: 'Only directors can edit training videos.' }
  }
  const hasFile = Boolean(params.file)
  const validation = validateTrainingVideoInput(params.input, hasFile)
  if (validation) return { video: null, error: validation }

  const code = params.companyCode.toUpperCase()
  let storagePath: string | null = params.input.storage_path || null
  let videoUrl = params.input.video_url.trim()

  if (params.file) {
    const uploaded = await uploadTrainingVideoFile(code, params.id, params.file)
    if (uploaded.error) return { video: null, error: uploaded.error }
    storagePath = uploaded.storagePath
    if (!videoUrl) videoUrl = uploaded.storagePath ? `storage:${uploaded.storagePath}` : ''
  }

  const patch = {
    title: params.input.title.trim(),
    description: params.input.description.trim(),
    video_url: videoUrl,
    storage_path: storagePath,
    target_roles: params.input.target_roles,
    updated_at: new Date().toISOString(),
  }

  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('training_videos')
      .update(patch)
      .eq('id', params.id)
      .eq('company_code', code)
      .select('*')
      .maybeSingle()
    if (error) return { video: null, error: persistErrorMessage(error) }
    if (!data) return { video: null, error: 'Training video not found.' }
    return { video: normalizeVideo(data as TrainingVideo), error: null }
  }

  const list = readDemo(code)
  const idx = list.findIndex((v) => v.id === params.id)
  if (idx < 0) return { video: null, error: 'Training video not found.' }
  const updated = { ...list[idx], ...patch }
  list[idx] = updated
  writeDemo(code, list)
  return { video: updated, error: null }
}

export async function deleteTrainingVideo(params: {
  companyCode: string
  role: Role
  userId: string
  video: TrainingVideo
}): Promise<{ error: string | null }> {
  if (!canManageTrainingVideos(params.role)) {
    return { error: 'Only directors can remove training videos.' }
  }
  const code = params.companyCode.toUpperCase()

  if (supabaseConfigured && supabase) {
    if (params.video.storage_path) {
      await supabase.storage.from(TRAINING_VIDEOS_BUCKET).remove([params.video.storage_path])
    }
    const { error } = await supabase
      .from('training_videos')
      .delete()
      .eq('id', params.video.id)
      .eq('company_code', code)
    if (error) return { error: persistErrorMessage(error) }
    await writeAuditEvent({
      action: 'training_video_deleted',
      entity_type: 'training_video',
      entity_id: params.video.id,
      details: { title: params.video.title, company_code: code },
      user_id: params.userId,
    })
    return { error: null }
  }

  writeDemo(
    code,
    readDemo(code).filter((v) => v.id !== params.video.id),
  )
  return { error: null }
}

export async function resolveTrainingVideoSrc(video: TrainingVideo): Promise<string> {
  if (video.storage_path && supabaseConfigured && supabase) {
    const { data, error } = await supabase.storage
      .from(TRAINING_VIDEOS_BUCKET)
      .createSignedUrl(video.storage_path, 3600)
    if (!error && data?.signedUrl) return data.signedUrl
  }
  const url = video.video_url || ''
  if (url.startsWith('storage:') && supabaseConfigured && supabase) {
    const path = url.replace(/^storage:/, '').replace(/^training-videos\//, '')
    const { data, error } = await supabase.storage.from(TRAINING_VIDEOS_BUCKET).createSignedUrl(path, 3600)
    if (!error && data?.signedUrl) return data.signedUrl
  }
  return url
}

async function uploadTrainingVideoFile(
  companyCode: string,
  videoId: string,
  file: File,
): Promise<{ storagePath: string | null; error: string | null }> {
  if (!VIDEO_MIME.has(file.type) && !/\.(mp4|webm|mov|ogg)$/i.test(file.name)) {
    return { storagePath: null, error: 'Upload an MP4, WebM, MOV, or OGG video file.' }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { storagePath: null, error: 'Video files must be 100 MB or smaller.' }
  }
  if (!supabaseConfigured || !supabase) {
    return {
      storagePath: null,
      error: 'Video file uploads require a connected database. Paste a video link instead.',
    }
  }

  const path = `${companyCode}/${videoId}/${Date.now()}_${sanitizeStorageFileName(file.name)}`
  const { error } = await supabase.storage.from(TRAINING_VIDEOS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || 'video/mp4',
  })
  if (error) return { storagePath: null, error: persistErrorMessage(error) }
  return { storagePath: path, error: null }
}

/** Test helper — clear demo catalog for a company. */
export function resetDemoTrainingVideos(companyCode = 'NZG') {
  writeDemo(companyCode, [])
}
