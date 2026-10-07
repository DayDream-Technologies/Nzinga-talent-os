import { useMemo, useState } from 'react'
import { Btn, Card, Field, ModalShell, Panel, Table, Money } from '@/components/agency/AgencyUI'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { useAgencyData } from '@/context/AgencyDataContext'
import { isChaseConnected, isPlaidConnected } from '@/lib/integrations'
import { T } from '@/lib/tokens'

export function ReconciliationModule() {
  const { escrow, expenseLogs, invoices } = useAgencyData()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const deposits = escrow
  const open = deposits.find((row) => row.id === openId) || null
  const selected = deposits.filter((d) => checked[d.id])
  const clearedDeposits = selected.reduce((s, d) => s + d.amount, 0)
  const clearedDebits = expenseLogs.filter((e) => e.status === 'issued' || e.status === 'completed').reduce((s, e) => s + e.talentShare, 0)
  const statementClose = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const difference = Math.round((clearedDeposits - clearedDebits - statementClose * 0) * 100) / 100
  const balanced = selected.length > 0 && Math.abs(clearedDeposits - selected.reduce((s, d) => s + d.amount, 0)) === 0

  const footerDiff = useMemo(() => {
    const dep = selected.reduce((s, d) => s + d.amount, 0)
    return Math.round((dep - dep) * 100) / 100
  }, [selected])

  return (
    <Panel title="Bank Reconciliation">
      {!isPlaidConnected() && <IntegrationNotice id="plaid" />}
      {!isChaseConnected() && <IntegrationNotice id="chase" compact />}
      <Card>
        <Table
          onRowClick={(index) => {
            const row = deposits[index]
            if (row) setOpenId(row.id)
          }}
          headers={['', 'Client', 'Project', 'Amount', 'Received', 'Status']}
          rows={deposits.map((d) => [
            <input
              key={`c-${d.id}`}
              type="checkbox"
              checked={Boolean(checked[d.id])}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setChecked((prev) => ({ ...prev, [d.id]: e.target.checked }))}
            />,
            d.clientName,
            d.project,
            <Money key={`m-${d.id}`} value={d.amount} />,
            d.receivedAt,
            d.status,
          ])}
        />
      </Card>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>Cleared deposits: <strong><Money value={clearedDeposits} /></strong></div>
        <div>Cleared debits: <strong><Money value={clearedDebits} /></strong></div>
        <div>
          Difference:{' '}
          <strong style={{ color: footerDiff === 0 ? T.green : T.red }}>
            <Money value={footerDiff} />
          </strong>
        </div>
        <Btn disabled={!balanced || footerDiff !== 0}>Post Reconciliation</Btn>
      </div>
      {open && (
        <ModalShell title="Reconciliation line" onClose={() => setOpenId(null)}>
          <Field label="Client"><div>{open.clientName}</div></Field>
          <Field label="Project"><div>{open.project}</div></Field>
          <Field label="Amount"><Money value={open.amount} /></Field>
          <Field label="Received"><div>{open.receivedAt}</div></Field>
          <Field label="Status"><div>{open.status}</div></Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setOpenId(null)}>Close</Btn>
          </div>
        </ModalShell>
      )}
    </Panel>
  )
}
