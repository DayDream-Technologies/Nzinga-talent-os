import {
  type Announcement,
  readLocalAnnouncements,
  writeLocalAnnouncements,
} from '@/lib/announcements'
import { supabase, supabaseConfigured } from '@/lib/supabase'

interface AnnouncementRow {
  id: string
  title: string
  body: string
  created_at: string
  updated_at: string
}

function tableMissing(error: { message?: string; code?: string } | null): boolean {
  const message = error?.message || ''
  return error?.code === 'PGRST205' || error?.code === '42P01' || /schema cache|does not exist/i.test(message)
}

function fromRow(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listAnnouncements(): Promise<Announcement[]> {
  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, created_at, updated_at')
      .order('updated_at', { ascending: false })
    if (error) {
      if (tableMissing(error)) return readLocalAnnouncements().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      throw new Error(error.message)
    }
    return (data as AnnouncementRow[] | null)?.map(fromRow) ?? []
  }
  return readLocalAnnouncements().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function saveAnnouncement(input: {
  id?: string
  title: string
  body: string
}): Promise<Announcement> {
  const title = input.title.trim()
  const body = input.body.trim()
  if (!title) throw new Error('Title is required.')

  if (supabaseConfigured && supabase) {
    if (input.id) {
      const { data, error } = await supabase
        .from('announcements')
        .update({ title, body, updated_at: new Date().toISOString() })
        .eq('id', input.id)
        .select('id, title, body, created_at, updated_at')
        .single()
      if (error) {
        if (!tableMissing(error)) throw new Error(error.message)
      } else {
        return fromRow(data as AnnouncementRow)
      }
    } else {
    const { data, error } = await supabase
      .from('announcements')
      .insert({ title, body })
      .select('id, title, body, created_at, updated_at')
      .single()
    if (error) {
      if (!tableMissing(error)) throw new Error(error.message)
    } else {
      return fromRow(data as AnnouncementRow)
    }
    }
  }

  const now = new Date().toISOString()
  const items = readLocalAnnouncements()
  if (input.id) {
    const next = items.map((item) =>
      item.id === input.id ? { ...item, title, body, updatedAt: now } : item,
    )
    writeLocalAnnouncements(next)
    const saved = next.find((item) => item.id === input.id)
    if (!saved) throw new Error('Announcement was not found.')
    return saved
  }
  const created: Announcement = {
    id: `ann_${Date.now()}`,
    title,
    body,
    createdAt: now,
    updatedAt: now,
  }
  writeLocalAnnouncements([created, ...items])
  return created
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (supabaseConfigured && supabase) {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error && !tableMissing(error)) throw new Error(error.message)
    if (!error) return
  }
  writeLocalAnnouncements(readLocalAnnouncements().filter((item) => item.id !== id))
}
