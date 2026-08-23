import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAuth } from '@/hooks/useAuth'
import {
  PROSPECT_STAGE_LABELS,
  PROSPECT_TRACKING_STAGES,
  normalizeProspectStage,
} from '@/constants/prospect-stages'
import { AGENCY_PROPERTY, formatAccountDisplay } from '@/lib/session-storage'
import { talentAccountPath } from '@/lib/talent-account'
import { useUnsavedClose } from '@/components/ui/ConfirmDialog'
import { Badge, Btn, Field, Panel, inputStyle } from '@/components/agency/AgencyUI'
import { T } from '@/lib/tokens'
import type { AgencyProspect, ProspectStage } from '@/types/agency'

function ProspectDetailDrawer({
  prospect,
  onClose,
  onSave,
}: {
  prospect: AgencyProspect
  onClose: () => void
  onSave: (patch: Partial<AgencyProspect>) => void
}) {
  const [notes, setNotes] = useState(prospect.notes || '')
  const [stage, setStage] = useState<ProspectStage>(normalizeProspectStage(prospect.stage))
  const [phone, setPhone] = useState(prospect.phone || '')
  const [street, setStreet] = useState(prospect.street || '')
  const [city, setCity] = useState(prospect.city || '')
  const [state, setState] = useState(prospect.state || '')
  const [postal, setPostal] = useState(prospect.postal || '')
  const dirty =
    notes !== (prospect.notes || '') ||
    stage !== normalizeProspectStage(prospect.stage) ||
    phone !== (prospect.phone || '') ||
    street !== (prospect.street || '') ||
    city !== (prospect.city || '') ||
    state !== (prospect.state || '') ||
    postal !== (prospect.postal || '')

  const { requestClose, dialog } = useUnsavedClose(dirty, onClose)

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 800,
          background: 'rgba(15,23,42,0.35)',
        }}
        onClick={requestClose}
      />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(440px, 100vw)',
          zIndex: 801,
          background: '#fff',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 22px 14px',
            borderBottom: '1px solid #eef0f3',
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.t1, fontFamily: "'Syne', sans-serif" }}>
              {prospect.name}
            </div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>
              Account {formatAccountDisplay(prospect.accountId)}
            </div>
            {prospect.accountId ? (
              <Link
                to={talentAccountPath(prospect.accountId)}
                style={{
                  display: 'inline-block',
                  marginTop: 10,
                  padding: '8px 14px',
                  borderRadius: 7,
                  background: '#f3f4f6',
                  color: T.t1,
                  border: '1px solid #e5e7eb',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontFamily: 'inherit',
                }}
              >
                Open full profile
              </Link>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={requestClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 22,
              color: T.t3,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email">
            <div style={{ fontSize: 13, color: T.t1 }}>{prospect.email || '—'}</div>
          </Field>
          <Field label="Phone">
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Agent">
            <div style={{ fontSize: 13 }}>{prospect.assignedAgentName || '—'}</div>
          </Field>
          <Field label="Property">
            <div style={{ fontSize: 13 }}>{prospect.property || AGENCY_PROPERTY}</div>
          </Field>
          <Field label="Stage">
            <select
              style={inputStyle}
              value={stage}
              onChange={(e) => setStage(e.target.value as ProspectStage)}
            >
              {PROSPECT_TRACKING_STAGES.map((s) => (
                <option key={s} value={s}>
                  {PROSPECT_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Street">
              <input style={inputStyle} value={street} onChange={(e) => setStreet(e.target.value)} />
            </Field>
            <Field label="City">
              <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="State">
              <input style={inputStyle} value={state} onChange={(e) => setState(e.target.value)} />
            </Field>
            <Field label="Postal">
              <input style={inputStyle} value={postal} onChange={(e) => setPostal(e.target.value)} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              style={{ ...inputStyle, minHeight: 100 }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #eef0f3', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={requestClose}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              onSave({ notes, stage, phone, street, city, state, postal })
              onClose()
            }}
          >
            Save
          </Btn>
        </div>
      </aside>
      {dialog}
    </>
  )
}

export function ProspectTrackingBoard() {
  const { prospects, updateProspect, setProspectStage } = useAgencyData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const canDrag = user?.role === 'director' || user?.role === 'scout' || user?.role === 'team1_lead'

  const selected = useMemo(
    () => prospects.find((p) => p.id === selectedId) || null,
    [prospects, selectedId],
  )

  const byStage = useMemo(() => {
    const map: Record<string, AgencyProspect[]> = {}
    for (const s of PROSPECT_TRACKING_STAGES) map[s] = []
    for (const p of prospects) {
      if (p.lost) continue
      const s = normalizeProspectStage(p.stage)
      if (!map[s]) map[s] = []
      map[s].push(p)
    }
    return map
  }, [prospects])

  return (
    <Panel
      title="Prospect Tracking Board"
      subtitle="Drag cards between stages. Click a card for contact details."
      actions={
        <Btn variant="secondary" onClick={() => navigate('/prospects')}>
          Open Prospects
        </Btn>
      }
    >
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
              background: '#f4f6f8',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
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
                  onClick={() => setSelectedId(p.id)}
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '10px 10px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ fontWeight: 650, fontSize: 12, color: T.t1, marginBottom: 4 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 10, color: T.t4, fontFamily: 'ui-monospace, monospace' }}>
                    {formatAccountDisplay(p.accountId)}
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
      {selected && (
        <ProspectDetailDrawer
          prospect={selected}
          onClose={() => setSelectedId(null)}
          onSave={(patch) => updateProspect(selected.id, patch)}
        />
      )}
    </Panel>
  )
}
