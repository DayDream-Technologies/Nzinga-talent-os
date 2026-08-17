import { useCallback, useMemo, useState } from 'react'
import { useAppData } from '@/context/AppDataContext'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAuth } from '@/hooks/useAuth'
import { readStorage, STORAGE_NOTIF_READ, writeStorage } from '@/lib/session-storage'
import { isAppComplete } from '@/constants/app-sections'

export type AppNotification = {
  id: string
  title: string
  body: string
  path: string
  ts: string
}

function loadReadIds(): Set<string> {
  try {
    const raw = readStorage(STORAGE_NOTIF_READ)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

export function useNotifications() {
  const { user } = useAuth()
  const { tasks, history, applications } = useAppData()
  const { tickets } = useAgencyData()
  const [readIds, setReadIds] = useState(loadReadIds)

  const items = useMemo(() => {
    if (!user) return [] as AppNotification[]
    const list: AppNotification[] = []

    for (const t of tasks) {
      if (t.assigned_to === user.id && t.status === 'open') {
        list.push({
          id: `task-${t.id}`,
          title: t.priority === 'urgent' ? 'Urgent task' : 'Open task',
          body: t.title,
          path: 'agency-tasks',
          ts: t.due || new Date().toISOString(),
        })
      }
    }

    for (const h of history) {
      if (typeof h.text === 'string' && h.text.includes(`@${user.name}`)) {
        list.push({
          id: `mention-${h.id}`,
          title: 'Mentioned in a note',
          body: h.text.slice(0, 80),
          path: 'workspace',
          ts: h.ts,
        })
      }
    }

    for (const app of Object.values(applications || {})) {
      if (app.status === 'submitted' && isAppComplete(app)) {
        list.push({
          id: `app-ready-${app.id}`,
          title: 'Application ready to import',
          body: app.talent_name || 'Applicant',
          path: 'applications',
          ts: app.last_saved || app.created_at,
        })
      } else if (app.status === 'pending_guardian' || app.status === 'sent') {
        list.push({
          id: `app-attn-${app.id}`,
          title: app.status === 'pending_guardian' ? 'Pending parent approval' : 'Application awaiting start',
          body: app.talent_name || 'Applicant',
          path: 'applications',
          ts: app.last_saved || app.created_at,
        })
      }
    }

    for (const tk of tickets) {
      if (tk.status === 'open' && tk.priority === 'high') {
        list.push({
          id: `tkt-${tk.id}`,
          title: 'Urgent support ticket',
          body: tk.subject,
          path: 'support-tickets',
          ts: tk.createdAt,
        })
      }
    }

    return list.sort((a, b) => (a.ts < b.ts ? 1 : -1)).slice(0, 40)
  }, [user, tasks, history, applications, tickets])

  const unreadCount = useMemo(
    () => items.filter((i) => !readIds.has(i.id)).length,
    [items, readIds],
  )

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      writeStorage(STORAGE_NOTIF_READ, JSON.stringify([...next]))
      return next
    })
  }, [])

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev)
      for (const i of items) next.add(i.id)
      writeStorage(STORAGE_NOTIF_READ, JSON.stringify([...next]))
      return next
    })
  }, [items])

  return { items, unreadCount, readIds, markRead, markAllRead }
}
