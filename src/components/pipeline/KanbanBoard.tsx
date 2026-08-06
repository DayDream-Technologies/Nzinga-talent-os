import { useEffect, useRef, useState, type DragEvent } from 'react'
import {
  USERS,
  ROLE_LABELS,
  STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  canRoleAccessStage,
  canRoleMoveTalent,
} from '@/constants'
import { T } from '@/components/ui-compat'
import type { Role, Talent, TalentStage, User } from '@/types'

const DND_TYPE = 'application/x-nzinga-talent-id'

function formatSpecs(t: Talent): string {
  const height = t.height?.trim()
  const bwh = [t.bust, t.waist, t.hips].every((v) => v?.trim())
    ? `${t.bust}-${t.waist}-${t.hips}`
    : null
  if (height && bwh) return `${height} | Bust-Waist-Hips: ${bwh}`
  if (height) return height
  if (bwh) return `Bust-Waist-Hips: ${bwh}`
  return '—'
}

function formatDivision(t: Talent): string {
  if (t.roster_division?.trim()) {
    return t.secondary_specialization?.trim()
      ? `${t.roster_division} / ${t.secondary_specialization}`
      : t.roster_division
  }
  if (t.niches?.length) return t.niches.join(' / ')
  return '—'
}

function formatNextAction(t: Talent): string {
  if (t.next_callback_date) {
    const d = new Date(t.next_callback_date + 'T00:00:00')
    const label = Number.isNaN(d.getTime())
      ? t.next_callback_date
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `Callback — ${label}`
  }
  if (t.applicant_stage_status?.trim()) return t.applicant_stage_status
  if (t.earliest_availability?.trim()) return `Available — ${t.earliest_availability}`
  return '—'
}

function scoutName(scoutId: string | null | undefined): string {
  if (!scoutId) return '—'
  return USERS.find((u) => u.id === scoutId)?.name || '—'
}

type KanbanCardProps = {
  talent: Talent
  canDrag: boolean
  locked: boolean
  onSelect: (t: Talent) => void
  onDragStart: (e: DragEvent, talentId: string) => void
  onDragEnd: () => void
  isDragging: boolean
}

function KanbanCard({
  talent,
  canDrag,
  locked,
  onSelect,
  onDragStart,
  onDragEnd,
  isDragging,
}: KanbanCardProps) {
  return (
    <div
      draggable={canDrag}
      onDragStart={(e) => {
        if (!canDrag) {
          e.preventDefault()
          return
        }
        onDragStart(e, talent.id)
      }}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(talent)}
      style={{
        background: '#fff',
        border: `1px solid ${locked ? '#e5e7eb' : '#dbe1ea'}`,
        borderRadius: 8,
        padding: '10px 11px',
        marginBottom: 8,
        cursor: canDrag ? 'grab' : 'pointer',
        opacity: isDragging ? 0.45 : locked ? 0.78 : 1,
        boxShadow: locked ? 'none' : '0 1px 3px rgba(15,23,42,0.06)',
        transition: 'box-shadow 0.15s, opacity 0.15s, border-color 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!locked) e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = locked ? 'none' : '0 1px 3px rgba(15,23,42,0.06)'
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: T.t1,
          letterSpacing: '0.02em',
          marginBottom: 6,
          lineHeight: 1.3,
        }}
      >
        {talent.name.toUpperCase()}
      </div>
      <CardLine label="Division" value={formatDivision(talent)} />
      <CardLine label="Specs" value={formatSpecs(talent)} />
      <CardLine label="Base" value={talent.location?.trim() || '—'} />
      <CardLine label="Assigned Scout" value={scoutName(talent.scout_id)} />
      <CardLine label="Next Action" value={formatNextAction(talent)} accent />
      {!canDrag && (
        <div
          style={{
            marginTop: 7,
            fontSize: 10,
            fontWeight: 600,
            color: T.t4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <LockIcon size={10} /> View only
        </div>
      )}
    </div>
  )
}

function CardLine({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div style={{ fontSize: 11, lineHeight: 1.45, color: T.t3, marginBottom: 2 }}>
      <span style={{ color: T.t4 }}>{label}: </span>
      <span style={{ color: accent ? T.blue : T.t2, fontWeight: accent ? 600 : 500 }}>{value}</span>
    </div>
  )
}

function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 7V5a3 3 0 0 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

type ColumnProps = {
  stage: TalentStage
  talents: Talent[]
  locked: boolean
  dropActive: boolean
  draggingId: string | null
  userRole: Role
  userId: string
  onSelectTalent: (t: Talent) => void
  onDragStart: (e: DragEvent, talentId: string) => void
  onDragEnd: () => void
  onDragOver: (e: DragEvent, stage: TalentStage) => void
  onDragLeave: (stage: TalentStage) => void
  onDrop: (e: DragEvent, stage: TalentStage) => void
  columnRef: (el: HTMLDivElement | null) => void
}

function KanbanColumn({
  stage,
  talents,
  locked,
  dropActive,
  draggingId,
  userRole,
  userId,
  onSelectTalent,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  columnRef,
}: ColumnProps) {
  const color = STAGE_COLORS[stage]
  return (
    <div
      ref={columnRef}
      onDragOver={(e) => onDragOver(e, stage)}
      onDragLeave={() => onDragLeave(stage)}
      onDrop={(e) => onDrop(e, stage)}
      style={{
        width: 280,
        minWidth: 280,
        maxWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        background: locked ? '#f3f4f6' : '#eef1f6',
        borderRadius: 10,
        border: dropActive
          ? `2px solid ${color}`
          : locked
            ? '1px dashed #c4c9d2'
            : '1px solid #e2e6ee',
        position: 'relative',
        overflow: 'hidden',
        opacity: locked ? 0.92 : 1,
      }}
    >
      {locked && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148,163,184,0.07) 8px, rgba(148,163,184,0.07) 16px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <div
        style={{
          padding: '10px 12px 8px',
          borderBottom: `1px solid ${locked ? '#e5e7eb' : '#e2e6ee'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          position: 'relative',
          zIndex: 1,
          background: locked ? 'rgba(243,244,246,0.95)' : 'rgba(238,241,246,0.95)',
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: locked ? T.t3 : T.t1,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {STAGE_LABELS[stage]}
          </div>
        </div>
        <span
          style={{
            background: locked ? '#e5e7eb' : color + '22',
            color: locked ? T.t4 : color,
            borderRadius: 10,
            padding: '1px 7px',
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {talents.length}
        </span>
        {locked && (
          <span
            title="Your role cannot move cards in this stage"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              fontWeight: 700,
              color: T.t4,
              background: '#e5e7eb',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            <LockIcon size={10} /> Locked
          </span>
        )}
      </div>
      <div
        style={{
          padding: '8px 8px 10px',
          overflowY: 'auto',
          flex: 1,
          position: 'relative',
          zIndex: 1,
          minHeight: 80,
        }}
      >
        {talents.length === 0 ? (
          <div
            style={{
              fontSize: 11,
              color: T.t4,
              textAlign: 'center',
              padding: '18px 8px',
              border: dropActive ? `1px dashed ${color}` : '1px dashed transparent',
              borderRadius: 6,
            }}
          >
            {dropActive ? 'Drop here' : locked ? 'View only — no drop' : 'No talent'}
          </div>
        ) : (
          talents.map((t) => (
            <KanbanCard
              key={t.id}
              talent={t}
              canDrag={canRoleMoveTalent(userRole, t, userId)}
              locked={locked}
              onSelect={onSelectTalent}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggingId === t.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

export type KanbanBoardProps = {
  talents: Talent[]
  onSelectTalent: (t: Talent) => void
  onMoveTalent: (talent: Talent, toStage: TalentStage) => void
  userRole: Role
  currentUser: User
  focusStage?: TalentStage
}

export function KanbanBoard({
  talents,
  onSelectTalent,
  onMoveTalent,
  userRole,
  currentUser,
  focusStage,
}: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TalentStage | null>(null)
  const draggingIdRef = useRef<string | null>(null)
  const columnRefs = useRef<Partial<Record<TalentStage, HTMLDivElement | null>>>({})

  useEffect(() => {
    if (!focusStage) return
    const el = columnRefs.current[focusStage]
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [focusStage])

  function handleDragStart(e: DragEvent, talentId: string) {
    e.dataTransfer.setData(DND_TYPE, talentId)
    e.dataTransfer.setData('text/plain', talentId)
    e.dataTransfer.effectAllowed = 'move'
    draggingIdRef.current = talentId
    setDraggingId(talentId)
  }

  function handleDragEnd() {
    draggingIdRef.current = null
    setDraggingId(null)
    setDropTarget(null)
  }

  function handleDragOver(e: DragEvent, stage: TalentStage) {
    const talent = talents.find((t) => t.id === draggingIdRef.current)
    if (!talent || !canRoleMoveTalent(userRole, talent, currentUser.id, stage)) {
      e.dataTransfer.dropEffect = 'none'
      return
    }
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(stage)
  }

  function handleDragLeave(stage: TalentStage) {
    setDropTarget((cur) => (cur === stage ? null : cur))
  }

  function handleDrop(e: DragEvent, stage: TalentStage) {
    e.preventDefault()
    const id =
      e.dataTransfer.getData(DND_TYPE) ||
      e.dataTransfer.getData('text/plain') ||
      draggingIdRef.current ||
      ''
    draggingIdRef.current = null
    setDropTarget(null)
    setDraggingId(null)
    const talent = talents.find((t) => t.id === id)
    if (!talent || talent.stage === stage) return
    if (!canRoleMoveTalent(userRole, talent, currentUser.id, stage)) return
    onMoveTalent(talent, stage)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div
        style={{
          padding: '12px 18px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, fontFamily: 'Georgia, serif' }}>
            Talent Pipeline
          </div>
          <div style={{ fontSize: 11, color: T.t4, marginTop: 2 }}>
            Drag cards between stages you can edit. Locked columns are view-only for{' '}
            {ROLE_LABELS[userRole]}.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: T.t3 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#f3f4f6',
              border: '1px dashed #c4c9d2',
              borderRadius: 4,
              padding: '3px 8px',
            }}
          >
            <LockIcon size={11} /> Locked = view only
          </span>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '4px 18px 16px',
          overflowX: 'auto',
          overflowY: 'hidden',
          flex: 1,
          minHeight: 0,
          alignItems: 'stretch',
        }}
      >
        {STAGES.map((stage) => {
          const locked = !canRoleAccessStage(userRole, stage)
          const group = talents.filter((t) => t.stage === stage)
          return (
            <KanbanColumn
              key={stage}
              stage={stage}
              talents={group}
              locked={locked}
              dropActive={dropTarget === stage && !locked}
              draggingId={draggingId}
              userRole={userRole}
              userId={currentUser.id}
              onSelectTalent={onSelectTalent}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              columnRef={(el) => {
                columnRefs.current[stage] = el
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
