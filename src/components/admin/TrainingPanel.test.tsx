import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/types'
import type { TrainingVideo } from '@/types/training'

const sampleVideo: TrainingVideo = {
  id: 'tv1',
  company_code: 'NZG',
  title: 'Jordan Score walkthrough',
  description: 'How to score all five pillars.',
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  target_roles: ['scout'],
  created_at: '2026-08-31T12:00:00.000Z',
  updated_at: '2026-08-31T12:00:00.000Z',
}

const director: User = {
  id: 'u5',
  name: 'Simone Nzinga',
  initials: 'SN',
  role: 'director',
  email: 'simone@nzinga.co',
  password: 'director123',
  title: 'Director',
  color: '#2563eb',
  company_code: 'NZG',
}

const scout: User = {
  ...director,
  id: 'u1',
  name: 'Jordan Hayes',
  initials: 'JH',
  role: 'scout',
  email: 'jordan@nzinga.co',
  password: 'scout123',
  title: 'Talent Scout',
}

const { listTrainingVideos, createTrainingVideo, updateTrainingVideo, deleteTrainingVideo, authState } = vi.hoisted(
  () => ({
    listTrainingVideos: vi.fn(),
    createTrainingVideo: vi.fn(),
    updateTrainingVideo: vi.fn(),
    deleteTrainingVideo: vi.fn(),
    authState: { user: null as User | null },
  }),
)

vi.mock('@/services/training.service', () => ({
  listTrainingVideos,
  createTrainingVideo,
  updateTrainingVideo,
  deleteTrainingVideo,
  resolveTrainingVideoSrc: async (video: TrainingVideo) => video.video_url,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: null,
  supabaseConfigured: false,
  TRAINING_VIDEOS_BUCKET: 'training-videos',
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: authState.user, companyCode: 'NZG' }),
}))

vi.mock('@/context/RolesContext', () => ({
  useRoles: () => ({
    roles: [
      { slug: 'scout', name: 'Scouting Agent' },
      { slug: 'director', name: 'Director' },
    ],
    loading: false,
    reload: async () => {},
  }),
}))

import { TrainingPanel } from './TrainingPanel'

describe('TrainingPanel', () => {
  beforeEach(() => {
    authState.user = director
    listTrainingVideos.mockResolvedValue({ videos: [sampleVideo], error: null })
    createTrainingVideo.mockResolvedValue({ video: sampleVideo, error: null })
    updateTrainingVideo.mockResolvedValue({ video: sampleVideo, error: null })
    deleteTrainingVideo.mockResolvedValue({ error: null })
  })

  it('lets directors add a training video', async () => {
    listTrainingVideos.mockResolvedValueOnce({ videos: [], error: null })
    render(<TrainingPanel />)

    expect(await screen.findByText('TMX Academy')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Add training video' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByPlaceholderText(/Jordan Score walkthrough/i), {
      target: { value: 'Jordan Score walkthrough' },
    })
    fireEvent.change(within(dialog).getByPlaceholderText(/youtube.com/i), {
      target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add video' }))

    await waitFor(() => {
      expect(createTrainingVideo).toHaveBeenCalledTimes(1)
    })
    expect(createTrainingVideo.mock.calls[0][0].role).toBe('director')
    expect(createTrainingVideo.mock.calls[0][0].input.title).toBe('Jordan Score walkthrough')
  })

  it('hides add/edit controls from scouts and still lists videos', async () => {
    authState.user = scout
    render(<TrainingPanel />)

    expect(await screen.findByText('Jordan Score walkthrough')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add training video' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })
})
