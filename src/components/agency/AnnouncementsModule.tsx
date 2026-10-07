import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn, Field, Panel, inputStyle } from '@/components/agency/AgencyUI'
import { latestAnnouncement, type Announcement } from '@/lib/announcements'
import { T } from '@/lib/tokens'
import {
  deleteAnnouncement,
  listAnnouncements,
  saveAnnouncement,
} from '@/services/announcements.service'
import { hasPermission } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'

export function useLatestAnnouncement() {
  const [text, setText] = useState('No new announcements')
  useEffect(() => {
    let cancelled = false
    listAnnouncements()
      .then((items) => {
        if (cancelled) return
        const latest = latestAnnouncement(items)
        setText(latest ? latest.title : 'No new announcements')
      })
      .catch(() => {
        if (!cancelled) setText('No new announcements')
      })
    return () => {
      cancelled = true
    }
  }, [])
  return text
}

export function AnnouncementsModule() {
  const { user } = useAuth()
  const canEdit = Boolean(user && (hasPermission(user.role, 'admin_access') || user.role === 'director'))
  const [items, setItems] = useState<Announcement[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      setItems(await listAnnouncements())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load announcements.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  function resetForm() {
    setTitle('')
    setBody('')
    setEditingId(null)
  }

  async function onSave(action: 'new' | 'finish') {
    try {
      await saveAnnouncement({ id: editingId || undefined, title, body })
      await refresh()
      resetForm()
      if (action === 'finish') {
        /* stay on the list */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    }
  }

  return (
    <Panel title="Announcements">
      {error && <div style={{ color: T.red, fontSize: 13, marginBottom: 10 }}>{error}</div>}
      {loading && <div style={{ color: T.t3, fontSize: 13, marginBottom: 10 }}>Loading…</div>}
      <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: `1px solid ${T.cardBorder}`,
              borderRadius: 8,
              padding: '12px 14px',
              background: T.cardBg,
            }}
          >
            <div style={{ fontWeight: 700, color: T.t1 }}>{item.title}</div>
            {item.body && <div style={{ fontSize: 13, color: T.t2, marginTop: 4, whiteSpace: 'pre-wrap' }}>{item.body}</div>}
            <div style={{ fontSize: 11, color: T.t3, marginTop: 6 }}>
              {new Date(item.updatedAt).toLocaleString()}
            </div>
            {canEdit && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Btn
                  variant="secondary"
                  onClick={() => {
                    setEditingId(item.id)
                    setTitle(item.title)
                    setBody(item.body)
                  }}
                >
                  Edit
                </Btn>
                <Btn
                  variant="danger"
                  onClick={() => {
                    void deleteAnnouncement(item.id).then(refresh).catch((err) => {
                      setError(err instanceof Error ? err.message : 'Could not delete.')
                    })
                  }}
                >
                  Remove
                </Btn>
              </div>
            )}
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div style={{ color: T.t3, fontSize: 13 }}>No announcements yet.</div>
        )}
      </div>
      {canEdit && (
        <div>
          <Field label="Title">
            <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Details">
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => void onSave('new')}>
              Save and New
            </Btn>
            <Btn onClick={() => void onSave('finish')}>Save and Finish</Btn>
          </div>
        </div>
      )}
    </Panel>
  )
}

export function AnnouncementFooterLink({
  accent,
  onAcademy,
}: {
  accent: string
  onAcademy: () => void
}) {
  const nav = useNavigate()
  const text = useLatestAnnouncement()
  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={() => nav('/announcements')}
        onKeyDown={(e) => e.key === 'Enter' && nav('/announcements')}
        style={{ fontSize: 14, color: T.t3, cursor: 'pointer' }}
      >
        📢 <strong style={{ color: T.t1, fontSize: 15 }}>Announcements</strong> — {text}
      </span>
      <span
        onClick={onAcademy}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onAcademy()}
        style={{ fontSize: 14, color: accent, cursor: 'pointer' }}
      >
        🎓 TMX Academy
      </span>
    </>
  )
}
