import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAuth } from '@/hooks/useAuth'
import { AGENCY_STAFF, AGENCY_TICKET_AGENTS } from '@/constants/agency-seed'
import { filterAgencyNav, type AgencyNavGroup } from '@/constants/agency-nav'
import { T } from '@/lib/tokens'
import type { AgencyProspect, SupportTicket, TicketType } from '@/types/agency'
import { TalentLink } from '@/components/talent/TalentLink'
import { TicketDetailModal } from '@/components/agency/TicketDetailModal'
import { AppointmentFormModal } from '@/components/agency/AppointmentFormModal'
import { CreateProspectModal } from '@/components/agency/CreateProspectModal'
import {
  DisbursementFormModal,
  EscrowFormModal,
  ExpenseFormModal,
  InvoiceFormModal,
  RetainerFormModal,
  VendorFormModal,
  invoiceTotal,
} from '@/components/agency/FinanceFormModals'
import { DocViewer } from '@/components/ui/DocViewer'
import type { UploadedDoc } from '@/types'
import {
  formatContractStart,
  hasContract,
  isContractLive,
} from '@/lib/contract-dates'
import {
  Badge,
  Btn,
  Card,
  Field,
  Money,
  Panel,
  StatusColor,
  Table,
  TicketTypeColor,
  inputStyle,
} from './AgencyUI'

const WS = {
  pageBg: '#e8eef5',
  pagePattern:
    'radial-gradient(circle at 15% 85%, rgba(59,130,246,0.06) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(0,45,86,0.04) 0%, transparent 40%)',
  cardBorder: '#dce4ed',
  headerBorder: '#e5e7eb',
  accent: '#2563eb',
  iconBgs: ['#dbeafe', '#bfdbfe', '#93c5fd', '#3b82f6', '#ede9fe', '#cffafe'],
}

const FAVORITE_ICONS: Record<string, string> = {
  'Talent Info': '🏠',
  Communication: '💬',
  'Client Services': '⚙',
  Accounting: '💰',
  Receivables: '📄',
  Payables: '🏦',
}

const REPORT_ICONS: Record<string, string> = {
  'Roster & Booking Reports': '📊',
  'Receivables & Commissions': '💵',
  'Payables & Talent Disbursals': '📤',
}

function workspaceCardStyle(extra: CSSProperties = {}): CSSProperties {
  return {
    background: '#fff',
    border: `1px solid ${WS.cardBorder}`,
    borderRadius: 10,
    boxShadow: '0 2px 10px rgba(0,45,86,0.07)',
    overflow: 'hidden',
    ...extra,
  }
}

function WorkspaceNavGroup({
  group,
  icon,
  iconBg,
  onNav,
}: {
  group: AgencyNavGroup
  icon: string
  iconBg: string
  onNav: (path: string) => void
}) {
  return (
    <div
      style={{
        border: `1px solid ${WS.headerBorder}`,
        borderRadius: 8,
        padding: '10px 12px',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>{group.label}</span>
      </div>
      {group.items.map((item) => (
        <div
          key={item.id}
          onClick={() => onNav(item.path)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNav(item.path)}
          style={{
            fontSize: 12,
            color: WS.accent,
            cursor: 'pointer',
            padding: '2px 0',
            paddingLeft: 33,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none'
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  )
}

export function AgencyWorkspace() {
  const nav = useNavigate()
  const { user } = useAuth()
  const firstName = (user?.name || AGENCY_STAFF.name).split(' ')[0]
  const role = user?.role || 'scout'

  const filteredNav = filterAgencyNav(role)
  const favoriteGroups = filteredNav.filter((c) => c.id !== 'reports').flatMap((c) => c.groups)
  const reportGroups = filteredNav.find((c) => c.id === 'reports')?.groups ?? []

  function go(path: string) {
    nav(`/${path}`)
  }

  return (
    <div
      style={{
        padding: '22px 26px',
        flex: 1,
        overflowY: 'auto',
        minHeight: '100%',
        background: WS.pageBg,
        backgroundImage: WS.pagePattern,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: T.t1,
            fontFamily: 'Georgia, serif',
          }}
        >
          Welcome, {firstName}
        </div>
        <div style={{ fontSize: 13, color: T.t3, marginTop: 3 }}>Let&apos;s get to work.</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: favoriteGroups.length && reportGroups.length ? '1fr 1fr' : '1fr',
          gap: 18,
        }}
      >
        {favoriteGroups.length > 0 && (
          <div style={workspaceCardStyle()}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '11px 14px',
                background: '#fff',
                borderBottom: `2px solid ${WS.accent}`,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>My Favorites</span>
            </div>
            <div
              style={{
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
              }}
            >
              {favoriteGroups.map((group, idx) => (
                <WorkspaceNavGroup
                  key={group.label}
                  group={group}
                  icon={FAVORITE_ICONS[group.label] || '📁'}
                  iconBg={WS.iconBgs[idx % WS.iconBgs.length]}
                  onNav={go}
                />
              ))}
            </div>
          </div>
        )}

        {reportGroups.length > 0 && (
          <div style={workspaceCardStyle()}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                background: '#fff',
                borderBottom: `2px solid ${WS.accent}`,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>My Reports</span>
              <span
                onClick={() => go('reports')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && go('reports')}
                style={{ fontSize: 12, color: WS.accent, cursor: 'pointer' }}
              >
                View all
              </span>
            </div>
            <div
              style={{
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
              }}
            >
              {reportGroups.map((group, idx) => (
                <WorkspaceNavGroup
                  key={group.label}
                  group={group}
                  icon={REPORT_ICONS[group.label] || '📊'}
                  iconBg={WS.iconBgs[idx % WS.iconBgs.length]}
                  onNav={go}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {favoriteGroups.length === 0 && reportGroups.length === 0 && (
        <div style={{ ...workspaceCardStyle(), padding: 28, textAlign: 'center', color: T.t3, fontSize: 13 }}>
          No modules are assigned to your role yet.
        </div>
      )}

      <div
        style={{
          ...workspaceCardStyle(),
          marginTop: 14,
          padding: '9px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: T.t3 }}>
          📢 <strong style={{ color: T.t1 }}>Announcements</strong> — No new announcements
        </span>
        <span
          onClick={() => go('training')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && go('training')}
          style={{ fontSize: 12, color: WS.accent, cursor: 'pointer' }}
        >
          🎓 My Training
        </span>
      </div>
    </div>
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
          <Btn variant="secondary" onClick={() => window.history.back()}>Go back</Btn>
        </Panel>
      )
  }
}

type ProspectSortKey =
  | 'accountId'
  | 'name'
  | 'workArea'
  | 'contractStart'
  | 'contractEnd'
  | 'email'
  | 'stage'
  | 'source'
  | 'submittedAt'
  | 'organization'
  | 'assignedAgentName'
  | 'interestLevel'

const PROSPECT_COLUMNS: Array<{ header: string; key: ProspectSortKey | null }> = [
  { header: 'Account ID', key: 'accountId' },
  { header: 'Name', key: 'name' },
  { header: 'Org', key: 'organization' },
  { header: 'Division', key: 'workArea' },
  { header: 'Agent', key: 'assignedAgentName' },
  { header: 'Interest', key: 'interestLevel' },
  { header: 'Original start', key: 'contractStart' },
  { header: 'Contract end', key: 'contractEnd' },
  { header: 'Email', key: 'email' },
  { header: 'Stage', key: 'stage' },
  { header: 'Source', key: 'source' },
  { header: 'Submitted', key: 'submittedAt' },
  { header: '', key: null },
]

function prospectSortValue(p: AgencyProspect, key: ProspectSortKey): string {
  switch (key) {
    case 'accountId':
      return p.accountId || ''
    case 'name':
      return p.name || ''
    case 'workArea':
      return p.workArea || ''
    case 'organization':
      return p.organization || ''
    case 'assignedAgentName':
      return p.assignedAgentName || ''
    case 'interestLevel':
      return String(p.interestLevel ?? '')
    case 'contractStart':
      return hasContract(p.contractStart) ? p.contractStart || '' : 'pending'
    case 'contractEnd':
      if (!hasContract(p.contractStart)) return ''
      if (isContractLive(p.contractStart, p.contractEnd)) return 'current'
      return p.contractEnd || ''
    case 'email':
      return p.email || ''
    case 'stage':
      return p.stage || ''
    case 'source':
      return p.source || ''
    case 'submittedAt':
      return p.submittedAt || ''
  }
}

function ProspectsModule() {
  const { prospects, advanceProspect, createProspect } = useAgencyData()
  const { user, companyCode } = useAuth()
  const [sortIndex, setSortIndex] = useState(1)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showCreate, setShowCreate] = useState(false)

  const sorted = useMemo(() => {
    const col = PROSPECT_COLUMNS[sortIndex]
    if (!col?.key) return prospects
    const dir = sortDir === 'asc' ? 1 : -1
    return [...prospects].sort((a, b) => {
      const cmp = prospectSortValue(a, col.key!).localeCompare(
        prospectSortValue(b, col.key!),
        undefined,
        { numeric: true, sensitivity: 'base' },
      )
      return cmp * dir
    })
  }, [prospects, sortIndex, sortDir])

  function handleSort(index: number) {
    if (!PROSPECT_COLUMNS[index]?.key) return
    if (sortIndex === index) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortIndex(index)
    setSortDir('asc')
  }

  return (
    <Panel
      title="Prospects"
      subtitle="Inbound talent applicants waiting for agent screening. Click a column header to sort."
      actions={<Btn onClick={() => setShowCreate(true)}>+ Create prospect</Btn>}
    >
      <Card>
        <Table
          headers={PROSPECT_COLUMNS.map((c) => c.header)}
          sortIndex={sortIndex}
          sortDir={sortDir}
          onSort={handleSort}
          rows={sorted.map((p) => [
            <TalentLink key={`id-${p.id}`} accountId={p.accountId} name={p.name}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '0.02em' }}>{p.accountId}</span>
            </TalentLink>,
            <span key={`n-${p.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <TalentLink accountId={p.accountId} name={p.name} />
              {p.isMinor ? <Badge color={T.amber}>Minor</Badge> : null}
            </span>,
            p.organization || '—',
            <Badge key={`w-${p.id}`} color={T.purple}>{p.workArea}</Badge>,
            p.assignedAgentName || '—',
            p.interestLevel != null ? String(p.interestLevel) : '—',
            hasContract(p.contractStart)
              ? formatContractStart(p.contractStart)
              : <Badge key={`ps-${p.id}`} color={T.amber}>Pending</Badge>,
            !hasContract(p.contractStart) ? (
              '—'
            ) : (
              <span key={`ce-${p.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {p.contractEnd?.trim()
                  ? new Date(`${p.contractEnd}T12:00:00`).toLocaleDateString()
                  : 'Open-ended'}
                {isContractLive(p.contractStart, p.contractEnd) ? (
                  <Badge color={T.green}>Current</Badge>
                ) : (
                  <Badge color={T.red}>Ended</Badge>
                )}
              </span>
            ),
            <span key={`em-${p.id}`}>
              {p.email}
              {p.messageEmails?.length > 1 ? (
                <div style={{ fontSize: 10, color: T.t4 }}>+{p.messageEmails.length - 1} msg recip.</div>
              ) : null}
            </span>,
            <Badge key={p.id} color={StatusColor(p.stage)}>{p.stage}</Badge>,
            p.source,
            new Date(p.submittedAt).toLocaleDateString(),
            <Btn key={`a-${p.id}`} variant="success" onClick={() => advanceProspect(p.id)}>Advance</Btn>,
          ])}
        />
      </Card>
      {showCreate && user && (
        <CreateProspectModal
          defaultOrganization={(companyCode || user.company_code || 'NZG').toUpperCase()}
          agent={{ id: user.id, name: user.name }}
          onClose={() => setShowCreate(false)}
          onCreate={(values) => {
            createProspect(values)
            setShowCreate(false)
          }}
        />
      )}
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
            <TalentLink key={t.id} accountId={t.accountId} name={t.name} />,
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
          headers={['Account ID', 'Name', 'Role', 'Niches', 'Availability', 'Bank', 'Tax forms']}
          rows={talent
            .filter((t) => t.status === 'active')
            .map((t) => [
              <TalentLink key={`id-${t.id}`} accountId={t.accountId} name={t.name}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{t.accountId}</span>
              </TalentLink>,
              <TalentLink key={`n-${t.id}`} accountId={t.accountId} name={t.name} />,
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
                  <div style={{ fontWeight: 600 }}><TalentLink accountId={p.accountId} name={p.name} /></div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 700, color: T.t1, marginTop: 3 }}>{p.accountId}</div>
                  <div style={{ color: T.t3, marginTop: 2 }}>{p.workArea} · {p.source}</div>
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
  const { user } = useAuth()
  const nav = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortIndex, setSortIndex] = useState(5) // due by default
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const selected = tickets.find((t) => t.id === selectedId) || null
  const isDirector = user?.role === 'director'
  const today = new Date().toISOString().slice(0, 10)

  const TICKET_COLUMNS: { label: string; key?: keyof SupportTicket | 'actions' }[] = [
    { label: 'Subject', key: 'subject' },
    { label: 'Type', key: 'type' },
    { label: 'Client', key: 'clientName' },
    { label: 'Talent', key: 'talentName' },
    { label: 'Assignee', key: 'assignee' },
    { label: 'Due', key: 'dueDate' },
    { label: 'Priority', key: 'priority' },
    { label: 'Status', key: 'status' },
    { label: '' },
  ]

  const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const STATUS_RANK: Record<string, number> = {
    open: 0,
    in_progress: 1,
    closed: 2,
    resolved: 3,
  }

  function ticketSortValue(t: SupportTicket, key: keyof SupportTicket): string {
    const raw = t[key]
    if (key === 'priority') return String(PRIORITY_RANK[t.priority] ?? 9)
    if (key === 'status') return String(STATUS_RANK[t.status] ?? 9)
    if (raw == null) return ''
    return String(raw)
  }

  const sorted = useMemo(() => {
    const col = TICKET_COLUMNS[sortIndex]
    if (!col?.key || col.key === 'actions') return tickets
    const dir = sortDir === 'asc' ? 1 : -1
    return [...tickets].sort((a, b) => {
      const cmp = ticketSortValue(a, col.key as keyof SupportTicket).localeCompare(
        ticketSortValue(b, col.key as keyof SupportTicket),
        undefined,
        { numeric: true, sensitivity: 'base' },
      )
      return cmp * dir
    })
  }, [tickets, sortIndex, sortDir])

  function handleSort(index: number) {
    if (!TICKET_COLUMNS[index]?.key) return
    if (sortIndex === index) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortIndex(index)
    setSortDir('asc')
  }

  function truncateBody(text: string, max = 72) {
    const oneLine = text.replace(/\s+/g, ' ').trim()
    if (oneLine.length <= max) return oneLine
    return `${oneLine.slice(0, max)}…`
  }

  function formatDue(dueDate: string, status: SupportTicket['status']) {
    if (!dueDate) return '—'
    const label = new Date(dueDate + 'T12:00:00').toLocaleDateString()
    const closed = status === 'closed' || status === 'resolved'
    const overdue = !closed && dueDate < today
    return (
      <span style={{ color: overdue ? T.red : T.t1, fontWeight: overdue ? 600 : 400 }}>
        {label}
      </span>
    )
  }

  return (
    <Panel
      title="Support Tickets"
      subtitle="Client requests and availability confirmations. Click a column header to sort."
      actions={<Btn onClick={() => nav('/new-ticket')}>+ New ticket</Btn>}
    >
      <Card>
        <Table
          headers={TICKET_COLUMNS.map((c) => c.label)}
          sortIndex={sortIndex}
          sortDir={sortDir}
          onSort={handleSort}
          rows={sorted.map((t) => [
            <button
              key={`s-${t.id}`}
              type="button"
              onClick={() => setSelectedId(t.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ fontWeight: 600, color: T.blue }}>{t.subject}</div>
              <div style={{ color: T.t3, fontSize: 11, marginTop: 2 }}>{truncateBody(t.body)}</div>
            </button>,
            <Badge key={`ty-${t.id}`} color={TicketTypeColor(t.type)}>
              {t.type}
            </Badge>,
            t.clientName,
            t.talentName ? <TalentLink key={`tn-${t.id}`} name={t.talentName} /> : '—',
            t.assignee || '—',
            <span key={`d-${t.id}`}>{formatDue(t.dueDate, t.status)}</span>,
            <Badge key={`p-${t.id}`} color={t.priority === 'high' ? T.red : t.priority === 'medium' ? T.amber : T.t3}>
              {t.priority}
            </Badge>,
            <Badge key={`st-${t.id}`} color={StatusColor(t.status)}>
              {t.status}
            </Badge>,
            <Btn key={`a-${t.id}`} variant="secondary" onClick={() => setSelectedId(t.id)}>
              View
            </Btn>,
          ])}
        />
      </Card>
      {selected && (
        <TicketDetailModal
          ticket={selected}
          onClose={() => setSelectedId(null)}
          updateTicket={updateTicket}
          isDirector={isDirector}
          agents={AGENCY_TICKET_AGENTS}
        />
      )}
    </Panel>
  )
}

function AgencyTasksModule() {
  const { tasks, addTask, completeTask } = useAgencyData()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const actor = user?.name || AGENCY_STAFF.name
  const openTasks = tasks.filter((t) => t.status === 'open')
  const archived = tasks.filter((t) => t.status === 'done')

  return (
    <Panel title="Agency Tasks" subtitle="Internal to-dos for booking agents and ops. Completed work moves to Archive.">
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder='e.g. Send contract agreement to Nike production team'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || !title.trim()) return
              addTask({
                title: title.trim(),
                assignee: actor,
                due: new Date().toISOString().slice(0, 10),
                status: 'open',
                relatedClient: 'Nike',
              })
              setTitle('')
            }}
          />
          <Btn
            onClick={() => {
              if (!title.trim()) return
              addTask({
                title: title.trim(),
                assignee: actor,
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
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Open tasks</div>
        <Table
          headers={['Task', 'Assignee', 'Due', 'Status', '']}
          rows={openTasks.map((t) => [
            t.title,
            t.assignee,
            t.due,
            <Badge key={t.id} color={StatusColor(t.status)}>{t.status}</Badge>,
            <Btn key={`c-${t.id}`} variant="success" onClick={() => completeTask(t.id, actor)}>Complete</Btn>,
          ])}
        />
      </Card>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>Archive</div>
          <div style={{ fontSize: 11, color: T.t3 }}>{archived.length} completed</div>
        </div>
        <Table
          headers={['Task', 'Assignee', 'Due', 'Completed by', 'Completed']}
          rows={archived.map((t) => [
            t.title,
            t.assignee,
            t.due,
            t.completedBy || '—',
            t.completedAt ? new Date(t.completedAt).toLocaleString() : '—',
          ])}
        />
      </Card>
    </Panel>
  )
}

function AppointmentsModule() {
  const { appointments, addAppointment, updateAppointment, deleteAppointment, clients, talent } =
    useAgencyData()
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = appointments.find((a) => a.id === selectedId) || null
  const clientOptions = clients.map((c) => c.name)
  const talentOptions = talent.map((t) => t.name)

  return (
    <Panel
      title="Appointments & Meetings"
      subtitle="Briefings, castings, and client calls. Add, edit, or delete appointments with full scheduling details."
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ New appointment</Btn>}
    >
      <Card>
        <Table
          headers={['Title', 'Clients', 'Agents', 'Talent', 'Starts', 'Ends', 'Location', '']}
          rows={appointments.map((a) => [
            a.title,
            (a.clientNames?.length ? a.clientNames : [a.withWhom]).filter(Boolean).join(', ') || '—',
            a.agentNames?.length ? a.agentNames.join(', ') : '—',
            a.talentNames?.length
              ? (
                <span key={`tn-${a.id}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {a.talentNames.map((n) => (
                    <TalentLink key={`${a.id}-${n}`} name={n} />
                  ))}
                </span>
              )
              : '—',
            new Date(a.startsAt).toLocaleString(),
            new Date(a.endsAt).toLocaleString(),
            a.location,
            <Btn
              key={`e-${a.id}`}
              variant="secondary"
              onClick={() => {
                setSelectedId(a.id)
                setModalMode('edit')
              }}
            >
              Edit
            </Btn>,
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <AppointmentFormModal
          clientOptions={clientOptions}
          talentOptions={talentOptions}
          onClose={() => setModalMode(null)}
          onSave={(values) => {
            addAppointment(values)
            setModalMode(null)
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <AppointmentFormModal
          initial={selected}
          clientOptions={clientOptions}
          talentOptions={talentOptions}
          onClose={() => {
            setModalMode(null)
            setSelectedId(null)
          }}
          onSave={(values) => {
            updateAppointment(selected.id, values)
            setModalMode(null)
            setSelectedId(null)
          }}
          onDelete={() => {
            deleteAppointment(selected.id)
            setModalMode(null)
            setSelectedId(null)
          }}
        />
      )}
    </Panel>
  )
}

function NewTicketModule() {
  const { addTicket, clients } = useAgencyData()
  const { user } = useAuth()
  const nav = useNavigate()
  const isDirector = user?.role === 'director'
  const defaultAssignee = isDirector
    ? AGENCY_STAFF.name
    : user?.name || AGENCY_STAFF.name
  const defaultDue = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  const [subject, setSubject] = useState('Last-minute schedule change')
  const [body, setBody] = useState('')
  const [assignee, setAssignee] = useState(defaultAssignee)
  const [type, setType] = useState<TicketType>('scheduling')
  const [dueDate, setDueDate] = useState(defaultDue)
  const [priority, setPriority] = useState<SupportTicket['priority']>('high')

  return (
    <Panel title="New Tickets" subtitle="Quickly create a support record for an inbound client request.">
      <Card style={{ maxWidth: 520 }}>
        <Field label="Client">
          <input style={inputStyle} value={clients[0]?.name || 'Nike'} readOnly />
        </Field>
        <Field label="Subject">
          <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Type">
          <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value as TicketType)}>
            <option value="availability">availability</option>
            <option value="scheduling">scheduling</option>
            <option value="contract">contract</option>
            <option value="billing">billing</option>
            <option value="general">general</option>
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Due date">
            <input
              type="date"
              style={inputStyle}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          <Field label="Priority">
            <select
              style={inputStyle}
              value={priority}
              onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </Field>
        </div>
        <Field label="Details">
          <textarea style={{ ...inputStyle, minHeight: 100 }} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        {isDirector ? (
          <Field label="Assign to">
            <select style={inputStyle} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {AGENCY_TICKET_AGENTS.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} — {a.title}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Assignee">
            <input style={inputStyle} value={assignee} readOnly />
          </Field>
        )}
        <Btn
          onClick={() => {
            addTicket({
              subject,
              clientId: clients[0]?.id || 'client_nike',
              clientName: clients[0]?.name || 'Nike',
              talentName: 'Maya Rivera',
              status: 'open',
              type,
              priority,
              dueDate: dueDate || defaultDue,
              body: body || 'Client called with a last-minute schedule change.',
              assignee,
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
              e.talentName ? <TalentLink key={`tn-${e.id}`} name={e.talentName} /> : '—',
              e.clientName || '—',
              <Badge key={e.id} color={e.type === 'booking' ? T.purple : T.blue}>{e.type}</Badge>,
            ])}
        />
      </Card>
    </Panel>
  )
}

function InvoicesModule() {
  const { invoices, createInvoice, updateInvoice, deleteInvoice, clients, talent } = useAgencyData()
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewDoc, setViewDoc] = useState<UploadedDoc | null>(null)
  const selected = invoices.find((i) => i.id === selectedId) || null
  const talentNames = talent.map((t) => t.name)

  return (
    <Panel
      title="Client Invoices"
      subtitle="Create and manage invoices with tax ID, tax calculation, payment terms, and supporting documents."
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ New invoice</Btn>}
    >
      <Card>
        <Table
          headers={['Invoice #', 'Client', 'Tax ID', 'Talent', 'Project', 'Subtotal', 'Tax', 'Total', 'Due', 'Doc', 'Status', '']}
          rows={invoices.map((inv) => [
            inv.invoiceNumber || inv.id,
            inv.clientName,
            inv.taxId || '—',
            <TalentLink key={`tn-${inv.id}`} name={inv.talentName} />,
            inv.project,
            <Money key={`m-${inv.id}`} value={inv.amount} />,
            <span key={`tx-${inv.id}`}>
              <Money value={inv.taxAmount || 0} />
              {inv.taxRatePct ? (
                <span style={{ color: T.t4, fontSize: 10, marginLeft: 4 }}>({inv.taxRatePct}%)</span>
              ) : null}
            </span>,
            <Money key={`tot-${inv.id}`} value={invoiceTotal(inv)} />,
            inv.dueAt,
            inv.document ? (
              <Btn
                key={`d-${inv.id}`}
                variant="ghost"
                onClick={() =>
                  setViewDoc({
                    name: inv.document!.name,
                    data: inv.document!.data,
                    type: inv.document!.type,
                  })
                }
              >
                View
              </Btn>
            ) : (
              '—'
            ),
            <Badge key={`s-${inv.id}`} color={StatusColor(inv.status)}>{inv.status}</Badge>,
            <Btn
              key={`e-${inv.id}`}
              variant="secondary"
              onClick={() => {
                setSelectedId(inv.id)
                setModalMode('edit')
              }}
            >
              Edit
            </Btn>,
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <InvoiceFormModal
          clients={clients}
          talentNames={talentNames}
          onClose={() => setModalMode(null)}
          onSave={(values) => {
            createInvoice(values)
            setModalMode(null)
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <InvoiceFormModal
          initial={selected}
          clients={clients}
          talentNames={talentNames}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values) => {
            updateInvoice(selected.id, values)
            setModalMode(null)
            setSelectedId(null)
          }}
          onDelete={() => {
            deleteInvoice(selected.id)
            setModalMode(null)
            setSelectedId(null)
          }}
        />
      )}
      <DocViewer doc={viewDoc} onClose={() => setViewDoc(null)} />
    </Panel>
  )
}

function OverdueInterestModule() {
  const { invoices, applyOverdueInterest, updateInvoice, deleteInvoice, clients, talent } = useAgencyData()
  const candidates = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = invoices.find((i) => i.id === selectedId) || null
  const talentNames = talent.map((t) => t.name)

  return (
    <Panel title="Post Overdue Interest" subtitle="Add late-fee penalties when 30-day terms are exceeded. Edit or delete invoices as needed.">
      <Card>
        <Table
          headers={['Client', 'Project', 'Amount', 'Interest applied', '', '']}
          rows={candidates.map((inv) => [
            inv.clientName,
            inv.project,
            <Money key={`a-${inv.id}`} value={inv.amount} />,
            <Money key={`i-${inv.id}`} value={inv.interestApplied} />,
            <Btn key={`b-${inv.id}`} variant="danger" onClick={() => applyOverdueInterest(inv.id, 1.5)}>
              Post 1.5% interest
            </Btn>,
            <Btn key={`e-${inv.id}`} variant="secondary" onClick={() => setSelectedId(inv.id)}>
              Edit
            </Btn>,
          ])}
        />
      </Card>
      {selected && (
        <InvoiceFormModal
          initial={selected}
          clients={clients}
          talentNames={talentNames}
          onClose={() => setSelectedId(null)}
          onSave={(values) => {
            updateInvoice(selected.id, values)
            setSelectedId(null)
          }}
          onDelete={() => {
            deleteInvoice(selected.id)
            setSelectedId(null)
          }}
        />
      )}
    </Panel>
  )
}

function BatchReceiptsModule() {
  const { invoices, batchReceipts, updateInvoice, deleteInvoice, clients, talent } = useAgencyData()
  const [selected, setSelected] = useState<string[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const open = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue' || i.status === 'partial')
  const editing = invoices.find((i) => i.id === editId) || null
  const talentNames = talent.map((t) => t.name)

  return (
    <Panel title="Batch Client Receipts" subtitle="Apply one client payment across multiple open invoices. Edit or delete individual invoices from this list.">
      <Card>
        <Table
          headers={['', 'Client', 'Project', 'Amount', 'Status', '']}
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
            <Btn key={`e-${inv.id}`} variant="secondary" onClick={() => setEditId(inv.id)}>
              Edit
            </Btn>,
          ])}
        />
        <div style={{ marginTop: 12 }}>
          <Btn
            variant="success"
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
      {editing && (
        <InvoiceFormModal
          initial={editing}
          clients={clients}
          talentNames={talentNames}
          onClose={() => setEditId(null)}
          onSave={(values) => {
            updateInvoice(editing.id, values)
            setEditId(null)
          }}
          onDelete={() => {
            deleteInvoice(editing.id)
            setEditId(null)
          }}
        />
      )}
    </Panel>
  )
}

function RetainerPlansModule() {
  const { retainers, addRetainer, updateRetainer, deleteRetainer, clients } = useAgencyData()
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = retainers.find((r) => r.id === selectedId) || null

  return (
    <Panel
      title="Manage Retainer Plans"
      subtitle="Set up, edit, and remove ongoing monthly client retainer contracts."
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ New retainer</Btn>}
    >
      <Card>
        <Table
          headers={['Client', 'Monthly', 'Bill day', 'Active', 'Description', '']}
          rows={retainers.map((r) => [
            r.clientName,
            <Money key={`m-${r.id}`} value={r.monthlyAmount} />,
            String(r.dayOfMonth),
            r.active ? 'Yes' : 'No',
            r.description,
            <Btn
              key={`e-${r.id}`}
              variant="secondary"
              onClick={() => {
                setSelectedId(r.id)
                setModalMode('edit')
              }}
            >
              Edit
            </Btn>,
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <RetainerFormModal
          clients={clients}
          onClose={() => setModalMode(null)}
          onSave={(values) => {
            addRetainer(values)
            setModalMode(null)
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <RetainerFormModal
          initial={selected}
          clients={clients}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values) => {
            updateRetainer(selected.id, values)
            setModalMode(null)
            setSelectedId(null)
          }}
          onDelete={() => {
            deleteRetainer(selected.id)
            setModalMode(null)
            setSelectedId(null)
          }}
        />
      )}
    </Panel>
  )
}

function PostRetainersModule() {
  const { retainers, postRetainers, updateRetainer, deleteRetainer, clients } = useAgencyData()
  const [note, setNote] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const editing = retainers.find((r) => r.id === editId) || null

  return (
    <Panel title="Post Recurring Retainers" subtitle="Auto-bill active retainer plans. Manage plans below before posting.">
      <Card style={{ marginBottom: 12 }}>
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
      <Card>
        <Table
          headers={['Client', 'Monthly', 'Active', 'Description', '']}
          rows={retainers.map((r) => [
            r.clientName,
            <Money key={`m-${r.id}`} value={r.monthlyAmount} />,
            r.active ? 'Yes' : 'No',
            r.description,
            <Btn key={`e-${r.id}`} variant="secondary" onClick={() => setEditId(r.id)}>
              Edit
            </Btn>,
          ])}
        />
      </Card>
      {editing && (
        <RetainerFormModal
          initial={editing}
          clients={clients}
          onClose={() => setEditId(null)}
          onSave={(values) => {
            updateRetainer(editing.id, values)
            setEditId(null)
          }}
          onDelete={() => {
            deleteRetainer(editing.id)
            setEditId(null)
          }}
        />
      )}
    </Panel>
  )
}

function EscrowModule() {
  const { escrow, recordEscrow, updateEscrow, deleteEscrow, clients } = useAgencyData()
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = escrow.find((e) => e.id === selectedId) || null
  const clientNames = clients.map((c) => c.name)

  return (
    <Panel
      title="Record Escrow / Deposit"
      subtitle="Log, edit, and delete client wire payments in the agency holding account."
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ Record deposit</Btn>}
    >
      <Card>
        <Table
          headers={['Client', 'Project', 'Amount', 'Received', 'Status', 'Notes', '']}
          rows={escrow.map((e) => [
            e.clientName,
            e.project,
            <Money key={`m-${e.id}`} value={e.amount} />,
            e.receivedAt,
            <Badge key={`s-${e.id}`} color={StatusColor(e.status)}>{e.status}</Badge>,
            e.notes,
            <Btn
              key={`ed-${e.id}`}
              variant="secondary"
              onClick={() => {
                setSelectedId(e.id)
                setModalMode('edit')
              }}
            >
              Edit
            </Btn>,
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <EscrowFormModal
          clientNames={clientNames}
          onClose={() => setModalMode(null)}
          onSave={(values) => {
            recordEscrow(values)
            setModalMode(null)
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <EscrowFormModal
          initial={selected}
          clientNames={clientNames}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values) => {
            updateEscrow(selected.id, values)
            setModalMode(null)
            setSelectedId(null)
          }}
          onDelete={() => {
            deleteEscrow(selected.id)
            setModalMode(null)
            setSelectedId(null)
          }}
        />
      )}
    </Panel>
  )
}

function LogExpenseModule() {
  const {
    expenseLogs,
    addExpenseLog,
    updateExpenseLog,
    deleteExpenseLog,
    clients,
    talent,
  } = useAgencyData()
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = expenseLogs.find((e) => e.id === selectedId) || null
  const clientNames = clients.map((c) => c.name)
  const talentNames = talent.map((t) => t.name)

  return (
    <Panel
      title="Log Expense / Payout"
      subtitle="Split gross job proceeds into agency commission and talent payout. Add, edit, or delete logs."
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ Log expense</Btn>}
    >
      <Card>
        <Table
          headers={['Project', 'Client', 'Talent', 'Gross', 'Agency', 'Talent share', 'Status', '']}
          rows={expenseLogs.map((e) => [
            e.project,
            e.clientName,
            <TalentLink key={`tn-${e.id}`} name={e.talentName} />,
            <Money key={`g-${e.id}`} value={e.gross} />,
            <Money key={`a-${e.id}`} value={e.agencyCommission} />,
            <Money key={`t-${e.id}`} value={e.talentShare} />,
            <Badge key={`s-${e.id}`} color={StatusColor(e.status)}>{e.status}</Badge>,
            <Btn
              key={`ed-${e.id}`}
              variant="secondary"
              onClick={() => {
                setSelectedId(e.id)
                setModalMode('edit')
              }}
            >
              Edit
            </Btn>,
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <ExpenseFormModal
          clientNames={clientNames}
          talentNames={talentNames}
          onClose={() => setModalMode(null)}
          onSave={(values) => {
            addExpenseLog(values)
            setModalMode(null)
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <ExpenseFormModal
          initial={selected}
          clientNames={clientNames}
          talentNames={talentNames}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values) => {
            updateExpenseLog(selected.id, values)
            setModalMode(null)
            setSelectedId(null)
          }}
          onDelete={() => {
            deleteExpenseLog(selected.id)
            setModalMode(null)
            setSelectedId(null)
          }}
        />
      )}
    </Panel>
  )
}

function VendorsModule() {
  const { vendors, addVendor, updateVendor, deleteVendor } = useAgencyData()
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = vendors.find((v) => v.id === selectedId) || null

  return (
    <Panel
      title="Vendors & Service Providers"
      subtitle="Directory of talent banking details and service vendors. Add, edit, or delete entries."
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ New vendor</Btn>}
    >
      <Card>
        <Table
          headers={['Name', 'Type', 'Bank last 4', 'Tax forms', 'Email', '']}
          rows={vendors.map((v) => [
            v.type === 'talent' ? <TalentLink key={v.id} name={v.name} /> : v.name,
            v.type,
            `•••• ${v.bankLast4}`,
            v.taxFormsReady ? <Badge color={T.green}>Ready</Badge> : <Badge color={T.red}>Missing</Badge>,
            v.email,
            <Btn
              key={`e-${v.id}`}
              variant="secondary"
              onClick={() => {
                setSelectedId(v.id)
                setModalMode('edit')
              }}
            >
              Edit
            </Btn>,
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <VendorFormModal
          onClose={() => setModalMode(null)}
          onSave={(values) => {
            addVendor(values)
            setModalMode(null)
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <VendorFormModal
          initial={selected}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values) => {
            updateVendor(selected.id, values)
            setModalMode(null)
            setSelectedId(null)
          }}
          onDelete={() => {
            deleteVendor(selected.id)
            setModalMode(null)
            setSelectedId(null)
          }}
        />
      )}
    </Panel>
  )
}

function DisbursementsModule() {
  const { disbursements, addDisbursement, updateDisbursement, deleteDisbursement, talent, vendors } =
    useAgencyData()
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = disbursements.find((d) => d.id === selectedId) || null
  const payeeOptions = [...new Set([...talent.map((t) => t.name), ...vendors.map((v) => v.name)])]

  return (
    <Panel
      title="Disbursements / Payouts"
      subtitle="Master log of talent and vendor payments. Add, edit, or delete disbursements."
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ New disbursement</Btn>}
    >
      <Card>
        <Table
          headers={['Payee', 'Amount', 'Method', 'Project', 'Status', 'Paid at', '']}
          rows={disbursements.map((d) => [
            <TalentLink key={`p-${d.id}`} name={d.payee} />,
            <Money key={`m-${d.id}`} value={d.amount} />,
            d.method,
            d.project,
            <Badge key={`s-${d.id}`} color={StatusColor(d.status)}>{d.status}</Badge>,
            d.paidAt ? new Date(d.paidAt).toLocaleString() : '—',
            <Btn
              key={`e-${d.id}`}
              variant="secondary"
              onClick={() => {
                setSelectedId(d.id)
                setModalMode('edit')
              }}
            >
              Edit
            </Btn>,
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <DisbursementFormModal
          payeeOptions={payeeOptions}
          onClose={() => setModalMode(null)}
          onSave={(values) => {
            addDisbursement(values)
            setModalMode(null)
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <DisbursementFormModal
          initial={selected}
          payeeOptions={payeeOptions}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values) => {
            updateDisbursement(selected.id, values)
            setModalMode(null)
            setSelectedId(null)
          }}
          onDelete={() => {
            deleteDisbursement(selected.id)
            setModalMode(null)
            setSelectedId(null)
          }}
        />
      )}
    </Panel>
  )
}

function IssuePayoutsModule() {
  const {
    expenseLogs,
    issuePayout,
    updateExpenseLog,
    deleteExpenseLog,
    clients,
    talent,
  } = useAgencyData()
  const pending = expenseLogs.filter((e) => e.status === 'pending')
  const [editId, setEditId] = useState<string | null>(null)
  const editing = expenseLogs.find((e) => e.id === editId) || null
  const clientNames = clients.map((c) => c.name)
  const talentNames = talent.map((t) => t.name)

  return (
    <Panel title="Issue Talent Payouts" subtitle="Execute payday deposits for pending talent shares. Edit or delete pending logs before payout.">
      <Card>
        <Table
          headers={['Talent', 'Project', 'Amount', '', '']}
          rows={pending.map((e) => [
            <TalentLink key={`tn-${e.id}`} name={e.talentName} />,
            e.project,
            <Money key={`m-${e.id}`} value={e.talentShare} />,
            <Btn key={`b-${e.id}`} variant="success" onClick={() => issuePayout(e.id)}>
              Execute payout
            </Btn>,
            <Btn key={`ed-${e.id}`} variant="secondary" onClick={() => setEditId(e.id)}>
              Edit
            </Btn>,
          ])}
        />
        {pending.length === 0 && (
          <div style={{ padding: 16, color: T.t3, fontSize: 13 }}>
            No pending payouts. Log an expense split first, then return here on payday.
          </div>
        )}
      </Card>
      {editing && (
        <ExpenseFormModal
          initial={editing}
          clientNames={clientNames}
          talentNames={talentNames}
          onClose={() => setEditId(null)}
          onSave={(values) => {
            updateExpenseLog(editing.id, values)
            setEditId(null)
          }}
          onDelete={() => {
            deleteExpenseLog(editing.id)
            setEditId(null)
          }}
        />
      )}
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
            <TalentLink key={t.id} accountId={t.accountId} name={t.name} />,
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
          headers={['Account ID', 'Name', 'Stage', 'Work Area', 'Source', 'Notes']}
          rows={prospects.map((p) => [
            <TalentLink key={`id-${p.id}`} accountId={p.accountId} name={p.name}>{p.accountId}</TalentLink>,
            <TalentLink key={`n-${p.id}`} accountId={p.accountId} name={p.name} />,
            p.stage,
            p.workArea,
            p.source,
            p.notes,
          ])}
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
              .map((p) => [<TalentLink key={p.id} accountId={p.accountId} name={p.name} />, 'Onboarding prospect', p.stage]),
            ...talent
              .filter((t) => t.status === 'offboarding')
              .map((t) => [<TalentLink key={t.id} accountId={t.accountId} name={t.name} />, 'Offboarding', t.status]),
            ...talent
              .filter((t) => t.status === 'active')
              .slice(0, 1)
              .map((t) => [<TalentLink key={`rs-${t.id}`} accountId={t.accountId} name={t.name} />, 'Recently signed', 'active']),
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
            <TalentLink key={t.id} accountId={t.accountId} name={t.name} />,
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
            <TalentLink key={e.id} name={e.talentName} />,
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
