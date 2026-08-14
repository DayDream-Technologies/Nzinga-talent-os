import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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

const DRAG_THRESHOLD_PX = 6

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

type DragState = {
  talentId: string
  originStage: TalentStage
  startX: number
  startY: number
  x: number
  y: number
  width: number
  height: number
  active: boolean
  pointerId: number
}

type KanbanCardProps = {
  talent: Talent
  canDrag: boolean
  locked: boolean
  isDragging: boolean
  onSelect: (t: Talent) => void
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>, talent: Talent) => void
}

function KanbanCard({
  talent,
  canDrag,
  locked,
  isDragging,
  onSelect,
  onPointerDown,
}: KanbanCardProps) {
  return (
    <div
      data-kanban-card={talent.id}
      onPointerDown={(e) => {
        if (!canDrag || e.button !== 0) return
        onPointerDown(e, talent)
      }}
      onClick={() => {
        if (!isDragging) onSelect(talent)
      }}
      style={{
        background: '#fff',
        border: `1px solid ${locked ? '#e5e7eb' : '#dbe1ea'}`,
        borderRadius: 8,
        padding: '10px 11px',
        marginBottom: 8,
        cursor: canDrag ? 'grab' : 'pointer',
        opacity: isDragging ? 0.35 : locked ? 0.78 : 1,
        boxShadow: locked ? 'none' : '0 1px 3px rgba(15,23,42,0.06)',
        transition: isDragging ? 'none' : 'box-shadow 0.15s, opacity 0.15s',
        userSelect: 'none',
        touchAction: canDrag ? 'none' : 'auto',
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
      <CardLine label="Account ID" value={talent.account_number || '—'} />
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
  onCardPointerDown: (e: ReactPointerEvent<HTMLDivElement>, talent: Talent) => void
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
  onCardPointerDown,
  columnRef,
}: ColumnProps) {
  const color = STAGE_COLORS[stage]
  return (
    <div
      ref={columnRef}
      data-kanban-stage={stage}
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
              isDragging={draggingId === t.id}
              onSelect={onSelectTalent}
              onPointerDown={onCardPointerDown}
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
  const [drag, setDrag] = useState<DragState | null>(null)
  const [dropTarget, setDropTarget] = useState<TalentStage | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const skipClickRef = useRef(false)
  const columnRefs = useRef<Partial<Record<TalentStage, HTMLDivElement | null>>>({})
  const boardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!focusStage) return
    const el = columnRefs.current[focusStage]
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [focusStage])

  function stageAtPoint(x: number, y: number): TalentStage | null {
    const els = document.elementsFromPoint(x, y)
    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue
      const stage = el.closest('[data-kanban-stage]')?.getAttribute('data-kanban-stage')
      if (stage && STAGES.includes(stage as TalentStage)) return stage as TalentStage
    }
    return null
  }

  function handleCardPointerDown(e: ReactPointerEvent<HTMLDivElement>, talent: Talent) {
    if (!canRoleMoveTalent(userRole, talent, currentUser.id)) return
    if (e.button !== 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const next: DragState = {
      talentId: talent.id,
      originStage: talent.stage,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height,
      active: false,
      pointerId: e.pointerId,
    }
    dragRef.current = next
    setDrag(next)

    const onMove = (ev: PointerEvent) => {
      const cur = dragRef.current
      if (!cur || cur.pointerId !== ev.pointerId) return
      ev.preventDefault()

      const dx = ev.clientX - cur.startX
      const dy = ev.clientY - cur.startY
      const distance = Math.hypot(dx, dy)
      const active = cur.active || distance >= DRAG_THRESHOLD_PX
      const updated: DragState = {
        ...cur,
        x: ev.clientX,
        y: ev.clientY,
        active,
      }
      dragRef.current = updated
      setDrag(updated)

      if (!active) return
      const t = talents.find((x) => x.id === cur.talentId)
      if (!t) return
      const stage = stageAtPoint(ev.clientX, ev.clientY)
      if (stage && canRoleMoveTalent(userRole, t, currentUser.id, stage)) {
        setDropTarget(stage)
      } else {
        setDropTarget(null)
      }
    }

    const onUp = (ev: PointerEvent) => {
      const cur = dragRef.current
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      if (!cur || cur.pointerId !== ev.pointerId) return

      const t = talents.find((x) => x.id === cur.talentId)
      const stage = cur.active ? stageAtPoint(ev.clientX, ev.clientY) : null

      if (cur.active) {
        skipClickRef.current = true
        window.setTimeout(() => {
          skipClickRef.current = false
        }, 0)
      }

      dragRef.current = null
      setDrag(null)
      setDropTarget(null)

      if (!t || !stage || stage === t.stage) return
      if (!canRoleMoveTalent(userRole, t, currentUser.id, stage)) return
      onMoveTalent(t, stage)
    }

    document.addEventListener('pointermove', onMove, { passive: false })
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  const draggingTalent = drag?.active ? talents.find((t) => t.id === drag.talentId) : null

  return (
    <div
      ref={boardRef}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative' }}
    >
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
              draggingId={drag?.active ? drag.talentId : null}
              userRole={userRole}
              userId={currentUser.id}
              onSelectTalent={(t) => {
                if (skipClickRef.current) return
                onSelectTalent(t)
              }}
              onCardPointerDown={handleCardPointerDown}
              columnRef={(el) => {
                columnRefs.current[stage] = el
              }}
            />
          )
        })}
      </div>

      {draggingTalent && drag?.active && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: drag.x - drag.width / 2,
            top: drag.y - 24,
            width: drag.width,
            zIndex: 9999,
            pointerEvents: 'none',
            opacity: 0.95,
            transform: 'rotate(2deg)',
            boxShadow: '0 12px 28px rgba(15,23,42,0.22)',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #dbe1ea',
              borderRadius: 8,
              padding: '10px 11px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 4 }}>
              {draggingTalent.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: T.t3 }}>
              Division: {formatDivision(draggingTalent)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
