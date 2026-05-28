import { STAGE_COLORS, STAGE_LABELS, type TalentStage } from '@/types/stages'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

export function Avatar({ user, size = 28 }: { user: User | null; size?: number }) {
  if (!user) return null
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: user.color + '22',
        border: `2px solid ${user.color}55`,
        color: user.color,
        fontSize: size * 0.36,
      }}
    >
      {user.initials}
    </div>
  )
}

export function StageBadge({ stage }: { stage: TalentStage | string }) {
  const c = STAGE_COLORS[stage as TalentStage] || '#6b7280'
  const label = STAGE_LABELS[stage as TalentStage] || stage
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: c, background: c + '15', border: `1px solid ${c}33` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c }} />
      {label}
    </span>
  )
}

export function NichePill({ n }: { n: string }) {
  const map: Record<string, { bg: string; c: string }> = {
    Model: { bg: '#f3e8ff', c: '#7c3aed' },
    Actor: { bg: '#dbeafe', c: '#1d4ed8' },
    Influencer: { bg: '#d1fae5', c: '#065f46' },
    Athlete: { bg: '#fef3c7', c: '#92400e' },
  }
  const s = map[n] || { bg: '#f3f4f6', c: '#374151' }
  return (
    <span
      className="mr-0.5 rounded-[10px] px-1.5 py-px text-[11px] font-medium"
      style={{ background: s.bg, color: s.c }}
    >
      {n}
    </span>
  )
}

export function PriorityBadge({ p }: { p: string }) {
  const map: Record<string, { bg: string; c: string }> = {
    urgent: { bg: '#fee2e2', c: '#dc2626' },
    high: { bg: '#fef3c7', c: '#d97706' },
    medium: { bg: '#dbeafe', c: '#1d4ed8' },
    low: { bg: '#f3f4f6', c: '#6b7280' },
  }
  const s = map[p] || map.low
  return (
    <span
      className="rounded-[10px] px-1.5 py-px text-[10px] font-bold uppercase"
      style={{ background: s.bg, color: s.c }}
    >
      {p}
    </span>
  )
}

export function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 3.5 ? 'bg-brand-green' : score >= 3 ? 'bg-brand-amber' : 'bg-brand-red'
  const textColor =
    score >= 3.5 ? 'text-brand-green' : score >= 3 ? 'text-brand-amber' : 'text-brand-red'
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded bg-gray-200">
        <div className={cn('h-full rounded', color)} style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <span className={cn('min-w-6 text-right text-[11px] font-bold', textColor)}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}

export function HistoryIcon({ type }: { type: string }) {
  const m: Record<string, { i: string; c: string }> = {
    note: { i: '✎', c: '#7c3aed' },
    call: { i: '✆', c: '#16a34a' },
    email: { i: '✉', c: '#2563eb' },
    task: { i: '☑', c: '#d97706' },
    document: { i: '📎', c: '#0891b2' },
    system: { i: '⚙', c: '#6b7280' },
  }
  const s = m[type] || m.system
  return <span className="text-sm" style={{ color: s.c }}>{s.i}</span>
}
