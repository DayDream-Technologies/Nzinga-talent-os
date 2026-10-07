import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { Card } from '@/components/agency/AgencyUI'
import { T } from '@/lib/tokens'
import { normalizeProspectStage } from '@/constants/prospect-stages'

function Widget({ title, children }: { title: string; children: string }) {
  return (
    <Card hover={false}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.t1, whiteSpace: 'pre-wrap' }}>{children}</div>
    </Card>
  )
}

export function WorkspaceCommandWidgets() {
  const { prospects, tickets, talent, invoices, escrow, expenseLogs } = useAgencyData()
  const { applications } = useAppData()
  const stages = prospects.reduce<Record<string, number>>((acc, prospect) => {
    const stage = normalizeProspectStage(prospect.stage)
    acc[stage] = (acc[stage] || 0) + 1
    return acc
  }, {})
  const stageText = Object.entries(stages).map(([stage, count]) => `${stage}: ${count}`).join('\n') || 'None'
  const openTickets = tickets.filter((t) => t.status !== 'closed' && t.status !== 'resolved').length
  const apps = Object.values(applications)
  const overdue = invoices.filter((inv) => inv.status === 'overdue').length
  const expiring = talent.filter((t) => t.contractEnd).length
  const payoutsDue = expenseLogs.filter((e) => e.status === 'pending').length
  const escrowHeld = escrow.filter((e) => e.status === 'cleared').length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
      <Widget title="Talent Pipeline / Pitch Stages">{stageText}</Widget>
      <Widget title="Submissions / Intake Forms">{`${apps.length} applications`}</Widget>
      <Widget title="Client/Talent Portal Requests">{`${openTickets} open tickets`}</Widget>
      <Widget title="Potential Talent Leads">{`${prospects.filter((p) => !p.lost).length} leads`}</Widget>
      <Widget title="Onboarding / Offboarding Status">{`${talent.filter((t) => t.status === 'active' || t.status === 'current').length} on roster`}</Widget>
      <Widget title="Outstanding Agency Fees / Balances">{`${overdue} overdue invoices`}</Widget>
      <Widget title="Expiring Representation Contracts">{`${expiring} with an end date`}</Widget>
      <Widget title="Retainers / Escrow / Payouts Due">{`${escrowHeld} escrow holds · ${payoutsDue} payouts`}</Widget>
      <Widget title="Talent Asset / Audit Checklists">{`${apps.filter((a) => a.status !== 'submitted').length} incomplete files`}</Widget>
      <Widget title="Vendor & Gig Payables">{`${expenseLogs.length} expense logs`}</Widget>
    </div>
  )
}
