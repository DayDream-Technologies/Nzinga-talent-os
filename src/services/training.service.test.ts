import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TrainingVideoInput } from '@/types/training'

vi.mock('@/lib/supabase', () => ({
  supabase: null,
  supabaseConfigured: false,
  TRAINING_VIDEOS_BUCKET: 'training-videos',
}))

vi.mock('@/services/audit.service', () => ({
  writeAuditEvent: vi.fn(async () => ({ error: null })),
}))

import {
  createTrainingVideo,
  deleteTrainingVideo,
  listTrainingVideos,
  resetDemoTrainingVideos,
  updateTrainingVideo,
  validateTrainingVideoInput,
  videoVisibleToRole,
} from './training.service'

const input: TrainingVideoInput = {
  title: 'Jordan Score walkthrough',
  description: 'How to score all five pillars.',
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  target_roles: ['scout'],
}

describe('validateTrainingVideoInput', () => {
  it('requires a title and a URL or file', () => {
    expect(validateTrainingVideoInput({ ...input, title: '  ' }, false)).toBe('Title is required.')
    expect(
      validateTrainingVideoInput({ ...input, video_url: '' }, false),
    ).toBe('Paste a video link or upload a video file.')
    expect(validateTrainingVideoInput({ ...input, video_url: 'nope' }, false)).toBe(
      'Enter a valid http(s) video URL.',
    )
    expect(validateTrainingVideoInput({ ...input, video_url: '' }, true)).toBeNull()
    expect(validateTrainingVideoInput(input, false)).toBeNull()
  })
})

describe('videoVisibleToRole', () => {
  const video = {
    id: '1',
    company_code: 'NZG',
    title: 'Scout only',
    description: '',
    video_url: 'https://youtu.be/dQw4w9WgXcQ',
    target_roles: ['scout'],
    created_at: '',
    updated_at: '',
  }

  it('shows role-targeted videos to that role and directors', () => {
    expect(videoVisibleToRole(video, 'scout', false)).toBe(true)
    expect(videoVisibleToRole(video, 'ops_specialist', false)).toBe(false)
    expect(videoVisibleToRole(video, 'director', true)).toBe(true)
  })

  it('shows all-staff videos to every role', () => {
    expect(videoVisibleToRole({ ...video, target_roles: [] }, 'ops_specialist', false)).toBe(true)
  })
})

describe('training.service demo catalog', () => {
  beforeEach(() => {
    localStorage.clear()
    resetDemoTrainingVideos('NZG')
  })

  it('lets directors add, list, edit, and delete videos', async () => {
    const created = await createTrainingVideo({
      companyCode: 'NZG',
      userId: 'u5',
      role: 'director',
      input,
    })
    expect(created.error).toBeNull()
    expect(created.video?.title).toBe('Jordan Score walkthrough')

    const asScout = await listTrainingVideos('NZG', 'scout')
    expect(asScout.videos).toHaveLength(1)

    const asOps = await listTrainingVideos('NZG', 'ops_specialist')
    expect(asOps.videos).toHaveLength(0)

    const asDirector = await listTrainingVideos('NZG', 'director')
    expect(asDirector.videos).toHaveLength(1)

    const updated = await updateTrainingVideo({
      companyCode: 'NZG',
      role: 'director',
      id: created.video!.id,
      input: { ...input, title: 'Jordan Score (updated)', target_roles: [] },
    })
    expect(updated.error).toBeNull()
    expect(updated.video?.title).toBe('Jordan Score (updated)')

    const opsAfter = await listTrainingVideos('NZG', 'ops_specialist')
    expect(opsAfter.videos).toHaveLength(1)

    const removed = await deleteTrainingVideo({
      companyCode: 'NZG',
      role: 'director',
      userId: 'u5',
      video: updated.video!,
    })
    expect(removed.error).toBeNull()
    expect((await listTrainingVideos('NZG', 'director')).videos).toHaveLength(0)
  })

  it('blocks scouts from creating videos', async () => {
    const result = await createTrainingVideo({
      companyCode: 'NZG',
      userId: 'u1',
      role: 'scout',
      input,
    })
    expect(result.video).toBeNull()
    expect(result.error).toMatch(/directors/i)
  })

  it('rejects file uploads in demo mode', async () => {
    const file = new File(['x'], 'lesson.mp4', { type: 'video/mp4' })
    const result = await createTrainingVideo({
      companyCode: 'NZG',
      userId: 'u5',
      role: 'director',
      input: { ...input, video_url: '' },
      file,
    })
    expect(result.video).toBeNull()
    expect(result.error).toMatch(/video link/i)
  })
})
