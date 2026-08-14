import type { AgencyProspect, AgencyTalent } from '@/types/agency'
import type { Talent } from '@/types/talent'

export type TalentKind = 'prospect' | 'roster' | 'pipeline'

export interface TalentAccountEntry {
  accountId: string
  name: string
  kinds: TalentKind[]
  email?: string
  phone?: string
  location?: string
  workArea?: string
  niches: string[]
  statusLabel: string
  contractStart?: string | null
  contractEnd?: string | null
  source?: string
  submittedAt?: string
  socialHandle?: string
  platform?: string
  union?: string
  available?: boolean
  bookedDates?: string[]
  role?: string
  pipelineId?: string
}

export function normalizeTalentName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function talentAccountPath(accountId: string): string {
  return `/talent/${encodeURIComponent(accountId)}`
}

export function buildTalentDirectory(input: {
  pipeline: Talent[]
  roster: AgencyTalent[]
  prospects: AgencyProspect[]
}): {
  list: TalentAccountEntry[]
  byAccountId: Map<string, TalentAccountEntry>
  byName: Map<string, TalentAccountEntry>
} {
  const byAccountId = new Map<string, TalentAccountEntry>()
  const byName = new Map<string, TalentAccountEntry>()

  function upsert(entry: TalentAccountEntry) {
    const existing = byAccountId.get(entry.accountId)
    const merged: TalentAccountEntry = existing
      ? {
          ...existing,
          ...entry,
          kinds: [...new Set([...existing.kinds, ...entry.kinds])],
          niches: [...new Set([...existing.niches, ...entry.niches])],
          email: entry.email || existing.email,
          phone: entry.phone || existing.phone,
          location: entry.location || existing.location,
          workArea: entry.workArea || existing.workArea,
          socialHandle: entry.socialHandle || existing.socialHandle,
          contractStart: entry.contractStart ?? existing.contractStart,
          contractEnd: entry.contractEnd ?? existing.contractEnd,
        }
      : entry
    byAccountId.set(merged.accountId, merged)
    byName.set(normalizeTalentName(merged.name), merged)
  }

  for (const p of input.prospects) {
    if (!p.accountId) continue
    upsert({
      accountId: p.accountId,
      name: p.name,
      kinds: ['prospect'],
      email: p.email,
      workArea: p.workArea,
      niches: p.workArea ? [p.workArea] : [],
      statusLabel: `Prospect · ${p.stage}`,
      contractStart: p.contractStart,
      contractEnd: p.contractEnd,
      source: p.source,
      submittedAt: p.submittedAt,
    })
  }

  for (const t of input.roster) {
    if (!t.accountId) continue
    upsert({
      accountId: t.accountId,
      name: t.name,
      kinds: ['roster'],
      workArea: t.workArea,
      niches: t.niches || [],
      statusLabel: `Roster · ${t.status}`,
      available: t.available,
      bookedDates: t.bookedDates,
      role: t.role,
    })
  }

  for (const t of input.pipeline) {
    if (!t.account_number) continue
    upsert({
      accountId: t.account_number,
      name: t.name,
      kinds: ['pipeline'],
      email: t.email,
      phone: t.phone,
      location: t.location,
      workArea: t.roster_division || t.niches?.[0],
      niches: t.niches || [],
      statusLabel: `Pipeline · ${t.stage.replace(/_/g, ' ')}`,
      socialHandle: t.social_handle,
      platform: t.platform,
      union: t.union_affiliation,
      pipelineId: t.id,
      source: t.discovery_source,
    })
  }

  return {
    list: [...byAccountId.values()].sort((a, b) => a.name.localeCompare(b.name)),
    byAccountId,
    byName,
  }
}

export function findTalentAccount(
  directory: { byAccountId: Map<string, TalentAccountEntry>; byName: Map<string, TalentAccountEntry> },
  opts: { accountId?: string | null; name?: string | null },
): TalentAccountEntry | undefined {
  if (opts.accountId) {
    const hit = directory.byAccountId.get(opts.accountId)
    if (hit) return hit
  }
  if (opts.name?.trim()) {
    return directory.byName.get(normalizeTalentName(opts.name))
  }
  return undefined
}
