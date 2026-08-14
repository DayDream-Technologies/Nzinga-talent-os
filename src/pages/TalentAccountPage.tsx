import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppData } from '@/context/AppDataContext'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAuth } from '@/hooks/useAuth'
import { useTalentDirectory } from '@/hooks/useTalentDirectory'
import {
  formatContractEnd,
  formatContractStart,
  hasContract,
  isContractLive,
} from '@/lib/contract-dates'
import { STAGE_LABELS } from '@/constants/stages'
import { AGENCY_TICKET_AGENTS } from '@/constants/agency-seed'
import { T } from '@/lib/tokens'
import { Badge, Card, Money, Panel, StatusColor, Table } from '@/components/agency/AgencyUI'
import { TicketDetailModal } from '@/components/agency/TicketDetailModal'
import { TalentLink } from '@/components/talent/TalentLink'

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '6px 0',
        borderBottom: '1px solid #f3f4f6',
        fontSize: 13,
      }}
    >
      <span style={{ color: T.t3 }}>{label}</span>
      <span style={{ color: T.t1, fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export function TalentAccountPage() {
  const { accountId: rawId } = useParams<{ accountId: string }>()
  const accountId = rawId ? decodeURIComponent(rawId) : ''
  const directory = useTalentDirectory()
  const entry = directory.byAccountId.get(accountId)
  const { talents, history, tasks } = useAppData()
  const { tickets, invoices, calendar, expenseLogs, disbursements, appointments, updateTicket, prospects } =
    useAgencyData()
  const { user } = useAuth()
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  if (!entry) {
    return (
      <Panel title="Talent account" subtitle="This account was not found in the current organization.">
        <Card>
          <div style={{ color: T.t3, fontSize: 13 }}>No talent, prospect, or roster record uses account ID {accountId || '—' }.</div>
          <div style={{ marginTop: 12 }}>
            <Link to="/prospects" style={{ color: T.blue, fontWeight: 600 }}>Back to Prospects</Link>
          </div>
        </Card>
      </Panel>
    )
  }

  const name = entry.name
  const pipeline = talents.find((t) => t.account_number === accountId || t.id === entry.pipelineId)
  const prospect = prospects.find((p) => p.accountId === accountId)
  const relatedTickets = tickets.filter((t) => t.talentName && t.talentName === name)
  const relatedInvoices = invoices.filter((i) => i.talentName === name)
  const relatedEvents = calendar.filter((e) => e.talentName === name)
  const relatedPayouts = expenseLogs.filter((e) => e.talentName === name)
  const relatedDisbursements = disbursements.filter((d) => d.payee === name)
  const relatedHistory = history.filter((h) => h.talent_id && (h.talent_id === pipeline?.id))
  const relatedTasks = tasks.filter((tk) => tk.related_talent && tk.related_talent === pipeline?.id)
  const relatedAppointments = appointments.filter((a) => {
    const talentHit = a.talentNames?.includes(name)
    const titleHit = a.title.includes(name)
    const notesHit = a.notes?.includes(name)
    const withHit = a.withWhom?.includes(name)
    return Boolean(talentHit || titleHit || notesHit || withHit)
  })
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null
  const isDirector = user?.role === 'director'

  return (
    <Panel
      title={entry.name}
      subtitle={`${entry.accountId} · Visible to everyone in this organization`}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Demographics
          </div>
          <FieldRow
            label="Account ID"
            value={
              <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{entry.accountId}</span>
            }
          />
          <FieldRow label="Name" value={entry.name} />
          <FieldRow label="Email" value={entry.email} />
          <FieldRow label="Phone" value={entry.phone} />
          <FieldRow label="Location" value={entry.location} />
          <FieldRow label="Work area" value={entry.workArea} />
          <FieldRow label="Niches" value={entry.niches.join(', ')} />
          <FieldRow label="Union" value={entry.union} />
          <FieldRow label="Handle" value={entry.socialHandle} />
          <FieldRow label="Platform" value={entry.platform} />
          <FieldRow label="Role" value={entry.role} />
          {prospect && (
            <>
              <FieldRow label="Organization" value={prospect.organization} />
              <FieldRow label="Date of birth" value={prospect.dateOfBirth} />
              <FieldRow label="Interest level" value={prospect.interestLevel != null ? String(prospect.interestLevel) : undefined} />
              <FieldRow label="Preferred contact" value={prospect.preferredContact} />
              <FieldRow label="Representation" value={prospect.representationType} />
              <FieldRow label="Term length" value={prospect.termLengthYears ? `${prospect.termLengthYears} year(s)` : undefined} />
              <FieldRow label="Assigned agent" value={prospect.assignedAgentName} />
              <FieldRow
                label="Message recipients"
                value={prospect.messageEmails?.length ? prospect.messageEmails.join(', ') : undefined}
              />
              {prospect.isMinor && (
                <>
                  <FieldRow label="Parent name" value={prospect.parentName} />
                  <FieldRow label="Parent email" value={prospect.parentEmail} />
                  <FieldRow label="Parent phone" value={prospect.parentPhone} />
                </>
              )}
            </>
          )}
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Organization status
          </div>
          <FieldRow label="Status" value={entry.statusLabel} />
          <FieldRow
            label="Pipeline stage"
            value={pipeline ? STAGE_LABELS[pipeline.stage] || pipeline.stage : undefined}
          />
          <FieldRow label="Source" value={entry.source} />
          <FieldRow
            label="Submitted"
            value={entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString() : undefined}
          />
          <FieldRow
            label="Contract start"
            value={
              hasContract(entry.contractStart) ? (
                formatContractStart(entry.contractStart)
              ) : (
                <Badge color={T.amber}>Pending</Badge>
              )
            }
          />
          <FieldRow
            label="Contract end"
            value={
              isContractLive(entry.contractStart, entry.contractEnd) ? (
                <Badge color={T.green}>Current</Badge>
              ) : (
                formatContractEnd(entry.contractStart, entry.contractEnd) || undefined
              )
            }
          />
          <FieldRow
            label="Availability"
            value={
              entry.available === undefined
                ? undefined
                : entry.available
                  ? 'Available'
                  : 'Booked'
            }
          />
          <FieldRow
            label="Booked dates"
            value={entry.bookedDates?.length ? entry.bookedDates.join(', ') : undefined}
          />
        </Card>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Work record in this organization
        </div>
        {relatedEvents.length === 0 &&
        relatedInvoices.length === 0 &&
        relatedPayouts.length === 0 &&
        relatedTickets.length === 0 &&
        relatedDisbursements.length === 0 &&
        relatedAppointments.length === 0 &&
        relatedTasks.length === 0 &&
        relatedHistory.length === 0 ? (
          <div style={{ color: T.t3, fontSize: 13 }}>No bookings, invoices, or jobs logged yet.</div>
        ) : null}

        {relatedEvents.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Bookings & calendar</div>
            <Table
              headers={['Date', 'Title', 'Client', 'Type']}
              rows={relatedEvents.map((e) => [
                e.date,
                e.title,
                e.clientName || '—',
                <Badge key={e.id} color={e.type === 'booking' ? T.purple : T.blue}>{e.type}</Badge>,
              ])}
            />
          </div>
        )}

        {relatedInvoices.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Invoices</div>
            <Table
              headers={['Invoice', 'Client', 'Project', 'Amount', 'Status']}
              rows={relatedInvoices.map((inv) => [
                inv.id,
                inv.clientName,
                inv.project,
                <Money key={`m-${inv.id}`} value={inv.amount} />,
                <Badge key={`s-${inv.id}`} color={StatusColor(inv.status)}>{inv.status}</Badge>,
              ])}
            />
          </div>
        )}

        {relatedPayouts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Job splits & payouts</div>
            <Table
              headers={['Project', 'Client', 'Gross', 'Talent share', 'Status']}
              rows={relatedPayouts.map((e) => [
                e.project,
                e.clientName,
                <Money key={`g-${e.id}`} value={e.gross} />,
                <Money key={`t-${e.id}`} value={e.talentShare} />,
                <Badge key={`st-${e.id}`} color={StatusColor(e.status)}>{e.status}</Badge>,
              ])}
            />
          </div>
        )}

        {relatedDisbursements.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Disbursements</div>
            <Table
              headers={['Amount', 'Method', 'Project', 'Status', 'Paid']}
              rows={relatedDisbursements.map((d) => [
                <Money key={`m-${d.id}`} value={d.amount} />,
                d.method,
                d.project,
                <Badge key={`s-${d.id}`} color={StatusColor(d.status)}>{d.status}</Badge>,
                d.paidAt ? new Date(d.paidAt).toLocaleString() : '—',
              ])}
            />
          </div>
        )}

        {relatedTickets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Support tickets</div>
            <Table
              headers={['Subject', 'Client', 'Status']}
              rows={relatedTickets.map((t) => [
                <button
                  key={`subj-${t.id}`}
                  type="button"
                  onClick={() => setSelectedTicketId(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: T.blue,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                >
                  {t.subject}
                </button>,
                t.clientName,
                <Badge key={t.id} color={StatusColor(t.status)}>{t.status}</Badge>,
              ])}
            />
          </div>
        )}

        {relatedAppointments.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Appointments</div>
            <Table
              headers={['When', 'Title', 'With']}
              rows={relatedAppointments.map((a) => [
                new Date(a.startsAt).toLocaleString(),
                a.title,
                a.clientNames?.length ? a.clientNames.join(', ') : a.withWhom,
              ])}
            />
          </div>
        )}

        {relatedTasks.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Internal tasks</div>
            <Table
              headers={['Task', 'Due', 'Status']}
              rows={relatedTasks.map((tk) => [
                tk.title,
                tk.due || '—',
                tk.status,
              ])}
            />
          </div>
        )}

        {relatedHistory.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Activity</div>
            <Table
              headers={['When', 'Type', 'Note']}
              rows={relatedHistory.slice(0, 20).map((h) => [
                new Date(h.ts).toLocaleString(),
                h.type,
                h.text,
              ])}
            />
          </div>
        )}
      </Card>

      <div style={{ fontSize: 12, color: T.t4 }}>
        Linked as <TalentLink accountId={entry.accountId} name={entry.name} /> throughout the organization.
      </div>

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicketId(null)}
          updateTicket={updateTicket}
          isDirector={isDirector}
          agents={AGENCY_TICKET_AGENTS}
        />
      )}
    </Panel>
  )
}
