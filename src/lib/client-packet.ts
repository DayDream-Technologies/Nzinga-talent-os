import type { Talent } from '@/types'

export function clientPacketSubmitBlockers(talent: {
  pillar_rationales?: string[]
  pillar_scores?: number[]
  jordan_score?: number
  revenue_path?: string
  scout_summary?: string
  niches?: string[]
  discovery_call_notes?: string
  uploaded_docs?: Talent['uploaded_docs']
}): string[] {
  const blockers: string[] = []
  const rationales = talent.pillar_rationales || []
  const scores = talent.pillar_scores || []
  for (let i = 0; i < 5; i++) {
    if (!rationales[i]) blockers.push(`Pillar ${i + 1} rationale`)
    if ((scores[i] ?? 0) < 3) blockers.push(`Pillar ${i + 1} score (min 3)`)
  }
  if ((talent.jordan_score ?? 0) < 3.5) blockers.push('Jordan Score (min 3.5)')
  if (!talent.revenue_path?.trim()) blockers.push('Revenue path')
  if (!talent.scout_summary?.trim()) blockers.push('Scout summary')
  if (!talent.niches?.length) blockers.push('Niches')
  if (!talent.discovery_call_notes?.trim()) blockers.push('Discovery Call notes')
  if (!talent.uploaded_docs?.gov_id?.data) blockers.push('Government-issued ID')
  return [...new Set(blockers)]
}

export function canSubmitClientPacket(talent: Parameters<typeof clientPacketSubmitBlockers>[0]): boolean {
  return clientPacketSubmitBlockers(talent).length === 0
}
