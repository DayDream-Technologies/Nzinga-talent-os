import { useEffect, useRef, useState } from 'react'
import { PILLAR_NAMES } from '@/constants/stages'
import { jordanScoreFromPillars, jordanScoreMeetsThreshold } from '@/lib/jordan-score'
import { T } from '@/lib/tokens'
import type { Talent } from '@/types'

export function JordanScorePanel({
  talent,
  canEdit,
  onScore,
}: {
  talent: Talent | null
  canEdit: boolean
  onScore?: (patch: Pick<Talent, 'pillar_scores' | 'pillar_rationales' | 'jordan_score'>) => void | Promise<void>
}) {
  const [scores, setScores] = useState<number[]>(() =>
    [0, 1, 2, 3, 4].map((i) => Number(talent?.pillar_scores?.[i] || 0)),
  )
  const [rationales, setRationales] = useState<string[]>(() =>
    [0, 1, 2, 3, 4].map((i) => talent?.pillar_rationales?.[i] || ''),
  )
  const [status, setStatus] = useState('')
  const scoresRef = useRef(scores)
  const rationalesRef = useRef(rationales)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const nextScores = [0, 1, 2, 3, 4].map((i) => Number(talent?.pillar_scores?.[i] || 0))
    const nextRationales = [0, 1, 2, 3, 4].map((i) => talent?.pillar_rationales?.[i] || '')
    setScores(nextScores)
    setRationales(nextRationales)
    scoresRef.current = nextScores
    rationalesRef.current = nextRationales
  }, [talent?.id])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  if (!talent) {
    return (
      <div style={{ fontSize: 13, color: T.t3, lineHeight: 1.5 }}>
        Jordan Score is saved on the talent record after this application is linked to a talent.
      </div>
    )
  }

  const average = jordanScoreFromPillars(scores)
  const meets = jordanScoreMeetsThreshold(scores)

  function emit(nextScores: number[], nextRationales: string[]) {
    if (!canEdit || !onScore) return
    setStatus('Saving…')
    void Promise.resolve(
      onScore({
        pillar_scores: nextScores,
        pillar_rationales: nextRationales,
        jordan_score: jordanScoreFromPillars(nextScores),
      }),
    )
      .then(() => setStatus('Saved on the talent record'))
      .catch(() => setStatus('Could not save the score'))
  }

  function setScore(index: number, value: number) {
    const next = [...scoresRef.current]
    next[index] = value
    scoresRef.current = next
    setScores(next)
    emit(next, rationalesRef.current)
  }

  function setRationale(index: number, value: string) {
    const next = [...rationalesRef.current]
    next[index] = value
    rationalesRef.current = next
    setRationales(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => emit(scoresRef.current, next), 400)
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.5, marginBottom: 12 }}>
        Score each pillar from 1 to 5 and write a short rationale. Every pillar must be at least 3, and the average must be at least 3.5.
      </div>
      {PILLAR_NAMES.map((name, i) => (
        <div key={name} style={{ marginBottom: 10, padding: 12, background: T.mutedBg, borderRadius: 8, border: `1px solid ${T.cardBorder}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: T.t1 }}>
            Pillar {i + 1}: {name}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={!canEdit}
                onClick={() => setScore(i, n)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  cursor: canEdit ? 'pointer' : 'default',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  background: scores[i] >= n ? (n >= 3 ? T.greenL : T.redL) : T.cardBg,
                  border: `1px solid ${scores[i] >= n ? (n >= 3 ? T.green : T.red) : T.cardBorder}`,
                  color: scores[i] >= n ? (n >= 3 ? T.green : T.red) : T.t4,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            value={rationales[i]}
            disabled={!canEdit}
            placeholder={`Rationale for ${name}…`}
            rows={2}
            onChange={(e) => setRationale(i, e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: 6,
              border: `1px solid ${T.cardBorder}`,
              padding: 8,
              fontFamily: 'inherit',
              fontSize: 12,
              background: T.cardBg,
              color: T.t1,
            }}
          />
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 4,
          padding: '12px 14px',
          borderRadius: 8,
          background: meets ? T.greenL : average > 0 ? T.redL : T.mutedBg,
          border: `1px solid ${meets ? T.green : average > 0 ? T.red : T.cardBorder}55`,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 800, color: meets ? T.green : average > 0 ? T.red : T.t4, fontFamily: "'Syne', sans-serif" }}>
          {average.toFixed(2)}
        </div>
        <div style={{ fontSize: 13, color: meets ? T.green : average > 0 ? T.red : T.t3, fontWeight: 600, lineHeight: 1.4 }}>
          {meets ? 'Meets the 3.5 threshold' : average > 0 ? 'Below 3.5, or a pillar is under 3' : 'Enter all five pillar scores'}
        </div>
      </div>
      {status && <div style={{ fontSize: 11, color: T.t3, marginTop: 6 }}>{status}</div>}
      {!canEdit && <div style={{ fontSize: 11, color: T.t4, marginTop: 6 }}>Only a scout, success manager, or director can change this score.</div>}
    </div>
  )
}
