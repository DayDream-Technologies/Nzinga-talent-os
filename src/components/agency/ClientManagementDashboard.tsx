import { Link } from 'react-router-dom'
import { Card, Panel } from '@/components/agency/AgencyUI'
import { prospectStageLabel } from '@/constants/prospect-stages'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useViewport } from '@/hooks/useViewport'
import { T } from '@/lib/tokens'
import { staffGridColumns } from '@/lib/viewport'

function StatLink({
  to,
  value,
  label,
  detail,
}: {
  to: string
  value: string
  label: string
  detail: string
}) {
  return (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
      <Card>
        <div style={{ fontSize: 26, fontWeight: 700, color: T.t1, lineHeight: 1.15 }}>{value}</div>
        <div style={{ fontSize: 14, fontWeight: 650, color: T.t1, marginTop: 8 }}>{label}</div>
        <div style={{ fontSize: 12, color: T.t3, marginTop: 6, lineHeight: 1.45 }}>{detail}</div>
      </Card>
    </Link>
  )
}

export function ClientManagementDashboard() {
  const { prospects, tickets, talent, invoices, escrow, expenseLogs } = useAgencyData()
  const { applications } = useAppData()
  const band = useViewport()
  const apps = Object.values(applications)
  const openTickets = tickets.filter((ticket) => ticket.status !== 'closed' && ticket.status !== 'resolved')
  const leads = prospects.filter((prospect) => !prospect.lost)
  const onRoster = talent.filter((person) => person.status === 'active' || person.status === 'current')
  const offboarding = talent.filter((person) => person.status === 'offboarding' || person.status === 'past')
  const overdue = invoices.filter((invoice) => invoice.status === 'overdue')
  const overdueTotal = overdue.reduce((sum, invoice) => sum + invoice.amount + (invoice.taxAmount || 0), 0)
  const expiring = talent.filter((person) => person.contractEnd)
  const escrowHeld = escrow.filter((row) => row.status === 'cleared')
  const payoutsDue = expenseLogs.filter((row) => row.status === 'pending')
  const incomplete = apps.filter((app) => app.status !== 'submitted')
  const stages = prospects.reduce<Record<string, number>>((acc, prospect) => {
    const label = prospectStageLabel(prospect.stage)
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})

  return (
    <Panel
      title="Client Management Dashboard"
      subtitle="Counts for prospects, roster, fees, and payouts. My Workspace stays the list of tools."
    >
      <div style={{ display: 'grid', gridTemplateColumns: staffGridColumns(band, 'repeat(3, minmax(0, 1fr))'), gap: 12 }}>
        <StatLink
          to="/prospect-tracking"
          value={String(prospects.length)}
          label="Pitch stages"
          detail={Object.keys(stages).length ? `${Object.keys(stages).length} stages in use` : 'No prospects yet'}
        />
        <StatLink
          to="/applications"
          value={String(apps.length)}
          label="Intake forms"
          detail={`${incomplete.length} not submitted`}
        />
        <StatLink
          to="/support-tickets"
          value={String(openTickets.length)}
          label="Portal requests"
          detail="Open support tickets from clients and talent"
        />
        <StatLink
          to="/prospects"
          value={String(leads.length)}
          label="Talent leads"
          detail={`${prospects.length - leads.length} marked lost`}
        />
        <StatLink
          to="/clients"
          value={String(onRoster.length)}
          label="On roster"
          detail={`${offboarding.length} offboarding or past`}
        />
        <StatLink
          to="/client-invoices"
          value={String(overdue.length)}
          label="Overdue invoices"
          detail={overdue.length ? `$${overdueTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} including tax` : 'None overdue'}
        />
        <StatLink
          to="/renewal-offers"
          value={String(expiring.length)}
          label="Contracts with an end date"
          detail="Roster records that already have a contract end"
        />
        <StatLink
          to="/escrow-deposit"
          value={String(escrowHeld.length)}
          label="Escrow holds"
          detail={`${payoutsDue.length} payouts still pending`}
        />
        <StatLink
          to="/log-expense"
          value={String(expenseLogs.length)}
          label="Vendor and gig payables"
          detail={`${payoutsDue.length} still pending`}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <Card hover={false}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 8 }}>Pitch stages</div>
          {Object.keys(stages).length === 0 ? (
            <div style={{ fontSize: 13, color: T.t3 }}>None yet.</div>
          ) : (
            Object.entries(stages).map(([label, count]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '6px 0',
                  borderTop: `1px solid ${T.cardBorder}`,
                  fontSize: 13,
                  color: T.t2,
                }}
              >
                <span>{label}</span>
                <span style={{ fontWeight: 700, color: T.t1 }}>{count}</span>
              </div>
            ))
          )}
        </Card>
      </div>
    </Panel>
  )
}
