import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgencyData } from '@/context/AgencyDataContext'
import { AGENCY_STAFF } from '@/constants/agency-seed'
import { T } from '@/lib/tokens'
import {
  Badge,
  Btn,
  Card,
  Field,
  Money,
  Panel,
  StatusColor,
  Table,
  inputStyle,
} from './AgencyUI'

export function AgencyWorkspace() {
  const nav = useNavigate()
  const { tickets, tasks, appointments, invoices, escrow, expenseLogs, scenario, talent } = useAgencyData()
  const openTickets = tickets.filter((t) => t.status !== 'resolved').length
  const openTasks = tasks.filter((t) => t.status === 'open').length
  const pendingPayouts = expenseLogs.filter((e) => e.status === 'pending').length
  const openAR = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').length

  const tiles = [
    { label: 'Open support tickets', value: openTickets, path: '/support-tickets', color: T.amber },
    { label: 'Agency tasks', value: openTasks, path: '/agency-tasks', color: T.blue },
    { label: 'Open client invoices', value: openAR, path: '/client-invoices', color: T.purple },
    { label: 'Escrow balances', value: escrow.filter((e) => e.status === 'cleared').length, path: '/escrow-deposit', color: T.cyan },
    { label: 'Pending talent payouts', value: pendingPayouts, path: '/issue-payouts', color: T.green },
    { label: 'Active roster', value: talent.filter((t) => t.status === 'active').length, path: '/active-roster', color: T.cyan },
  ]

  return (
    <Panel
      title={`Good morning, ${AGENCY_STAFF.name.split(' ')[0]}`}
      subtitle={`${AGENCY_STAFF.title} · Today’s ops for ${scenario.client} × ${scenario.talent} · ${scenario.name}`}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 18 }}>
        {tiles.map((t) => (
          <Card key={t.label} style={{ cursor: 'pointer' }}>
            <div onClick={() => nav(t.path)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && nav(t.path)}>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.color }}>{t.value}</div>
              <div style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>{t.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Morning checklist</div>
          <ol style={{ margin: 0, paddingLeft: 18, color: T.t2, fontSize: 13, lineHeight: 1.7 }}>
            <li>Review Nike support ticket — confirm Maya availability</li>
            <li>Check Appointments for Nike briefing call</li>
            <li>Create Agency Task: send contract to Nike</li>
            <li>Block Maya on Shared Calendar for shoot dates</li>
          </ol>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn onClick={() => nav('/support-tickets')}>Support Tickets</Btn>
            <Btn variant="secondary" onClick={() => nav('/appointments')}>Appointments</Btn>
            <Btn variant="secondary" onClick={() => nav('/calendar')}>Calendar</Btn>
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Scenario snapshot</div>
          <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.6 }}>
            <div><strong>Client:</strong> {scenario.client}</div>
            <div><strong>Talent:</strong> {scenario.talent}</div>
            <div><strong>Project:</strong> {scenario.name}</div>
            <div><strong>Gross:</strong> <Money value={scenario.gross} /></div>
            <div><strong>Agency (20%):</strong> <Money value={scenario.agencyShare} /></div>
            <div><strong>Talent (80%):</strong> <Money value={scenario.talentShare} /></div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn onClick={() => nav('/client-invoices')}>Client Invoices</Btn>
            <Btn variant="secondary" onClick={() => nav('/escrow-deposit')}>Record Escrow</Btn>
            <Btn variant="secondary" onClick={() => nav('/issue-payouts')}>Issue Payouts</Btn>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Next up</div>
          <Table
            headers={['When', 'Item', 'Type']}
            rows={[
              ...appointments.slice(0, 2).map((a) => [
                new Date(a.startsAt).toLocaleString(),
                a.title,
                <Badge key={a.id} color={T.blue}>Meeting</Badge>,
              ]),
              ...tasks.filter((t) => t.status === 'open').slice(0, 2).map((t) => [
                t.due,
                t.title,
                <Badge key={t.id} color={T.amber}>Task</Badge>,
              ]),
            ]}
          />
        </Card>
      </div>
    </Panel>
  )
}

export function AgencyModule({ moduleId }: { moduleId: string }) {
  switch (moduleId) {
    case 'prospects':
      return <ProspectsModule />
    case 'renewal-offers':
      return <RenewalOffersModule />
    case 'active-roster':
      return <ActiveRosterModule />
    case 'prospect-tracking':
      return <ProspectTrackingModule />
    case 'send-email':
      return <SendEmailModule />
    case 'messaging':
      return <MessagingModule />
    case 'support-tickets':
      return <SupportTicketsModule />
    case 'agency-tasks':
      return <AgencyTasksModule />
    case 'appointments':
      return <AppointmentsModule />
    case 'new-ticket':
      return <NewTicketModule />
    case 'calendar':
      return <CalendarModule />
    case 'escrow-deposit':
      return <EscrowModule />
    case 'client-invoices':
      return <InvoicesModule />
    case 'post-retainers':
      return <PostRetainersModule />
    case 'overdue-interest':
      return <OverdueInterestModule />
    case 'batch-receipts':
      return <BatchReceiptsModule />
    case 'retainer-plans':
      return <RetainerPlansModule />
    case 'log-expense':
      return <LogExpenseModule />
    case 'vendors':
      return <VendorsModule />
    case 'disbursements':
      return <DisbursementsModule />
    case 'issue-payouts':
      return <IssuePayoutsModule />
    case 'report-roster-scorecard':
      return <ReportRosterScorecard />
    case 'report-applicant-pool':
      return <ReportApplicantPool />
    case 'report-escrow-balances':
      return <ReportEscrow />
    case 'report-onboarding':
      return <ReportOnboarding />
    case 'report-roster-openings':
      return <ReportOpenings />
    case 'report-gross-bookings':
      return <ReportGrossBookings />
    case 'report-ar-aging':
      return <ReportArAging />
    case 'report-overdue-accounts':
      return <ReportOverdue />
    case 'report-pending-payouts':
      return <ReportPendingPayouts />
    default:
      return (
        <Panel title="Not found" subtitle="This agency module is not registered.">
          <Btn onClick={() => window.history.back()}>Go back</Btn>
        </Panel>
      )
  }
}

function ProspectsModule() {
  const { prospects, advanceProspect } = useAgencyData()
  return (
    <Panel title="Prospects" subtitle="Inbound talent applicants waiting for agent screening.">
      <Card>
        <Table
          headers={['Name', 'Email', 'Stage', 'Source', 'Submitted', '']}
          rows={prospects.map((p) => [
            p.name,
            p.email,
            <Badge key={p.id} color={StatusColor(p.stage)}>{p.stage}</Badge>,
            p.source,
            new Date(p.submittedAt).toLocaleDateString(),
            <Btn key={`a-${p.id}`} variant="secondary" onClick={() => advanceProspect(p.id)}>Advance</Btn>,
          ])}
        />
      </Card>
    </Panel>
  )
}

function RenewalOffersModule() {
  const { talent, createRenewalOffer } = useAgencyData()
  const [msg, setMsg] = useState('')
  return (
    <Panel title="Create Renewal Offers" subtitle="Draft renewal representation offers for signed roster talent.">
      <Card>
        <Table
          headers={['Talent', 'Role', 'Status', '']}
          rows={talent.map((t) => [
            t.name,
            t.role,
            <Badge key={t.id} color={StatusColor(t.status)}>{t.status}</Badge>,
            <Btn
              key={`r-${t.id}`}
              onClick={() => setMsg(createRenewalOffer(t.id))}
            >
              Create offer
            </Btn>,
          ])}
        />
        {msg && <div style={{ marginTop: 12, color: T.green, fontWeight: 600 }}>{msg}</div>}
      </Card>
    </Panel>
  )
}

function ActiveRosterModule() {
  const { talent } = useAgencyData()
  return (
    <Panel title="Active Roster" subtitle="Signed talent available for booking.">
      <Card>
        <Table
          headers={['Name', 'Role', 'Niches', 'Availability', 'Bank', 'Tax forms']}
          rows={talent
            .filter((t) => t.status === 'active')
            .map((t) => [
              t.name,
              t.role,
              t.niches.join(', '),
              t.available ? <Badge color={T.green}>Available</Badge> : <Badge color={T.amber}>Booked</Badge>,
              t.bankReady ? 'Ready' : 'Missing',
              t.taxFormsReady ? 'Ready' : 'Missing',
            ])}
        />
      </Card>
    </Panel>
  )
}

function ProspectTrackingModule() {
  const { prospects } = useAgencyData()
  const stages = ['new', 'screening', 'interview', 'offer', 'signed'] as const
  return (
    <Panel title="Prospect Tracking Board" subtitle="Kanban view of the applicant pipeline.">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, minmax(140px, 1fr))`, gap: 10 }}>
        {stages.map((stage) => (
          <Card key={stage} style={{ minHeight: 220, background: '#fafbfc' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', marginBottom: 10 }}>
              {stage} · {prospects.filter((p) => p.stage === stage).length}
            </div>
            {prospects
              .filter((p) => p.stage === stage)
              .map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 8,
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ color: T.t3, marginTop: 2 }}>{p.source}</div>
                </div>
              ))}
          </Card>
        ))}
      </div>
    </Panel>
  )
}

function SendEmailModule() {
  const { sendMessage, messages, clients } = useAgencyData()
  const [to, setTo] = useState(clients[0]?.email || '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [ok, setOk] = useState('')
  return (
    <Panel title="Send Email" subtitle="Compose client or talent email from the agency desk.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <Field label="To">
            <input style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Subject">
            <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Message">
            <textarea style={{ ...inputStyle, minHeight: 120 }} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <Btn
            onClick={() => {
              if (!to || !subject) return
              sendMessage({ channel: 'email', to, subject, preview: body.slice(0, 80) })
              setOk('Email queued and logged.')
              setSubject('')
              setBody('')
            }}
          >
            Send email
          </Btn>
          {ok && <div style={{ marginTop: 8, color: T.green, fontSize: 12 }}>{ok}</div>}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent email</div>
          <Table
            headers={['To', 'Subject', 'Status']}
            rows={messages
              .filter((m) => m.channel === 'email')
              .map((m) => [m.to, m.subject, <Badge key={m.id} color={T.green}>{m.status}</Badge>])}
          />
        </Card>
      </div>
    </Panel>
  )
}

function MessagingModule() {
  const { sendMessage, messages } = useAgencyData()
  const [to, setTo] = useState('')
  const [preview, setPreview] = useState('')
  return (
    <Panel title="Text Messaging Center" subtitle="SMS outreach to talent and client contacts.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <Field label="Mobile / contact">
            <input style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} placeholder="+1…" />
          </Field>
          <Field label="Message">
            <textarea style={{ ...inputStyle, minHeight: 100 }} value={preview} onChange={(e) => setPreview(e.target.value)} />
          </Field>
          <Btn
            onClick={() => {
              if (!to || !preview) return
              sendMessage({ channel: 'sms', to, subject: 'SMS', preview })
              setPreview('')
            }}
          >
            Send text
          </Btn>
        </Card>
        <Card>
          <Table
            headers={['To', 'Preview', 'When']}
            rows={messages
              .filter((m) => m.channel === 'sms')
              .map((m) => [m.to, m.preview, new Date(m.sentAt).toLocaleString()])}
          />
        </Card>
      </div>
    </Panel>
  )
}

function SupportTicketsModule() {
  const { tickets, updateTicket } = useAgencyData()
  const nav = useNavigate()
  return (
    <Panel
      title="Support Tickets"
      subtitle="Client requests and availability confirmations."
      actions={<Btn onClick={() => nav('/new-ticket')}>+ New ticket</Btn>}
    >
      <Card>
        <Table
          headers={['Subject', 'Client', 'Talent', 'Priority', 'Status', '']}
          rows={tickets.map((t) => [
            <div key={`s-${t.id}`}>
              <div style={{ fontWeight: 600 }}>{t.subject}</div>
              <div style={{ color: T.t3, fontSize: 11, marginTop: 2 }}>{t.body}</div>
            </div>,
            t.clientName,
            t.talentName || '—',
            <Badge key={`p-${t.id}`} color={t.priority === 'high' ? T.red : T.amber}>{t.priority}</Badge>,
            <Badge key={`st-${t.id}`} color={StatusColor(t.status)}>{t.status}</Badge>,
            <div key={`a-${t.id}`} style={{ display: 'flex', gap: 6 }}>
              {t.status !== 'resolved' && (
                <Btn variant="secondary" onClick={() => updateTicket(t.id, { status: 'in_progress' })}>Start</Btn>
              )}
              {t.status !== 'resolved' && (
                <Btn variant="success" onClick={() => updateTicket(t.id, { status: 'resolved' })}>Resolve</Btn>
              )}
            </div>,
          ])}
        />
      </Card>
    </Panel>
  )
}

function AgencyTasksModule() {
  const { tasks, addTask, completeTask } = useAgencyData()
  const [title, setTitle] = useState('')
  return (
    <Panel title="Agency Tasks" subtitle="Internal to-dos for booking agents and ops.">
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder='e.g. Send contract agreement to Nike production team'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Btn
            onClick={() => {
              if (!title.trim()) return
              addTask({
                title: title.trim(),
                assignee: AGENCY_STAFF.name,
                due: new Date().toISOString().slice(0, 10),
                status: 'open',
                relatedClient: 'Nike',
              })
              setTitle('')
            }}
          >
            Add task
          </Btn>
        </div>
      </Card>
      <Card>
        <Table
          headers={['Task', 'Assignee', 'Due', 'Status', '']}
          rows={tasks.map((t) => [
            t.title,
            t.assignee,
            t.due,
            <Badge key={t.id} color={StatusColor(t.status)}>{t.status}</Badge>,
            t.status === 'open' ? (
              <Btn key={`c-${t.id}`} variant="success" onClick={() => completeTask(t.id)}>Complete</Btn>
            ) : (
              '—'
            ),
          ])}
        />
      </Card>
    </Panel>
  )
}

function AppointmentsModule() {
  const { appointments, addAppointment } = useAgencyData()
  const [title, setTitle] = useState('Nike follow-up call')
  return (
    <Panel title="Appointments & Meetings" subtitle="Briefings, castings, and client calls.">
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Field label="New appointment">
              <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
          </div>
          <Btn
            onClick={() => {
              const start = new Date()
              start.setHours(start.getHours() + 2)
              const end = new Date(start.getTime() + 30 * 60000)
              addAppointment({
                title,
                withWhom: 'Nike Production',
                startsAt: start.toISOString(),
                endsAt: end.toISOString(),
                location: 'Zoom',
                notes: '',
              })
            }}
          >
            Schedule
          </Btn>
        </div>
      </Card>
      <Card>
        <Table
          headers={['Title', 'With', 'Starts', 'Location']}
          rows={appointments.map((a) => [
            a.title,
            a.withWhom,
            new Date(a.startsAt).toLocaleString(),
            a.location,
          ])}
        />
      </Card>
    </Panel>
  )
}

function NewTicketModule() {
  const { addTicket, clients } = useAgencyData()
  const nav = useNavigate()
  const [subject, setSubject] = useState('Last-minute schedule change')
  const [body, setBody] = useState('')
  return (
    <Panel title="New Tickets" subtitle="Quickly create a support record for an inbound client request.">
      <Card style={{ maxWidth: 520 }}>
        <Field label="Client">
          <input style={inputStyle} value={clients[0]?.name || 'Nike'} readOnly />
        </Field>
        <Field label="Subject">
          <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Details">
          <textarea style={{ ...inputStyle, minHeight: 100 }} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <Btn
          onClick={() => {
            addTicket({
              subject,
              clientId: clients[0]?.id || 'client_nike',
              clientName: clients[0]?.name || 'Nike',
              talentName: 'Maya Rivera',
              status: 'open',
              priority: 'high',
              body: body || 'Client called with a last-minute schedule change.',
              assignee: AGENCY_STAFF.name,
            })
            nav('/support-tickets')
          }}
        >
          Create ticket
        </Btn>
      </Card>
    </Panel>
  )
}

function CalendarModule() {
  const { calendar, addCalendarEvent, scenario } = useAgencyData()
  return (
    <Panel
      title="Calendar"
      subtitle="Shared agency calendar — bookings block talent availability for the whole team."
      actions={
        <Btn
          onClick={() =>
            addCalendarEvent({
              title: `${scenario.talent} — ${scenario.name}`,
              date: '2026-08-12',
              talentName: scenario.talent,
              clientName: scenario.client,
              type: 'booking',
            })
          }
        >
          Add Maya shoot block
        </Btn>
      }
    >
      <Card>
        <Table
          headers={['Date', 'Title', 'Talent', 'Client', 'Type']}
          rows={[...calendar]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((e) => [
              e.date,
              e.title,
              e.talentName || '—',
              e.clientName || '—',
              <Badge key={e.id} color={e.type === 'booking' ? T.purple : T.blue}>{e.type}</Badge>,
            ])}
        />
      </Card>
    </Panel>
  )
}

function InvoicesModule() {
  const { invoices, createInvoice, scenario } = useAgencyData()
  return (
    <Panel
      title="Client Invoices"
      subtitle="Create and send official client invoices after talent wraps a job."
      actions={
        <Btn
          onClick={() =>
            createInvoice({
              clientId: 'client_nike',
              clientName: scenario.client,
              talentName: scenario.talent,
              project: scenario.name,
              amount: scenario.gross,
              commissionPct: scenario.commissionPct,
              status: 'sent',
              issuedAt: new Date().toISOString().slice(0, 10),
              dueAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            })
          }
        >
          Invoice Nike $10,000
        </Btn>
      }
    >
      <Card>
        <Table
          headers={['Invoice', 'Client', 'Talent', 'Project', 'Amount', 'Due', 'Status']}
          rows={invoices.map((inv) => [
            inv.id,
            inv.clientName,
            inv.talentName,
            inv.project,
            <Money key={`m-${inv.id}`} value={inv.amount} />,
            inv.dueAt,
            <Badge key={`s-${inv.id}`} color={StatusColor(inv.status)}>{inv.status}</Badge>,
          ])}
        />
      </Card>
    </Panel>
  )
}

function OverdueInterestModule() {
  const { invoices, applyOverdueInterest } = useAgencyData()
  const candidates = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
  return (
    <Panel title="Post Overdue Interest" subtitle="Add late-fee penalties when 30-day terms are exceeded.">
      <Card>
        <Table
          headers={['Client', 'Project', 'Amount', 'Interest applied', '']}
          rows={candidates.map((inv) => [
            inv.clientName,
            inv.project,
            <Money key={`a-${inv.id}`} value={inv.amount} />,
            <Money key={`i-${inv.id}`} value={inv.interestApplied} />,
            <Btn key={`b-${inv.id}`} variant="danger" onClick={() => applyOverdueInterest(inv.id, 1.5)}>
              Post 1.5% interest
            </Btn>,
          ])}
        />
      </Card>
    </Panel>
  )
}

function BatchReceiptsModule() {
  const { invoices, batchReceipts } = useAgencyData()
  const [selected, setSelected] = useState<string[]>([])
  const open = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue' || i.status === 'partial')
  return (
    <Panel title="Batch Client Receipts" subtitle="Apply one client payment across multiple open invoices.">
      <Card>
        <Table
          headers={['', 'Client', 'Project', 'Amount', 'Status']}
          rows={open.map((inv) => [
            <input
              key={`c-${inv.id}`}
              type="checkbox"
              checked={selected.includes(inv.id)}
              onChange={(e) =>
                setSelected((prev) =>
                  e.target.checked ? [...prev, inv.id] : prev.filter((id) => id !== inv.id),
                )
              }
            />,
            inv.clientName,
            inv.project,
            <Money key={`m-${inv.id}`} value={inv.amount} />,
            <Badge key={`s-${inv.id}`} color={StatusColor(inv.status)}>{inv.status}</Badge>,
          ])}
        />
        <div style={{ marginTop: 12 }}>
          <Btn
            disabled={selected.length === 0}
            onClick={() => {
              batchReceipts(selected)
              setSelected([])
            }}
          >
            Clear selected invoices
          </Btn>
        </div>
      </Card>
    </Panel>
  )
}

function RetainerPlansModule() {
  const { retainers, addRetainer, clients } = useAgencyData()
  return (
    <Panel
      title="Manage Retainer Plans"
      subtitle="Set up ongoing monthly client retainer contracts."
      actions={
        <Btn
          onClick={() =>
            addRetainer({
              clientId: clients[0]?.id || 'client_nike',
              clientName: clients[0]?.name || 'Nike',
              monthlyAmount: 5000,
              dayOfMonth: 1,
              active: true,
              description: 'Monthly model retainer — Nike',
            })
          }
        >
          Add Nike retainer
        </Btn>
      }
    >
      <Card>
        <Table
          headers={['Client', 'Monthly', 'Bill day', 'Active', 'Description']}
          rows={retainers.map((r) => [
            r.clientName,
            <Money key={`m-${r.id}`} value={r.monthlyAmount} />,
            String(r.dayOfMonth),
            r.active ? 'Yes' : 'No',
            r.description,
          ])}
        />
      </Card>
    </Panel>
  )
}

function PostRetainersModule() {
  const { retainers, postRetainers } = useAgencyData()
  const [note, setNote] = useState('')
  return (
    <Panel title="Post Recurring Retainers" subtitle="Auto-bill active retainer plans (e.g. on the 1st).">
      <Card>
        <p style={{ fontSize: 13, color: T.t2, marginBottom: 12 }}>
          Active plans: <strong>{retainers.filter((r) => r.active).length}</strong>
        </p>
        <Btn
          onClick={() => {
            const n = postRetainers()
            setNote(n ? `Posted ${n} retainer invoice(s).` : 'No active retainer plans to post.')
          }}
        >
          Post retainers now
        </Btn>
        {note && <div style={{ marginTop: 10, color: T.green }}>{note}</div>}
      </Card>
    </Panel>
  )
}

function EscrowModule() {
  const { escrow, recordEscrow, invoices, scenario } = useAgencyData()
  const paidOrSent = invoices[0]
  return (
    <Panel
      title="Record Escrow / Deposit"
      subtitle="Log client wire payments into the agency holding account before splitting funds."
      actions={
        <Btn
          onClick={() =>
            recordEscrow({
              clientName: scenario.client,
              project: scenario.name,
              amount: scenario.gross,
              receivedAt: new Date().toISOString().slice(0, 10),
              status: 'cleared',
              invoiceId: paidOrSent?.id,
              notes: 'Wire received — funds cleared and ready to split.',
            })
          }
        >
          Record Nike $10,000 deposit
        </Btn>
      }
    >
      <Card>
        <Table
          headers={['Client', 'Project', 'Amount', 'Received', 'Status', 'Notes']}
          rows={escrow.map((e) => [
            e.clientName,
            e.project,
            <Money key={`m-${e.id}`} value={e.amount} />,
            e.receivedAt,
            <Badge key={`s-${e.id}`} color={StatusColor(e.status)}>{e.status}</Badge>,
            e.notes,
          ])}
        />
      </Card>
    </Panel>
  )
}

function LogExpenseModule() {
  const { expenseLogs, logExpenseSplit, scenario } = useAgencyData()
  return (
    <Panel
      title="Log Expense / Payout"
      subtitle="Split gross job proceeds into agency commission and talent payout."
      actions={
        <Btn
          onClick={() =>
            logExpenseSplit({
              project: scenario.name,
              clientName: scenario.client,
              talentName: scenario.talent,
              gross: scenario.gross,
              commissionPct: scenario.commissionPct,
            })
          }
        >
          Log Nike / Maya split
        </Btn>
      }
    >
      <Card>
        <Table
          headers={['Project', 'Client', 'Talent', 'Gross', 'Agency', 'Talent share', 'Status']}
          rows={expenseLogs.map((e) => [
            e.project,
            e.clientName,
            e.talentName,
            <Money key={`g-${e.id}`} value={e.gross} />,
            <Money key={`a-${e.id}`} value={e.agencyCommission} />,
            <Money key={`t-${e.id}`} value={e.talentShare} />,
            <Badge key={`s-${e.id}`} color={StatusColor(e.status)}>{e.status}</Badge>,
          ])}
        />
      </Card>
    </Panel>
  )
}

function VendorsModule() {
  const { vendors } = useAgencyData()
  return (
    <Panel title="Vendors & Service Providers" subtitle="Directory of talent banking details and service vendors.">
      <Card>
        <Table
          headers={['Name', 'Type', 'Bank last 4', 'Tax forms', 'Email']}
          rows={vendors.map((v) => [
            v.name,
            v.type,
            `•••• ${v.bankLast4}`,
            v.taxFormsReady ? <Badge color={T.green}>Ready</Badge> : <Badge color={T.red}>Missing</Badge>,
            v.email,
          ])}
        />
      </Card>
    </Panel>
  )
}

function DisbursementsModule() {
  const { disbursements } = useAgencyData()
  return (
    <Panel title="Disbursements / Payouts" subtitle="Master log of completed talent and vendor payments.">
      <Card>
        <Table
          headers={['Payee', 'Amount', 'Method', 'Project', 'Status', 'Paid at']}
          rows={disbursements.map((d) => [
            d.payee,
            <Money key={`m-${d.id}`} value={d.amount} />,
            d.method,
            d.project,
            <Badge key={`s-${d.id}`} color={StatusColor(d.status)}>{d.status}</Badge>,
            d.paidAt ? new Date(d.paidAt).toLocaleString() : '—',
          ])}
        />
      </Card>
    </Panel>
  )
}

function IssuePayoutsModule() {
  const { expenseLogs, issuePayout } = useAgencyData()
  const pending = expenseLogs.filter((e) => e.status === 'pending')
  return (
    <Panel title="Issue Talent Payouts" subtitle="Execute payday direct deposits for pending talent shares.">
      <Card>
        <Table
          headers={['Talent', 'Project', 'Amount', '']}
          rows={pending.map((e) => [
            e.talentName,
            e.project,
            <Money key={`m-${e.id}`} value={e.talentShare} />,
            <Btn key={`b-${e.id}`} variant="success" onClick={() => issuePayout(e.id)}>
              Execute payout
            </Btn>,
          ])}
        />
        {pending.length === 0 && (
          <div style={{ padding: 16, color: T.t3, fontSize: 13 }}>
            No pending payouts. Log an expense split first, then return here on payday.
          </div>
        )}
      </Card>
    </Panel>
  )
}

function ReportRosterScorecard() {
  const { talent, invoices, expenseLogs } = useAgencyData()
  const revenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const commission = expenseLogs.reduce((s, e) => s + e.agencyCommission, 0)
  return (
    <Panel title="Roster Performance Scorecard" subtitle="Active bookings and revenue across the roster.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        <Card><div style={{ fontSize: 22, fontWeight: 800 }}>{talent.filter((t) => t.status === 'active').length}</div><div style={{ color: T.t3, fontSize: 12 }}>Active roster</div></Card>
        <Card><div style={{ fontSize: 22, fontWeight: 800 }}><Money value={revenue} /></div><div style={{ color: T.t3, fontSize: 12 }}>Paid bookings</div></Card>
        <Card><div style={{ fontSize: 22, fontWeight: 800 }}><Money value={commission} /></div><div style={{ color: T.t3, fontSize: 12 }}>Agency commission</div></Card>
      </div>
      <Card>
        <Table
          headers={['Talent', 'Availability', 'Booked dates']}
          rows={talent.map((t) => [
            t.name,
            t.available ? 'Available' : 'Booked',
            t.bookedDates.join(', ') || '—',
          ])}
        />
      </Card>
    </Panel>
  )
}

function ReportApplicantPool() {
  const { prospects } = useAgencyData()
  const byStage = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of prospects) map[p.stage] = (map[p.stage] || 0) + 1
    return map
  }, [prospects])
  return (
    <Panel title="Applicant Pool & Pipeline Log" subtitle="How many applicants are waiting for agent screenings.">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {Object.entries(byStage).map(([k, v]) => (
          <Card key={k} style={{ minWidth: 120 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{v}</div>
            <div style={{ fontSize: 11, color: T.t3 }}>{k}</div>
          </Card>
        ))}
      </div>
      <Card>
        <Table
          headers={['Name', 'Stage', 'Source', 'Notes']}
          rows={prospects.map((p) => [p.name, p.stage, p.source, p.notes])}
        />
      </Card>
    </Panel>
  )
}

function ReportEscrow() {
  const { escrow } = useAgencyData()
  const held = escrow.filter((e) => e.status === 'cleared').reduce((s, e) => s + e.amount, 0)
  return (
    <Panel title="Escrow & Deposit Balances" subtitle="Client project funds currently held in the agency account.">
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: T.t3 }}>Total cleared / held</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}><Money value={held} /></div>
      </Card>
      <Card>
        <Table
          headers={['Client', 'Project', 'Amount', 'Status']}
          rows={escrow.map((e) => [
            e.clientName,
            e.project,
            <Money key={e.id} value={e.amount} />,
            e.status,
          ])}
        />
      </Card>
    </Panel>
  )
}

function ReportOnboarding() {
  const { talent, prospects } = useAgencyData()
  return (
    <Panel title="Onboarding & Offboarding" subtitle="Talent moving onto or off the active roster.">
      <Card>
        <Table
          headers={['Name', 'Type', 'Status']}
          rows={[
            ...prospects
              .filter((p) => p.stage === 'offer' || p.stage === 'signed')
              .map((p) => [p.name, 'Onboarding prospect', p.stage]),
            ...talent
              .filter((t) => t.status === 'offboarding')
              .map((t) => [t.name, 'Offboarding', t.status]),
            ...talent
              .filter((t) => t.status === 'active')
              .slice(0, 1)
              .map((t) => [t.name, 'Recently signed', 'active']),
          ]}
        />
      </Card>
    </Panel>
  )
}

function ReportOpenings() {
  const { talent } = useAgencyData()
  return (
    <Panel title="Roster Openings & Availability" subtitle="Who is free for new bookings.">
      <Card>
        <Table
          headers={['Talent', 'Available', 'Niches']}
          rows={talent.map((t) => [
            t.name,
            t.available ? <Badge color={T.green}>Open</Badge> : <Badge color={T.amber}>Unavailable</Badge>,
            t.niches.join(', '),
          ])}
        />
      </Card>
    </Panel>
  )
}

function ReportGrossBookings() {
  const { invoices, expenseLogs } = useAgencyData()
  const gross = invoices.reduce((s, i) => s + i.amount, 0)
  const commission = expenseLogs.reduce((s, e) => s + e.agencyCommission, 0)
  return (
    <Panel title="Gross Bookings & Commission Summary" subtitle="Verify agency commission profits.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <Card><div style={{ color: T.t3, fontSize: 12 }}>Gross bookings</div><div style={{ fontSize: 26, fontWeight: 800 }}><Money value={gross} /></div></Card>
        <Card><div style={{ color: T.t3, fontSize: 12 }}>Agency commission</div><div style={{ fontSize: 26, fontWeight: 800 }}><Money value={commission} /></div></Card>
      </div>
      <Card>
        <Table
          headers={['Client', 'Project', 'Invoice', 'Commission logged']}
          rows={invoices.map((inv) => {
            const log = expenseLogs.find((e) => e.project === inv.project)
            return [
              inv.clientName,
              inv.project,
              <Money key={`i-${inv.id}`} value={inv.amount} />,
              log ? <Money key={`c-${inv.id}`} value={log.agencyCommission} /> : '—',
            ]
          })}
        />
      </Card>
    </Panel>
  )
}

function ReportArAging() {
  const { invoices } = useAgencyData()
  return (
    <Panel title="Aged Client Invoices (AR Aging)" subtitle="Open receivables by due date.">
      <Card>
        <Table
          headers={['Client', 'Due', 'Amount', 'Status', 'Interest']}
          rows={invoices
            .filter((i) => i.status !== 'paid')
            .map((inv) => [
              inv.clientName,
              inv.dueAt,
              <Money key={`a-${inv.id}`} value={inv.amount} />,
              <Badge key={`s-${inv.id}`} color={StatusColor(inv.status)}>{inv.status}</Badge>,
              <Money key={`i-${inv.id}`} value={inv.interestApplied} />,
            ])}
        />
      </Card>
    </Panel>
  )
}

function ReportOverdue() {
  const { invoices } = useAgencyData()
  const overdue = invoices.filter((i) => i.status === 'overdue')
  return (
    <Panel title="Overdue Client Accounts" subtitle="Accounts past payment terms.">
      <Card>
        <Table
          headers={['Client', 'Project', 'Amount', 'Due']}
          rows={overdue.map((inv) => [
            inv.clientName,
            inv.project,
            <Money key={inv.id} value={inv.amount} />,
            inv.dueAt,
          ])}
        />
        {overdue.length === 0 && (
          <div style={{ padding: 16, color: T.t3 }}>No overdue accounts. Use Post Overdue Interest to flag late invoices.</div>
        )}
      </Card>
    </Panel>
  )
}

function ReportPendingPayouts() {
  const { expenseLogs } = useAgencyData()
  const pending = expenseLogs.filter((e) => e.status === 'pending')
  return (
    <Panel title="Pending Talent Payouts (AP Aging)" subtitle="Ensure completed gigs are queued for payday.">
      <Card>
        <Table
          headers={['Talent', 'Project', 'Amount owed', 'Logged']}
          rows={pending.map((e) => [
            e.talentName,
            e.project,
            <Money key={e.id} value={e.talentShare} />,
            new Date(e.loggedAt).toLocaleString(),
          ])}
        />
        {pending.length === 0 && (
          <div style={{ padding: 16, color: T.t3 }}>No pending AP. All logged splits have been paid or none logged yet.</div>
        )}
      </Card>
    </Panel>
  )
}
