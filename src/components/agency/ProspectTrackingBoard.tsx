import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAuth } from '@/hooks/useAuth'
import {
  PROSPECT_STAGE_LABELS,
  PROSPECT_TRACKING_STAGES,
  normalizeProspectStage,
} from '@/constants/prospect-stages'
import { formatAccountDisplay } from '@/lib/session-storage'
import { talentAccountPath } from '@/lib/talent-account'
import { Badge, Btn, Panel, inputStyle } from '@/components/agency/AgencyUI'
import { T } from '@/lib/tokens'
import type { AgencyProspect } from '@/types/agency'

export function ProspectTrackingBoard() {
  const { prospects, setProspectStage } = useAgencyData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dragId, setDragId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [lastContactOn, setLastContactOn] = useState('')

  const canDrag = user?.role === 'director' || user?.role === 'scout' || user?.role === 'success_manager' || user?.role === 'account_manager'

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return prospects.filter((p) => {
      if (p.lost) return false
      if (q && !`${p.name} ${p.email} ${p.assignedAgentName || ''}`.toLowerCase().includes(q)) return false
      if (lastContactOn && p.submittedAt.slice(0, 10) < lastContactOn) return false
      return true
    })
  }, [prospects, query, lastContactOn])

  const byStage = useMemo(() => {
    const map: Record<string, AgencyProspect[]> = {}
    for (const s of PROSPECT_TRACKING_STAGES) map[s] = []
    for (const p of visible) {
      const s = normalizeProspectStage(p.stage)
      if (!map[s]) map[s] = []
      map[s].push(p)
    }
    return map
  }, [visible])

  return (
    <Panel
      title="Prospect Tracking Board"
      actions={
        <Btn variant="secondary" onClick={() => navigate('/prospects')}>
          Add Prospects
        </Btn>
      }
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          style={{ ...inputStyle, maxWidth: 240 }}
          placeholder="Find a prospect"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          type="date"
          aria-label="Last contact on or after"
          style={{ ...inputStyle, maxWidth: 180 }}
          value={lastContactOn}
          onChange={(e) => setLastContactOn(e.target.value)}
        />
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 12,
          minHeight: 420,
        }}
      >
        {PROSPECT_TRACKING_STAGES.map((stage) => (
          <div
            key={stage}
            onDragOver={(e) => {
              if (!canDrag) return
              e.preventDefault()
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (!canDrag || !dragId) return
              setProspectStage(dragId, stage)
              setDragId(null)
            }}
            style={{
              minWidth: 168,
              maxWidth: 180,
              flex: '0 0 168px',
              background: T.mutedBg,
              borderRadius: 10,
              border: `1px solid ${T.cardBorder}`,
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.t3,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              {PROSPECT_STAGE_LABELS[stage]}
              <span style={{ marginLeft: 6, color: T.t4 }}>{byStage[stage]?.length || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {(byStage[stage] || []).map((p) => (
                <div
                  key={p.id}
                  draggable={canDrag}
                  onDragStart={() => setDragId(p.id)}
                  style={{
                    background: T.cardBg,
                    border: `1px solid ${T.cardBorder}`,
                    borderRadius: 8,
                    padding: '10px 10px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <Link
                    to={talentAccountPath(p.accountId)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontWeight: 650, fontSize: 12, color: T.blue, marginBottom: 4, display: 'block' }}
                  >
                    {p.name}
                  </Link>
                  <div style={{ fontSize: 10, color: T.t4, fontFamily: 'ui-monospace, monospace' }}>
                    {formatAccountDisplay(p.accountId)}
                  </div>
                  <div style={{ fontSize: 11, color: T.t2, marginTop: 6 }}>
                    Last contact: {p.submittedAt.slice(0, 10)}
                    <br />
                    Next contact: {p.contractEnd || '—'}
                    <br />
                    Agent: {p.assignedAgentName || '—'}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Badge color={T.purple}>{p.workArea}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
