import { useState } from 'react'
import { Badge, Btn, Card, Panel, Table, Money } from '@/components/agency/AgencyUI'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { useAgencyData } from '@/context/AgencyDataContext'
import { isChaseConnected } from '@/lib/integrations'
import { T } from '@/lib/tokens'
import { useViewport } from '@/hooks/useViewport'
import { staffGridColumns } from '@/lib/viewport'

export function PayoutApprovalsModule() {
  const { expenseLogs, escrow, issuePayout, updateExpenseLog } = useAgencyData()
  const band = useViewport()
  const [approved, setApproved] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const pending = expenseLogs.filter((e) => e.status === 'pending' || approved.has(e.id))
  const cleared = escrow.filter((e) => e.status === 'cleared').reduce((s, e) => s + e.amount, 0)
  const uncleared = escrow.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0)

  const chaseReady = isChaseConnected()

  return (
    <Panel title="Payout Approvals">
      {!chaseReady && <IntegrationNotice id="chase" />}
      <div style={{ display: 'grid', gridTemplateColumns: staffGridColumns(band, 'repeat(3, 1fr)'), gap: 10, marginBottom: 14 }}>
        <Card>
          <div style={{ fontSize: 22, fontWeight: 800 }}><Money value={pending.reduce((s, e) => s + e.talentShare, 0)} /></div>
          <div style={{ color: T.t3, fontSize: 12 }}>Pending approval</div>
        </Card>
        <Card>
          <div style={{ fontSize: 22, fontWeight: 800 }}><Money value={cleared} /></div>
          <div style={{ color: T.t3, fontSize: 12 }}>Cleared escrow</div>
        </Card>
        <Card>
          <div style={{ fontSize: 22, fontWeight: 800 }}><Money value={uncleared} /></div>
          <div style={{ color: T.t3, fontSize: 12 }}>Uncleared brand deposits</div>
        </Card>
      </div>
      <Card>
        <Table
          headers={['Talent', 'Project', 'Requested', 'Escrow', '']}
          onRowClick={(i) => setSelectedId(pending[i]?.id || null)}
          rows={pending.map((e) => {
            const match = escrow.find((x) => x.project === e.project && x.status === 'cleared')
            const ready = Boolean(match)
            const isApproved = approved.has(e.id)
            return [
              e.talentName,
              e.project,
              <Money key={`a-${e.id}`} value={e.talentShare} />,
              <Badge key={`b-${e.id}`} color={ready ? T.green : T.red}>
                {ready ? 'Cleared & Verifiable' : 'Pending Bank Hold'}
              </Badge>,
              <span key={`x-${e.id}`} style={{ display: 'flex', gap: 6 }} onClick={(ev) => ev.stopPropagation()}>
                <Btn
                  variant="secondary"
                  disabled={!ready || isApproved}
                  onClick={() => {
                    updateExpenseLog(e.id, { status: 'issued', approvedAt: new Date().toISOString() })
                    setApproved((prev) => new Set(prev).add(e.id))
                  }}
                >
                  Approve
                </Btn>
                <Btn
                  disabled={!ready || !chaseReady || !isApproved}
                  onClick={() => issuePayout(e.id, { notes: 'Approved after escrow clear', method: 'ACH' })}
                >
                  Execute
                </Btn>
              </span>,
            ]
          })}
        />
        {selectedId && (
          <div style={{ marginTop: 8, fontSize: 13, color: T.t2 }}>
            Selected payout {selectedId}. Use Approve, then Execute.
          </div>
        )}
      </Card>
    </Panel>
  )
}
