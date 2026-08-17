import { useMemo } from 'react'
import { useTalentDirectory } from '@/hooks/useTalentDirectory'
import { useAppData } from '@/context/AppDataContext'
import { filterAgencyNav } from '@/constants/agency-nav'
import { useAuth } from '@/hooks/useAuth'
import { talentAccountPath } from '@/lib/talent-account'
import { formatAccountDisplay } from '@/lib/session-storage'

export type CommandSearchResult = {
  id: string
  label: string
  sublabel: string
  path: string
  kind: 'person' | 'application' | 'page'
  score: number
}

function scoreMatch(query: string, text: string): number {
  const q = query.trim().toLowerCase()
  const t = (text || '').toLowerCase()
  if (!q || !t) return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 50
  // fuzzy: all chars in order
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++
  }
  return qi === q.length ? 25 : 0
}

export function useCommandSearch(query: string): CommandSearchResult[] {
  const directory = useTalentDirectory()
  const { applications } = useAppData()
  const { user } = useAuth()

  return useMemo(() => {
    const q = query.trim()
    if (q.length < 2) return []

    const results: CommandSearchResult[] = []

    for (const t of directory.list) {
      const s = Math.max(
        scoreMatch(q, t.name),
        scoreMatch(q, t.accountId),
        scoreMatch(q, formatAccountDisplay(t.accountId)),
        scoreMatch(q, t.socialHandle || ''),
      )
      if (s > 0) {
        results.push({
          id: `talent-${t.accountId}`,
          label: t.name,
          sublabel: `${formatAccountDisplay(t.accountId)} · ${t.statusLabel}`,
          path: talentAccountPath(t.accountId).replace(/^\//, ''),
          kind: 'person',
          score: s,
        })
      }
    }

    for (const app of Object.values(applications || {})) {
      const s = Math.max(
        scoreMatch(q, app.talent_name || ''),
        scoreMatch(q, app.talent_email || ''),
        scoreMatch(q, app.access_code || ''),
      )
      if (s > 0) {
        results.push({
          id: `app-${app.id}`,
          label: app.talent_name || 'Application',
          sublabel: `App · ${app.status} · ${app.access_code || ''}`,
          path: 'applications',
          kind: 'application',
          score: s - 5,
        })
      }
    }

    if (user) {
      const nav = filterAgencyNav(user.role)
      for (const cat of nav) {
        for (const g of cat.groups) {
          for (const item of g.items) {
            const s = Math.max(scoreMatch(q, item.label), scoreMatch(q, item.path))
            if (s > 0) {
              results.push({
                id: `nav-${item.id}`,
                label: item.label,
                sublabel: 'Go to page',
                path: item.path,
                kind: 'page',
                score: s + 10,
              })
            }
          }
        }
      }
      for (const [label, path] of [
        ['My Workspace', 'workspace'],
        ['Settings', 'settings'],
        ['Clients', 'clients'],
        ['Prospect Tracking Board', 'prospect-tracking'],
      ] as const) {
        const s = scoreMatch(q, label)
        if (s > 0) {
          results.push({
            id: `nav-extra-${path}`,
            label,
            sublabel: 'Go to page',
            path,
            kind: 'page',
            score: s + 12,
          })
        }
      }
    }

    results.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    const seen = new Set<string>()
    return results.filter((r) => {
      const key = `${r.kind}:${r.path}:${r.label}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 12)
  }, [query, directory.list, applications, user])
}
