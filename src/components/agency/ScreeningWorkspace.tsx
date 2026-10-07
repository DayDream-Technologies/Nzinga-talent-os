import { useState } from 'react'
import { Badge, Btn, Card, Field, Panel, inputStyle } from '@/components/agency/AgencyUI'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { clientPacketSubmitBlockers } from '@/lib/client-packet'
import { isScreeningConnected } from '@/lib/integrations'
import { createHistoryEntry } from '@/lib/history-ledger'
import { SCOUT_RECOMMENDATION_LABELS, SCREENING_STATUS_LABELS } from '@/lib/screening'
import { PILLAR_NAMES } from '@/constants/stages'
import { T } from '@/lib/tokens'
import type { ScoutRecommendation, ScreeningStatus, Talent } from '@/types'

const STEPS = [
  'Review application',
  'Jordan Score',
  'Discovery Call',
  'Safety screening',
  'Screening returned',
  'Final recommendation',
  'Client Packet',
] as const

export function ScreeningWorkspace({
  talent,
  onChange,
  onSubmit,
}: {
  talent: Talent
  onChange: (patch: Partial<Talent>) => void
  onSubmit: () => void
}) {
  const { user } = useAuth()
  const { setHistory } = useAppData()
  const [step, setStep] = useState(0)
  const connected = isScreeningConnected()
  const blockers = clientPacketSubmitBlockers(talent)

  function markReviewed() {
    onChange({ application_reviewed_at: new Date().toISOString() })
  }

  function setScore(i: number, score: number) {
    const scores = [...(talent.pillar_scores || [0, 0, 0, 0, 0])]
    scores[i] = score
    const avg = scores.reduce((s, n) => s + n, 0) / 5
    onChange({ pillar_scores: scores, jordan_score: Math.round(avg * 10) / 10 })
  }

  return (
    <Panel title="Application screening" subtitle={`${talent.name} · guided scout qualification`}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: `1px solid ${step === i ? T.blue : T.cardBorder}`,
              background: step === i ? T.blue : T.cardBg,
              color: step === i ? '#fff' : T.t1,
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'inherit',
            }}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <p style={{ color: T.t2 }}>
            Review personal, contact, DOB, niches, and uploaded materials on this record before scoring.
          </p>
          <Btn onClick={markReviewed}>{talent.application_reviewed_at ? 'Reviewed' : 'Mark application reviewed'}</Btn>
        </Card>
      )}
      {step === 1 && (
        <Card>
          {(PILLAR_NAMES || ['Presence', 'Marketability', 'Work ethic', 'Brand fit', 'Longevity']).map((name, i) => (
            <Field key={name} label={`${name} (1–5)`}>
              <input
                type="number"
                min={1}
                max={5}
                value={talent.pillar_scores?.[i] || ''}
                onChange={(e) => setScore(i, Number(e.target.value))}
                style={inputStyle}
              />
              <textarea
                placeholder="Rationale"
                value={talent.pillar_rationales?.[i] || ''}
                onChange={(e) => {
                  const next = [...(talent.pillar_rationales || ['', '', '', '', ''])]
                  next[i] = e.target.value
                  onChange({ pillar_rationales: next })
                }}
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </Field>
          ))}
          <div style={{ fontWeight: 700 }}>Jordan Score: {talent.jordan_score || 0}</div>
        </Card>
      )}
      {step === 2 && (
        <Card>
          <Field label="Discovery Call notes">
            <textarea
              value={talent.discovery_call_notes || ''}
              onChange={(e) => onChange({ discovery_call_notes: e.target.value })}
              rows={6}
              style={inputStyle}
            />
          </Field>
        </Card>
      )}
      {(step === 3 || step === 4) && (
        <Card>
          {!connected && <IntegrationNotice id="screening" />}
          <div style={{ marginBottom: 8 }}>
            Status:{' '}
            <Badge color={T.blue}>
              {SCREENING_STATUS_LABELS[(talent.screening_status || 'not_started') as ScreeningStatus]}
            </Badge>
          </div>
          <Btn
            disabled={!connected}
            onClick={() => {
              onChange({
                screening_status: 'invitation_sent',
                screening_updated_at: new Date().toISOString(),
              })
              setHistory((prev) => [
                createHistoryEntry({
                  type: 'system',
                  text: 'Safety screening invitation sent',
                  category: 'internal',
                  staffName: user?.name,
                  userId: user?.id,
                  talentId: talent.id,
                  accountNumber: talent.account_number,
                }),
                ...prev,
              ])
            }}
          >
            Initiate screening
          </Btn>
        </Card>
      )}
      {step === 5 && (
        <Card>
          <Field label="Scout recommendation">
            <select
              value={talent.scout_recommendation || ''}
              onChange={(e) => onChange({ scout_recommendation: e.target.value as ScoutRecommendation })}
              style={inputStyle}
            >
              <option value="">Select…</option>
              {(Object.keys(SCOUT_RECOMMENDATION_LABELS) as ScoutRecommendation[]).map((k) => (
                <option key={k} value={k}>
                  {SCOUT_RECOMMENDATION_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <p style={{ fontSize: 12, color: T.t3 }}>This is a Scout recommendation only. It is not approval of representation.</p>
        </Card>
      )}
      {step === 6 && (
        <Card>
          <p>Packet includes profile, application, Jordan Score, Discovery notes, screening status, and recommendation.</p>
          {blockers.length > 0 && (
            <div style={{ background: T.amberL, padding: 12, borderRadius: 8, margin: '12px 0' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Client Packet Not Ready</div>
              The following required steps must be completed:
              <ul>
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          <Btn disabled={blockers.length > 0} onClick={onSubmit}>
            Submit Client Packet to Success Manager
          </Btn>
        </Card>
      )}
    </Panel>
  )
}
