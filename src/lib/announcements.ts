export interface Announcement {
  id: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'nto_announcements'

export function readLocalAnnouncements(): Announcement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Announcement[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeLocalAnnouncements(items: Announcement[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* private mode */
  }
}

export function latestAnnouncement(items: Announcement[]): Announcement | null {
  if (!items.length) return null
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
}
