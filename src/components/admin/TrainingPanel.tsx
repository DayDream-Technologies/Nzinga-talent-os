import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import type { Role } from '@/types'
import type { TrainingVideo, TrainingVideoInput } from '@/types/training'
import { canManageTrainingVideos, roleLabel } from '@/constants/roles'
import { useRoles } from '@/context/RolesContext'
import { useAuth } from '@/hooks/useAuth'
import { T } from '@/lib/tokens'
import { parseVideoUrl, youtubeThumbnail } from '@/lib/video-embed'
import { supabaseConfigured } from '@/lib/supabase'
import {
  createTrainingVideo,
  deleteTrainingVideo,
  listTrainingVideos,
  resolveTrainingVideoSrc,
  updateTrainingVideo,
} from '@/services/training.service'
import { Btn } from '@/components/ui-compat'
import { PageContent } from '@/components/layout/PageContent'
import { ConfirmDialog, useUnsavedClose } from '@/components/ui/ConfirmDialog'

const TRAINING_BY_ROLE: Record<
  string,
  { title: string; items: { label: string; description: string }[] }
> = {
  scout: {
    title: 'Scouting Agent Training',
    items: [
      {
        label: 'Jordan Score Guide',
        description: 'How to score all 5 pillars and write rationales for each prospect.',
      },
      {
        label: 'Prospect Outreach Templates',
        description: 'Email and SMS templates for initial contact and application invites.',
      },
      {
        label: 'Application Review Checklist',
        description: 'Steps for reviewing submitted applications before pipeline import.',
      },
    ],
  },
  team1_lead: {
    title: 'Team 1 Lead Training',
    items: [
      {
        label: 'Review Criteria',
        description: 'Gate decisions at Team 1 Review — approve for Ops, return for revision, or reject.',
      },
      {
        label: 'Escalation Procedures',
        description: 'When and how to escalate borderline prospects to the director.',
      },
    ],
  },
  ops_specialist: {
    title: 'Ops Specialist Training',
    items: [
      {
        label: 'Compliance Checklist',
        description: 'Verify all required documents and compliance fields before ops processing.',
      },
      {
        label: 'Document Verification Guide',
        description: 'How to validate gov ID, tax docs, banking, and proof of income.',
      },
    ],
  },
  team2_lead: {
    title: 'Team 2 Lead Training',
    items: [
      {
        label: 'Audit Standards',
        description: 'Team 2 audit criteria and sign-off requirements.',
      },
      {
        label: 'Quality Review Process',
        description: 'Final quality checks before executive review.',
      },
    ],
  },
  director: {
    title: 'Director Training',
    items: [
      {
        label: 'Platform Overview',
        description: 'End-to-end pipeline flow, roles, and RBAC across all stages.',
      },
      {
        label: 'Admin Guide',
        description: 'User management, role assignment, audit log, and system settings.',
      },
      {
        label: 'Executive Decision Framework',
        description: 'Criteria for signing, archiving, or marking prospects not viable.',
      },
    ],
  },
  success_manager: {
    title: 'Success Manager Training',
    items: [
      {
        label: 'Client Packet QA',
        description:
          'Approve complete packets as Approved - Future, return incomplete packets, and publish contracts to the client portal.',
      },
      {
        label: 'Onboarding Checklist',
        description: 'Portal setup, technical routing, and warm handoff confirmation.',
      },
      {
        label: 'Client Handoff Process',
        description: 'Transition signed talent from executive review to active client status.',
      },
    ],
  },
}

function audienceLabel(roles: string[]): string {
  if (!roles.length) return 'All staff'
  return roles.map((r) => roleLabel(r)).join(', ')
}

function VideoPlayer({ src, title }: { src: string; title: string }) {
  const embed = parseVideoUrl(src)
  if (embed && (embed.kind === 'youtube' || embed.kind === 'vimeo' || embed.kind === 'loom')) {
    return (
      <iframe
        src={embed.src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: 8, background: '#0f172a' }}
      />
    )
  }
  if (
    embed?.kind === 'direct' ||
    src.startsWith('blob:') ||
    src.startsWith('data:video') ||
    src.includes('/storage/v1/object/')
  ) {
    return (
      <video
        src={src}
        controls
        title={title}
        style={{ width: '100%', borderRadius: 8, background: '#0f172a' }}
      />
    )
  }
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      style={{ fontSize: 13, fontWeight: 600, color: T.blue }}
    >
      Open video in a new tab
    </a>
  )
}

export function TrainingPanel() {
  const { user, companyCode } = useAuth()
  const { roles } = useRoles()
  const role = user?.role || 'scout'
  const canManage = canManageTrainingVideos(role)
  const content = TRAINING_BY_ROLE[role] || TRAINING_BY_ROLE.scout

  const [videos, setVideos] = useState<TrainingVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editor, setEditor] = useState<TrainingVideo | 'new' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TrainingVideo | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [playSrc, setPlaySrc] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { videos: next, error: err } = await listTrainingVideos(companyCode || user.company_code || 'NZG', role)
    setVideos(next)
    setError(err || '')
    setLoading(false)
  }, [user, companyCode, role])

  useEffect(() => {
    void load()
  }, [load])

  async function openPlayer(video: TrainingVideo) {
    if (playingId === video.id) {
      setPlayingId(null)
      return
    }
    setPlayingId(video.id)
    if (playSrc[video.id]) return
    const src = await resolveTrainingVideoSrc(video)
    setPlaySrc((prev) => ({ ...prev, [video.id]: src }))
  }

  async function handleDelete() {
    if (!pendingDelete || !user) return
    const { error: err } = await deleteTrainingVideo({
      companyCode: companyCode || user.company_code || 'NZG',
      role,
      userId: user.id,
      video: pendingDelete,
    })
    if (err) setError(err)
    else {
      setSuccess(`Removed “${pendingDelete.title}”.`)
      setPendingDelete(null)
      void load()
    }
  }

  return (
    <PageContent>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: T.t1, fontFamily: "'Syne', sans-serif" }}>
          TMX Academy
        </div>
        <div style={{ fontSize: 13, color: T.t3, marginTop: 3 }}>
          Training videos and resources for {roleLabel(role)}s
        </div>
      </div>

      {error && (
        <div style={{ color: T.red, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{error}</div>
      )}
      {success && (
        <div style={{ color: T.green, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{success}</div>
      )}

      <div
        style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 10,
          padding: '18px 22px',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.t1 }}>Training videos</div>
          {canManage && (
            <Btn variant="primary" sm type="button" onClick={() => setEditor('new')}>
              Add training video
            </Btn>
          )}
        </div>

        {loading ? (
          <div style={{ fontSize: 12, color: T.t3 }}>Loading videos…</div>
        ) : videos.length === 0 ? (
          <div style={{ fontSize: 13, color: T.t3, lineHeight: 1.5 }}>
            {canManage
              ? 'No training videos yet. Add a YouTube, Vimeo, Loom, or direct video link for your team.'
              : 'No training videos have been published for your role yet. Check back after your director adds them.'}
          </div>
        ) : (
          videos.map((video) => {
            const embed = parseVideoUrl(video.video_url)
            const thumb = embed?.kind === 'youtube' && embed.providerId ? youtubeThumbnail(embed.providerId) : null
            const isPlaying = playingId === video.id
            const src = playSrc[video.id] || video.video_url
            return (
              <div
                key={video.id}
                style={{
                  padding: '14px 0',
                  borderBottom: `1px solid ${T.cardBorder}`,
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {thumb && !isPlaying && (
                    <button
                      type="button"
                      onClick={() => void openPlayer(video)}
                      aria-label={`Play ${video.title}`}
                      style={{
                        width: 120,
                        flexShrink: 0,
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        background: 'transparent',
                        borderRadius: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <img src={thumb} alt="" style={{ width: '100%', display: 'block' }} />
                    </button>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>{video.title}</div>
                    {video.description && (
                      <div style={{ fontSize: 12, color: T.t2, lineHeight: 1.5, marginTop: 4 }}>
                        {video.description}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: T.t4, marginTop: 6 }}>
                      {audienceLabel(video.target_roles)}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <Btn sm type="button" variant="primary" onClick={() => void openPlayer(video)}>
                        {isPlaying ? 'Hide video' : 'Play'}
                      </Btn>
                      {canManage && (
                        <>
                          <Btn sm type="button" onClick={() => setEditor(video)}>
                            Edit
                          </Btn>
                          <Btn sm type="button" variant="danger" onClick={() => setPendingDelete(video)}>
                            Remove
                          </Btn>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {isPlaying && src && (
                  <div style={{ marginTop: 12 }}>
                    <VideoPlayer src={src} title={video.title} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div
        style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 10,
          padding: '18px 22px',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 14 }}>
          {content.title}
        </div>
        {content.items.map((item) => (
          <div
            key={item.label}
            style={{
              padding: '12px 0',
              borderBottom: `1px solid ${T.cardBorder}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: T.blue, marginBottom: 4 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12, color: T.t2, lineHeight: 1.5 }}>{item.description}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: 11,
          color: T.t4,
        }}
      >
        {canManage
          ? 'Videos you add here appear in TMX Academy for the roles you select.'
          : 'Contact your director for live training sessions or updated SOP documents.'}
      </div>

      {editor && user && (
        <TrainingVideoEditor
          existing={editor === 'new' ? null : editor}
          roles={roles.map((r) => r.slug)}
          onClose={() => setEditor(null)}
          onSaved={(msg) => {
            setSuccess(msg)
            setEditor(null)
            void load()
          }}
          companyCode={companyCode || user.company_code || 'NZG'}
          userId={user.id}
          role={role}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove training video?"
        message={
          pendingDelete
            ? `“${pendingDelete.title}” will be removed from TMX Academy for everyone.`
            : ''
        }
        confirmLabel="Remove"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </PageContent>
  )
}

function TrainingVideoEditor({
  existing,
  roles,
  onClose,
  onSaved,
  companyCode,
  userId,
  role,
}: {
  existing: TrainingVideo | null
  roles: string[]
  onClose: () => void
  onSaved: (message: string) => void
  companyCode: string
  userId: string
  role: Role
}) {
  const [title, setTitle] = useState(existing?.title || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [videoUrl, setVideoUrl] = useState(
    existing?.video_url?.startsWith('storage:') ? '' : existing?.video_url || '',
  )
  const [targetRoles, setTargetRoles] = useState<string[]>(existing?.target_roles || [])
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const dirty =
    title !== (existing?.title || '') ||
    description !== (existing?.description || '') ||
    videoUrl !== (existing?.video_url?.startsWith('storage:') ? '' : existing?.video_url || '') ||
    file !== null ||
    targetRoles.join(',') !== (existing?.target_roles || []).join(',')

  const { requestClose, dialog } = useUnsavedClose(dirty && !saving, onClose)

  function toggleRole(slug: string) {
    setTargetRoles((prev) => (prev.includes(slug) ? prev.filter((r) => r !== slug) : [...prev, slug]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const input: TrainingVideoInput = {
      title,
      description,
      video_url: videoUrl,
      storage_path: existing?.storage_path || null,
      target_roles: targetRoles,
    }
    setSaving(true)
    const result = existing
      ? await updateTrainingVideo({ companyCode, role, id: existing.id, input, file })
      : await createTrainingVideo({ companyCode, userId, role, input, file })
    setSaving(false)
    if (result.error || !result.video) {
      setError(result.error || 'Could not save the video.')
      return
    }
    onSaved(existing ? `Updated “${result.video.title}”.` : `Added “${result.video.title}”.`)
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
          padding: 20,
        }}
        onClick={requestClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="training-video-editor-title"
          style={{
            background: T.cardBg,
            borderRadius: 12,
            padding: '28px 32px',
            width: 520,
            maxWidth: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={requestClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              color: T.t3,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <h2
            id="training-video-editor-title"
            style={{ fontSize: 18, fontWeight: 700, color: T.t1, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}
          >
            {existing ? 'Edit training video' : 'Add training video'}
          </h2>
          <p style={{ fontSize: 12, color: T.t3, marginBottom: 20 }}>
            Paste a YouTube, Vimeo, Loom, or direct video link
            {supabaseConfigured ? ', or upload an MP4/WebM file (up to 100 MB)' : ''}. Leave roles unchecked to share
            with all staff.
          </p>

          <form onSubmit={(e) => void handleSubmit(e)}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.t3, marginBottom: 3 }}>
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Jordan Score walkthrough"
              style={fieldStyle}
            />

            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.t3, margin: '12px 0 3px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What should the team take away from this video?"
              style={{ ...fieldStyle, resize: 'vertical' }}
            />

            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.t3, margin: '12px 0 3px' }}>
              Video URL
            </label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              style={fieldStyle}
            />

            {supabaseConfigured && (
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.t3, marginBottom: 3 }}>
                  Or upload a video file
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/ogg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ fontSize: 12, color: T.t2 }}
                />
                {file && (
                  <div style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>
                    {file.name} ({Math.round(file.size / 1024 / 1024)} MB)
                  </div>
                )}
              </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 500, color: T.t3, margin: '14px 0 6px' }}>
              Visible to
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roles.map((slug) => {
                const checked = targetRoles.includes(slug)
                return (
                  <label
                    key={slug}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: T.t2,
                      cursor: 'pointer',
                      border: `1px solid ${checked ? T.blue : T.cardBorder}`,
                      background: checked ? T.blueL : T.mutedBg,
                      borderRadius: 999,
                      padding: '4px 10px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(slug)}
                    />
                    {roleLabel(slug)}
                  </label>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: T.t4, marginTop: 6 }}>
              {targetRoles.length ? audienceLabel(targetRoles) : 'All staff will see this video.'}
            </div>

            {error && (
              <div style={{ color: T.red, fontSize: 12, marginTop: 12 }}>{error}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <Btn type="button" onClick={requestClose}>
                Cancel
              </Btn>
              <Btn type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : existing ? 'Save changes' : 'Add video'}
              </Btn>
            </div>
          </form>
        </div>
      </div>
      {dialog}
    </>
  )
}

const fieldStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 12px',
  borderRadius: 6,
  border: `1px solid ${T.inputBorder}`,
  background: T.inputBg,
  color: T.t1,
  fontSize: 13,
  fontFamily: 'inherit',
}
