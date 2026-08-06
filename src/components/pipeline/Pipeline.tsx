// @ts-nocheck
import { useState } from 'react'
import { ROLE_STAGE_ACCESS, STAGE_LABELS, isTalentVisibleToRole } from '@/constants'
import {
  T,
  StageBadge,
  NichePill,
  ScoreBar,
  Btn,
  FSelect,
  TH,
  TD,
} from '@/components/ui-compat'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import type { Role, Talent, TalentStage, User } from '@/types'

function Pipeline({
  talents,
  onSelectTalent,
  onMoveTalent,
  userRole,
  focusStage,
  currentUser,
}: {
  talents: Talent[]
  onSelectTalent: (t: Talent) => void
  onMoveTalent: (talent: Talent, toStage: TalentStage) => void
  userRole: Role
  focusStage?: TalentStage
  currentUser: User
}) {
  return (
    <KanbanBoard
      talents={talents}
      onSelectTalent={onSelectTalent}
      onMoveTalent={onMoveTalent}
      userRole={userRole}
      currentUser={currentUser}
      focusStage={focusStage}
    />
  )
}

// ─── FULL ROSTER ──────────────────────────────────────────────────────────────
function Roster({ talents, onSelectTalent, userRole, currentUserId }) {
  const [search, setSearch] = useState('')
  const [sf, setSf] = useState('all')
  const accessible = ROLE_STAGE_ACCESS[userRole] || []
  const visible = talents.filter((t) => isTalentVisibleToRole(t, userRole, currentUserId))
  const filt = visible.filter((t) => {
    if (
      search &&
      !t.name.toLowerCase().includes(search.toLowerCase()) &&
      !t.social_handle.toLowerCase().includes(search.toLowerCase())
    )
      return false
    if (sf !== 'all' && t.stage !== sf) return false
    return true
  })
  return (
    <div style={{ padding: '14px 18px', flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: T.t4,
            }}
          >
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              color: T.t1,
              padding: '5px 9px 5px 24px',
              fontSize: 12,
              outline: 'none',
              width: 180,
              fontFamily: 'inherit',
            }}
          />
        </div>
        <FSelect
          value={sf}
          onChange={setSf}
          options={[
            { v: 'all', l: 'All Stages' },
            ...accessible.map((s) => ({ v: s, l: STAGE_LABELS[s] })),
          ]}
          style={{ width: 150 }}
        />
        <span style={{ fontSize: 11, color: T.t4 }}>{filt.length} records</span>
      </div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: '#fff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        <thead>
          <tr>
            <TH>Name</TH>
            <TH>Stage</TH>
            <TH>Niche</TH>
            <TH>Score</TH>
            <TH>Handle</TH>
            <TH>Followers</TH>
            <TH>Application</TH>
            <TH>Docs</TH>
            <TH>Action</TH>
          </tr>
        </thead>
        <tbody>
          {filt.map((t) => (
            <tr
              key={t.id}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <TD>
                <span
                  style={{ color: T.blue, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => onSelectTalent(t)}
                >
                  {t.name}
                </span>
              </TD>
              <TD>
                <StageBadge stage={t.stage} />
              </TD>
              <TD>
                {t.niches.map((n) => (
                  <NichePill key={n} n={n} />
                ))}
              </TD>
              <TD>
                {t.jordan_score > 0 ? (
                  <ScoreBar score={t.jordan_score} />
                ) : (
                  <span style={{ color: T.t4 }}>—</span>
                )}
              </TD>
              <TD muted>{t.social_handle}</TD>
              <TD muted>{t.follower_count}</TD>
              <TD>
                {t.application_status ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: t.application_status === 'submitted' ? T.green : T.amber,
                    }}
                  >
                    {t.application_status}
                  </span>
                ) : (
                  <span style={{ color: T.t4, fontSize: 11 }}>—</span>
                )}
              </TD>
              <TD>
                <span style={{ fontSize: 11, color: T.t3 }}>
                  {Object.values(t.uploaded_docs || {}).filter(Boolean).length}/4
                </span>
              </TD>
              <TD>
                <Btn sm onClick={() => onSelectTalent(t)}>
                  Open →
                </Btn>
              </TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { Pipeline, Roster }
