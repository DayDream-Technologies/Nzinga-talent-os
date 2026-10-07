import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { useViewport } from '@/hooks/useViewport'
import { staffGridColumns } from '@/lib/viewport'
import { AGENCY_STAFF, AGENCY_TICKET_AGENTS } from '@/constants/agency-seed'
import { USERS } from '@/constants'
import { filterAgencyNav, canAccessAgencyPath, type AgencyNavGroup } from '@/constants/agency-nav'
import { T } from '@/lib/tokens'
import type { SupportTicket, TicketType } from '@/types/agency'
import { TalentLink } from '@/components/talent/TalentLink'
import { TicketDetailModal } from '@/components/agency/TicketDetailModal'
import { AppointmentFormModal } from '@/components/agency/AppointmentFormModal'
import { AnnouncementFooterLink, AnnouncementsModule } from '@/components/agency/AnnouncementsModule'
import { WorkspaceCommandWidgets } from '@/components/agency/WorkspaceCommandWidgets'
import { ProspectsCrmModule } from '@/components/agency/ProspectsCrmModule'
import { ClientsModule } from '@/components/agency/ClientsModule'
import { ProspectTrackingBoard } from '@/components/agency/ProspectTrackingBoard'
import { MessagingCenterModule } from '@/components/agency/MessagingCenterModule'
import { IssuesDashboardModule } from '@/components/agency/IssuesDashboard'
import { AgencyTasksBoard } from '@/components/agency/AgencyTasksBoard'
import { InteractiveCalendarModule } from '@/components/agency/InteractiveCalendar'
import { RenewalOffersHub } from '@/components/agency/RenewalOffersHub'
import { UnifiedEmailModule } from '@/components/agency/UnifiedEmailModule'
import { BrandsDirectoryModule } from '@/components/agency/BrandsDirectory'
import { ReconciliationModule } from '@/components/agency/ReconciliationModule'
import { PayoutApprovalsModule } from '@/components/agency/PayoutApprovalsModule'
import { wrapReport } from '@/components/agency/ReportWrappers'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { isChaseConnected } from '@/lib/integrations'
import {
  DisbursementFormModal,
  EscrowFormModal,
  ExpenseFormModal,
  InvoiceFormModal,
  RetainerFormModal,
  VendorFormModal,
  ApprovePayoutModal,
  invoiceTotal,
  payoutStatusLabel,
} from '@/components/agency/FinanceFormModals'
import { DocViewer } from '@/components/ui/DocViewer'
import type { UploadedDoc } from '@/types'
import { splitGross } from '@/lib/commission'
import { formatCallTime } from '@/lib/talent-portal'
import {
  Badge,
  Btn,
  Card,
  Field,
  Money,
  Panel,
  StatusColor,
  SelectAllCheckbox,
  Table,
  TicketTypeColor,
  inputStyle,
} from './AgencyUI'

const WS = {
  pageBg: T.pageBg,
  pagePattern:
    'radial-gradient(circle at 15% 85%, rgba(59,130,246,0.06) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(0,45,86,0.04) 0%, transparent 40%)',
  cardBorder: T.cardBorder,
  headerBorder: T.cardBorder,
  accent: T.blue,
  iconBgs: [T.blueL, T.blueL, T.blueL, T.blue, T.purpleL, T.cyanL],
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
    background: T.cardBg,
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
        background: T.cardBg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: T.t1 }}>{group.label}</span>
      </div>
      {group.items.map((item) => (
        <div
          key={item.id}
          onClick={() => onNav(item.path)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNav(item.path)}
          style={{
            fontSize: 13,
            color: WS.accent,
            cursor: 'pointer',
            padding: '4px 0',
            paddingLeft: 40,
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
  const band = useViewport()
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
        padding: band === 'mobile' ? '14px 12px' : '22px 26px',
        flex: 1,
        overflowY: 'auto',
        minHeight: '100%',
        background: WS.pageBg,
        backgroundImage: WS.pagePattern,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            fontSize: band === 'mobile' ? 26 : 36,
            fontWeight: 700,
            color: T.t1,
            fontFamily: "'Syne', sans-serif",
          }}
        >
          Welcome, {firstName}
        </div>
        <div style={{ fontSize: 16, color: T.t3, marginTop: 8 }}>Let&apos;s get to work.</div>
      </div>
      <WorkspaceCommandWidgets />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: staffGridColumns(band, favoriteGroups.length && reportGroups.length ? '1fr 1fr' : '1fr'),
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
                padding: '14px 16px',
                background: T.cardBg,
                borderBottom: `2px solid ${WS.accent}`,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: T.t1 }}>My Favorites</span>
            </div>
            <div
              style={{
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: staffGridColumns(band, '1fr 1fr'),
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
                padding: '14px 16px',
                background: T.cardBg,
                borderBottom: `2px solid ${WS.accent}`,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: T.t1 }}>My Reports</span>
              <span
                onClick={() => go('reports')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && go('reports')}
                style={{ fontSize: 13, color: WS.accent, cursor: 'pointer' }}
              >
                View all
              </span>
            </div>
            <div
              style={{
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: staffGridColumns(band, '1fr 1fr'),
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
        <AnnouncementFooterLink accent={WS.accent} onAcademy={() => go('university')} />
      </div>
    </div>
  )
}

export function AgencyModule({ moduleId }: { moduleId: string }) {
  switch (moduleId) {
    case 'announcements':
      return <AnnouncementsModule />
    case 'prospects':
      return <ProspectsCrmModule />
    case 'renewal-offers':
      return <RenewalOffersHub />
    case 'clients':
    case 'active-roster':
      return <ClientsModule />
    case 'prospect-tracking':
      return <ProspectTrackingBoard />
    case 'send-email':
      return <UnifiedEmailModule />
    case 'messaging':
      return <MessagingCenterModule />
    case 'support-tickets':
      return <IssuesDashboardModule />
    case 'agency-tasks':
      return <AgencyTasksBoard />
    case 'appointments':
      return <AppointmentsModule />
    case 'new-ticket':
      return <IssuesDashboardModule />
    case 'calendar':
      return <InteractiveCalendarModule />
    case 'brands':
      return <BrandsDirectoryModule />
    case 'reconciliation':
      return <ReconciliationModule />
    case 'payout-approvals':
      return <PayoutApprovalsModule />
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
      return wrapReport(<ReportRosterScorecard />, 'Roster Performance Scorecard', 'Active bookings and revenue across the roster.')
    case 'report-applicant-pool':
      return wrapReport(<ReportApplicantPool />, 'Applicant Pool & Pipeline Log', 'How many applicants are waiting for agent screenings.')
    case 'report-escrow-balances':
      return wrapReport(<ReportEscrow />, 'Escrow & Deposit Balances', 'Funds held vs cleared.')
    case 'report-onboarding':
      return wrapReport(<ReportOnboarding />, 'Onboarding & Offboarding', 'Activations and pending signatures.')
    case 'report-roster-openings':
      return wrapReport(<ReportOpenings />, 'Roster Openings & Availability', 'Capacity by division.')
    case 'report-gross-bookings':
      return wrapReport(<ReportGrossBookings />, 'Gross Bookings & Commission Summary', '20/80 agency vs talent split.')
    case 'report-ar-aging':
      return wrapReport(<ReportArAging />, 'Aged Client Invoices (AR Aging)', 'Open receivables by due date.')
    case 'report-overdue-accounts':
      return wrapReport(<ReportOverdue />, 'Overdue Client Accounts', 'Accounts past payment terms.')
    case 'report-pending-payouts':
      return wrapReport(<ReportPendingPayouts />, 'Pending Talent Payouts (AP Aging)', 'Queued talent payables.')
    default:
      return (
        <Panel title="Not found" subtitle="This agency module is not registered.">
          <Btn variant="secondary" onClick={() => window.history.back()}>Go back</Btn>
        </Panel>
      )
  }
}

function RenewalOffersModule() {
  const { talent, createRenewalOffer } = useAgencyData()
  const [msg, setMsg] = useState('')
  return (
    <Panel title="Create Renewal Offers">
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

function SendEmailModule() {
  const { sendMessage, messages, clients } = useAgencyData()
  const { setHistory } = useAppData()
  const { user } = useAuth()
  const [to, setTo] = useState(clients[0]?.email || '')
  const [toName, setToName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [fromName, setFromName] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'ok' | 'err' | 'skip'; msg: string } | null>(null)

  useEffect(() => {
    if (!user) return
    setReplyTo((prev) => prev || user.email)
    setFromName((prev) => prev || user.name)
  }, [user])

  async function handleSend() {
    if (!to || !subject || !body) return
    setSending(true)
    setResult(null)
    const resolvedReplyTo = replyTo || user?.email
    const resolvedFromName = fromName || user?.name
    try {
      const { sendGeneralEmail } = await import('@/lib/email')
      const res = await sendGeneralEmail({
        toEmail: to,
        toName: toName || undefined,
        subject,
        htmlBody: body.replace(/\n/g, '<br>'),
        textBody: body,
        replyTo: resolvedReplyTo || undefined,
        fromName: resolvedFromName || undefined,
      })
      if (res.status === 'sent' || res.status === 'skipped') {
        sendMessage({ channel: 'email', to, subject, preview: body.slice(0, 80) })
        setHistory((prev) => [
          {
            id: `h_${Date.now()}`,
            talent_id: null,
            user_id: user?.id || null,
            type: 'email',
            text: body,
            ts: new Date().toISOString(),
            flagged: false,
            is_document: false,
            email_subject: subject,
            email_to: to,
            staff_name: user?.name,
          },
          ...prev,
        ])
        setResult(
          res.status === 'sent'
            ? { type: 'ok', msg: 'Email sent successfully.' }
            : { type: 'skip', msg: 'Email service not configured — message logged locally.' },
        )
        setSubject('')
        setBody('')
        setToName('')
      } else {
        setResult({ type: 'err', msg: res.message || 'Failed to send.' })
      }
    } catch (err) {
      setResult({ type: 'err', msg: (err as Error).message || 'Unexpected error.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Panel title="Send Email">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <Field label="To (email)">
            <input style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@email.com" type="email" />
          </Field>
          <Field label="Recipient name (optional)">
            <input style={inputStyle} value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Jane Doe" />
          </Field>
          <Field label="Subject">
            <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Message">
            <textarea style={{ ...inputStyle, minHeight: 120 }} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            <Field label="Reply-To">
              <input style={inputStyle} value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder={user?.email || 'your@email.com'} type="email" />
            </Field>
            <Field label="Sender display name">
              <input style={inputStyle} value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder={user?.name || 'Your name'} />
            </Field>
          </div>
          <Btn onClick={handleSend} disabled={sending || !to || !subject || !body}>
            {sending ? '⟳ Sending…' : 'Send email'}
          </Btn>
          {result?.type === 'ok' && <div style={{ marginTop: 8, color: T.green, fontSize: 12, fontWeight: 600 }}>✓ {result.msg}</div>}
          {result?.type === 'skip' && <div style={{ marginTop: 8, color: T.amber, fontSize: 12 }}>{result.msg}</div>}
          {result?.type === 'err' && <div style={{ marginTop: 8, color: T.red, fontSize: 12 }}>{result.msg}</div>}
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
  const { setHistory } = useAppData()
  const { user } = useAuth()
  const [to, setTo] = useState('')
  const [preview, setPreview] = useState('')
  return (
    <Panel title="Text Messaging Center">
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
              setHistory((prev) => [
                {
                  id: `h_${Date.now()}`,
                  talent_id: null,
                  user_id: user?.id || null,
                  type: 'sms',
                  text: preview,
                  ts: new Date().toISOString(),
                  flagged: false,
                  is_document: false,
                  email_to: to,
                  staff_name: user?.name,
                },
                ...prev,
              ])
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
    <Panel title="Agency Tasks">
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
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ New appointment</Btn>}
    >
      <Card>
        <Table
          headers={['Title', 'Clients', 'Agents', 'Talent', 'Starts', 'Ends', 'Location']}
          onRowClick={(i) => {
            const row = appointments[i]
            if (!row) return
            setSelectedId(row.id)
            setModalMode('edit')
          }}
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
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <AppointmentFormModal
          clientOptions={clientOptions}
          talentOptions={talentOptions}
          onClose={() => setModalMode(null)}
          onSave={(values, action) => {
            addAppointment(values)
            if (action !== 'new') {
              setModalMode(null)
            }
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
          onSave={(values, action) => {
            updateAppointment(selected.id, values)
            if (action !== 'new') {
              setModalMode(null)
              setSelectedId(null)
            }
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
    <Panel title="New Tickets">
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
          headers={['Date', 'Title', 'Talent', 'Client', 'Type', 'Call time']}
          rows={[...calendar]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((e) => [
              e.date,
              e.title,
              e.talentName ? <TalentLink key={`tn-${e.id}`} name={e.talentName} /> : '—',
              e.clientName || '—',
              <Badge key={e.id} color={e.type === 'booking' ? T.purple : T.blue}>{e.type}</Badge>,
              e.callTime
                ? `${formatCallTime(e.callTime)}${e.talentCallResponse && e.talentCallResponse !== 'pending' ? ` · ${e.talentCallResponse}` : ''}`
                : '—',
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
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ New invoice</Btn>}
    >
      <Card>
        <Table
          onRowClick={(index) => {
            const inv = invoices[index]
            if (!inv) return
            setSelectedId(inv.id)
            setModalMode('edit')
          }}
          headers={['Invoice #', 'Client', 'Tax ID', 'Talent', 'Project', 'Subtotal', 'Tax', 'Total', 'Due', 'Doc', 'Status']}
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
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <InvoiceFormModal
          clients={clients}
          talentNames={talentNames}
          onClose={() => setModalMode(null)}
          onSave={(values, action) => {
            createInvoice(values)
            if (action !== 'new') {
              setModalMode(null)
            }
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <InvoiceFormModal
          initial={selected}
          clients={clients}
          talentNames={talentNames}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values, action) => {
            updateInvoice(selected.id, values)
            if (action !== 'new') {
              setModalMode(null)
              setSelectedId(null)
            }
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
    <Panel title="Post Overdue Interest">
      <Card>
        <Table
          onRowClick={(index) => {
            const inv = candidates[index]
            if (inv) setSelectedId(inv.id)
          }}
          headers={['Client', 'Project', 'Amount', 'Interest applied', '']}
          rows={candidates.map((inv) => [
            inv.clientName,
            inv.project,
            <Money key={`a-${inv.id}`} value={inv.amount} />,
            <Money key={`i-${inv.id}`} value={inv.interestApplied} />,
            <Btn key={`b-${inv.id}`} variant="danger" onClick={(e) => { e.stopPropagation(); applyOverdueInterest(inv.id, 1.5) }}>
              Post 1.5% interest
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
          onSave={(values, action) => {
            updateInvoice(selected.id, values)
            if (action !== 'new') {
              setSelectedId(null)
            }
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
  const { invoices, batchReceipts, updateInvoice, deleteInvoice, createInvoice, clients, talent } = useAgencyData()
  const [selected, setSelected] = useState<string[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const open = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue' || i.status === 'partial')
  const editing = invoices.find((i) => i.id === editId) || null
  const talentNames = talent.map((t) => t.name)

  return (
    <Panel
      title="Batch Client Receipts"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => setCreating(true)}>Add / Create Client Receipt</Btn>
          <Btn
            variant="success"
            disabled={selected.length === 0}
            onClick={() => {
              batchReceipts(selected)
              setSelected([])
            }}
          >
            Batch Client Receipts
          </Btn>
        </div>
      }
    >
      <Card>
        <Table
          onRowClick={(index) => {
            const inv = open[index]
            if (inv) setEditId(inv.id)
          }}
          selectAll={
            <SelectAllCheckbox
              checked={open.length > 0 && open.every((inv) => selected.includes(inv.id))}
              indeterminate={
                open.some((inv) => selected.includes(inv.id)) &&
                !open.every((inv) => selected.includes(inv.id))
              }
              disabled={open.length === 0}
              onChange={(checked) => setSelected(checked ? open.map((inv) => inv.id) : [])}
            />
          }
          rowSelected={open.map((inv) => selected.includes(inv.id))}
          headers={['', 'Client', 'Project', 'Amount', 'Status']}
          rows={open.map((inv) => [
            <input
              key={`c-${inv.id}`}
              type="checkbox"
              aria-label={`Select ${inv.clientName} invoice`}
              checked={selected.includes(inv.id)}
              onClick={(e) => e.stopPropagation()}
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
      </Card>
      {creating && (
        <InvoiceFormModal
          clients={clients}
          talentNames={talentNames}
          onClose={() => setCreating(false)}
          onSave={(values, action) => {
            createInvoice(values)
            if (action !== 'new') setCreating(false)
          }}
        />
      )}
      {editing && (
        <InvoiceFormModal
          initial={editing}
          clients={clients}
          talentNames={talentNames}
          onClose={() => setEditId(null)}
          onSave={(values, action) => {
            updateInvoice(editing.id, values)
            if (action !== 'new') {
              setEditId(null)
            }
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

function retainerMetrics(retainers: { active: boolean; monthlyAmount: number; dayOfMonth: number }[]) {
  const active = retainers.filter((plan) => plan.active)
  const posted = active.reduce((sum, plan) => sum + plan.monthlyAmount, 0)
  const today = new Date()
  const upcoming = active
    .map((plan) => {
      const date = new Date(today.getFullYear(), today.getMonth(), plan.dayOfMonth)
      if (date < today) date.setMonth(date.getMonth() + 1)
      return date
    })
    .sort((a, b) => a.getTime() - b.getTime())
  return {
    active: active.length,
    posted,
    nextPost: upcoming[0] ? upcoming[0].toLocaleDateString() : '—',
  }
}

function RetainerPlansModule() {
  const { retainers, addRetainer, updateRetainer, deleteRetainer, clients } = useAgencyData()
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = retainers.find((r) => r.id === selectedId) || null

  return (
    <Panel
      title="Manage Retainer Plans"
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ New retainer</Btn>}
    >
      <Card>
        <Table
          onRowClick={(index) => {
            const plan = retainers[index]
            if (!plan) return
            setSelectedId(plan.id)
            setModalMode('edit')
          }}
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
      {modalMode === 'create' && (
        <RetainerFormModal
          clients={clients}
          metrics={retainerMetrics(retainers)}
          onClose={() => setModalMode(null)}
          onSave={(values, action) => {
            addRetainer(values)
            if (action !== 'new') {
              setModalMode(null)
            }
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <RetainerFormModal
          initial={selected}
          clients={clients}
          metrics={retainerMetrics(retainers)}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values, action) => {
            updateRetainer(selected.id, values)
            if (action !== 'new') {
              setModalMode(null)
              setSelectedId(null)
            }
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
  const { retainers, postRetainers } = useAgencyData()
  const [note, setNote] = useState('')
  const brands = [...new Set(retainers.map((plan) => plan.clientName))].sort()

  return (
    <Panel title="Post Recurring Retainers">
      <Card style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: T.t2, marginBottom: 12 }}>
          Posted plans are view only. Active plans: <strong>{retainers.filter((r) => r.active).length}</strong>
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
      {brands.map((brand) => (
        <Card key={brand} style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{brand}</div>
          <Table
            headers={['Monthly', 'Active', 'Description']}
            rows={retainers.filter((plan) => plan.clientName === brand).map((r) => [
              <Money key={`m-${r.id}`} value={r.monthlyAmount} />,
              r.active ? 'Yes' : 'No',
              r.description,
            ])}
          />
        </Card>
      ))}
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
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ Record deposit</Btn>}
    >
      <Card>
        <Table
          onRowClick={(index) => {
            const row = escrow[index]
            if (!row) return
            setSelectedId(row.id)
            setModalMode('edit')
          }}
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
      {modalMode === 'create' && (
        <EscrowFormModal
          clientNames={clientNames}
          onClose={() => setModalMode(null)}
          onSave={(values, action) => {
            recordEscrow(values)
            if (action !== 'new') {
              setModalMode(null)
            }
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <EscrowFormModal
          initial={selected}
          clientNames={clientNames}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values, action) => {
            updateEscrow(selected.id, values)
            if (action !== 'new') {
              setModalMode(null)
              setSelectedId(null)
            }
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
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ Log expense</Btn>}
    >
      <Card>
        <Table
          onRowClick={(index) => {
            const row = expenseLogs[index]
            if (!row) return
            setSelectedId(row.id)
            setModalMode('edit')
          }}
          headers={['Project', 'Client', 'Talent', 'Gross', 'Agency', 'Talent share', 'Status']}
          rows={expenseLogs.map((e) => [
            e.project,
            e.clientName,
            <TalentLink key={`tn-${e.id}`} name={e.talentName} />,
            <Money key={`g-${e.id}`} value={e.gross} />,
            <Money key={`a-${e.id}`} value={e.agencyCommission} />,
            <Money key={`t-${e.id}`} value={e.talentShare} />,
            <Badge key={`s-${e.id}`} color={StatusColor(e.status)}>{payoutStatusLabel(e.status)}</Badge>,
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <ExpenseFormModal
          clientNames={clientNames}
          talentNames={talentNames}
          onClose={() => setModalMode(null)}
          onSave={(values, action) => {
            addExpenseLog(values)
            if (action !== 'new') {
              setModalMode(null)
            }
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <ExpenseFormModal
          initial={selected}
          clientNames={clientNames}
          talentNames={talentNames}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values, action) => {
            updateExpenseLog(selected.id, values)
            if (action !== 'new') {
              setModalMode(null)
              setSelectedId(null)
            }
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
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ New vendor</Btn>}
    >
      <Card>
        <Table
          onRowClick={(index) => {
            const row = vendors[index]
            if (!row) return
            setSelectedId(row.id)
            setModalMode('edit')
          }}
          headers={['Name', 'Type', 'Bank last 4', 'Tax forms', 'Email']}
          rows={vendors.map((v) => [
            v.type === 'talent' ? <TalentLink key={v.id} name={v.name} /> : v.name,
            v.type,
            `•••• ${v.bankLast4}`,
            v.taxFormsReady ? <Badge color={T.green}>Ready</Badge> : <Badge color={T.red}>Missing</Badge>,
            v.email,
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <VendorFormModal
          onClose={() => setModalMode(null)}
          onSave={(values, action) => {
            addVendor(values)
            if (action !== 'new') {
              setModalMode(null)
            }
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <VendorFormModal
          initial={selected}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values, action) => {
            updateVendor(selected.id, values)
            if (action !== 'new') {
              setModalMode(null)
              setSelectedId(null)
            }
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
      actions={<Btn onClick={() => { setSelectedId(null); setModalMode('create') }}>+ New disbursement</Btn>}
    >
      <Card>
        <Table
          onRowClick={(index) => {
            const row = disbursements[index]
            if (!row) return
            setSelectedId(row.id)
            setModalMode('edit')
          }}
          headers={['Payee', 'Amount', 'Method', 'Project', 'Status', 'Paid at']}
          rows={disbursements.map((d) => [
            <TalentLink key={`p-${d.id}`} name={d.payee} />,
            <Money key={`m-${d.id}`} value={d.amount} />,
            d.method,
            d.project,
            <Badge key={`s-${d.id}`} color={StatusColor(d.status)}>{payoutStatusLabel(d.status)}</Badge>,
            d.paidAt ? new Date(d.paidAt).toLocaleString() : '—',
          ])}
        />
      </Card>
      {modalMode === 'create' && (
        <DisbursementFormModal
          payeeOptions={payeeOptions}
          onClose={() => setModalMode(null)}
          onSave={(values, action) => {
            addDisbursement(values)
            if (action !== 'new') {
              setModalMode(null)
            }
          }}
        />
      )}
      {modalMode === 'edit' && selected && (
        <DisbursementFormModal
          initial={selected}
          payeeOptions={payeeOptions}
          onClose={() => { setModalMode(null); setSelectedId(null) }}
          onSave={(values, action) => {
            updateDisbursement(selected.id, values)
            if (action !== 'new') {
              setModalMode(null)
              setSelectedId(null)
            }
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
  const chaseReady = isChaseConnected()

  return (
    <Panel title="Issue Talent Payouts">
      {!chaseReady && <IntegrationNotice id="chase" />}
      <Card>
        <Table
          onRowClick={(index) => {
            const row = pending[index]
            if (row) setEditId(row.id)
          }}
          headers={['Talent', 'Project', 'Amount', '']}
          rows={pending.map((e) => [
            <TalentLink key={`tn-${e.id}`} name={e.talentName} />,
            e.project,
            <Money key={`m-${e.id}`} value={e.talentShare} />,
            <Btn key={`b-${e.id}`} variant="success" disabled={!chaseReady} onClick={(event) => { event.stopPropagation(); issuePayout(e.id) }}>
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
      {editing && (
        <ExpenseFormModal
          initial={editing}
          clientNames={clientNames}
          talentNames={talentNames}
          onClose={() => setEditId(null)}
          onSave={(values, action) => {
            updateExpenseLog(editing.id, values)
            if (action !== 'new') {
              setEditId(null)
            }
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
    <Panel title="Roster Performance Scorecard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        <Card><div style={{ fontSize: 22, fontWeight: 800 }}>{talent.filter((t) => t.status === 'active' || t.status === 'current').length}</div><div style={{ color: T.t3, fontSize: 12 }}>Active roster</div></Card>
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

function formatTimestamp(value?: string | null): string {
  if (!value) return '—'
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? new Date(ms).toLocaleString() : '—'
}

function ReportApplicantPool() {
  const { prospects } = useAgencyData()
  const { applications } = useAppData()
  const staffEmails = new Set(USERS.map((user) => user.email.toLowerCase()))
  const people = prospects.filter((prospect) => !staffEmails.has((prospect.email || '').toLowerCase()))
  const byStage = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of people) map[p.stage] = (map[p.stage] || 0) + 1
    return map
  }, [people])
  const apps = useMemo(
    () =>
      Object.values(applications).filter((app) => !staffEmails.has((app.talent_email || '').toLowerCase())).sort((a, b) => {
        const aTs = Date.parse(a.last_saved || a.submitted_at || a.created_at || '') || 0
        const bTs = Date.parse(b.last_saved || b.submitted_at || b.created_at || '') || 0
        return bTs - aTs
      }),
    [applications],
  )
  return (
    <Panel title="Applicant Pool & Pipeline Log">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {Object.entries(byStage).map(([k, v]) => (
          <Card key={k} style={{ minWidth: 120 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{v}</div>
            <div style={{ fontSize: 11, color: T.t3 }}>{k}</div>
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Pipeline log</div>
        <Table
          headers={['Account ID', 'Name', 'Stage', 'Work Area', 'Source', 'Entered', 'Notes']}
          rows={people.map((p) => [
            <TalentLink key={`id-${p.id}`} accountId={p.accountId} name={p.name}>{p.accountId}</TalentLink>,
            <TalentLink key={`n-${p.id}`} accountId={p.accountId} name={p.name} />,
            p.stage,
            p.workArea,
            p.source,
            formatTimestamp(p.submittedAt),
            p.notes,
          ])}
        />
      </Card>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Applications</div>
        <Table
          headers={['Name', 'Status', 'Created', 'Last saved', 'Submitted']}
          rows={apps.map((app) => {
            const linked = people.find(
              (p) =>
                p.linkedApplicationId === app.id ||
                (app.talent_email && p.email?.toLowerCase() === app.talent_email.toLowerCase()),
            )
            const name = (
              linked?.accountId ? (
                <TalentLink key={`app-${app.id}`} accountId={linked.accountId} name={app.talent_name} />
              ) : (
                app.talent_name
              )
            )
            return [
              name,
              app.status.replace(/_/g, ' '),
              formatTimestamp(app.created_at),
              formatTimestamp(app.last_saved),
              formatTimestamp(app.submitted_at),
            ]
          })}
        />
        {apps.length === 0 && (
          <div style={{ padding: 16, color: T.t3, fontSize: 13 }}>No applications on file yet.</div>
        )}
      </Card>
    </Panel>
  )
}

function ReportEscrow() {
  const { escrow } = useAgencyData()
  const held = escrow.filter((e) => e.status === 'cleared').reduce((s, e) => s + e.amount, 0)
  return (
    <Panel title="Escrow & Deposit Balances">
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
    <Panel title="Onboarding & Offboarding">
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
              .filter((t) => t.status === 'active' || t.status === 'current')
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
  const now = new Date()
  const semester = `${now.getFullYear()}-${now.getMonth() < 6 ? 'Jan-Jun' : 'Jul-Dec'}`
  const divisions = [
    { label: 'Modeling', areas: ['Modeling'] },
    { label: 'Acting', areas: ['Acting'] },
    { label: 'Influencing/Content Creation', areas: ['Influencing', 'Influencer'] },
    { label: 'Athletics', areas: ['Sports'] },
  ]
  const rows = divisions.map((division) => {
    const filled = talent.filter((t) => {
      if (!division.areas.includes(t.workArea)) return false
      if (!t.contractStart) return true
      const start = new Date(`${t.contractStart}T12:00:00`)
      return start.getFullYear() === now.getFullYear() && (start.getMonth() < 6) === (now.getMonth() < 6)
    }).length
    return { label: division.label, filled }
  })
  const total = rows.reduce((sum, row) => sum + row.filled, 0)
  return (
    <Panel title="Roster Openings & Availability">
      <div style={{ fontSize: 12, color: T.t3, marginBottom: 8 }}>Semester {semester}. Capacity resets each January and July.</div>
      <Card>
        <Table
          headers={['Division', 'Filled', 'Capacity']}
          rows={[
            ...rows.map((row) => [row.label, String(row.filled), `${row.filled}/50`]),
            ['Total', String(total), `${total}/${divisions.length * 50}`],
          ]}
        />
      </Card>
    </Panel>
  )
}

function ReportGrossBookings() {
  const { invoices } = useAgencyData()
  const rows = invoices.map((inv) => {
    const split = splitGross(inv.amount, inv.commissionPct || 20)
    return { inv, split }
  })
  const gross = rows.reduce((s, r) => s + r.split.gross, 0)
  const commission = rows.reduce((s, r) => s + r.split.agencyCommission, 0)
  const talentShare = rows.reduce((s, r) => s + r.split.talentShare, 0)
  return (
    <Panel title="Gross Bookings & Commission Summary">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <Card><div style={{ color: T.t3, fontSize: 12 }}>Gross bookings</div><div style={{ fontSize: 26, fontWeight: 800 }}><Money value={gross} /></div></Card>
        <Card><div style={{ color: T.t3, fontSize: 12 }}>Agency commission (20%)</div><div style={{ fontSize: 26, fontWeight: 800 }}><Money value={commission} /></div></Card>
        <Card><div style={{ color: T.t3, fontSize: 12 }}>Net talent share (80%)</div><div style={{ fontSize: 26, fontWeight: 800 }}><Money value={talentShare} /></div></Card>
      </div>
      <Card>
        <Table
          headers={['Client / Brand', 'Project', 'Gross', 'Agency 20%', 'Talent 80%']}
          rows={rows.map(({ inv, split }) => [
            inv.clientName,
            inv.project,
            <Money key={`g-${inv.id}`} value={split.gross} />,
            <Money key={`c-${inv.id}`} value={split.agencyCommission} />,
            <Money key={`t-${inv.id}`} value={split.talentShare} />,
          ])}
        />
      </Card>
    </Panel>
  )
}

function ReportArAging() {
  const { invoices } = useAgencyData()
  return (
    <Panel title="Aged Client Invoices (AR Aging)">
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
    <Panel title="Overdue Client Accounts">
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
  const { expenseLogs, vendors, talent, issuePayout } = useAgencyData()
  const { user } = useAuth()
  const pending = expenseLogs.filter((e) => e.status === 'pending')
  const canApprove = Boolean(user && canAccessAgencyPath(user.role, 'issue-payouts'))
  const [approveId, setApproveId] = useState<string | null>(null)
  const approving = expenseLogs.find((e) => e.id === approveId) || null
  const vendor = vendors.find((v) => v.name === approving?.talentName) || null
  const roster = talent.find((t) => t.name === approving?.talentName)

  function agingLabel(loggedAt: string): string {
    const ms = Date.parse(loggedAt)
    if (!Number.isFinite(ms)) return '—'
    const days = Math.max(0, Math.floor((Date.now() - ms) / 86_400_000))
    return `${days}d`
  }

  return (
    <Panel title="Pending Talent Payouts (AP Aging)">
      {!isChaseConnected() && <IntegrationNotice id="chase" compact />}
      <Card>
        <Table
          headers={canApprove
            ? ['Talent', 'Project', 'Amount owed', 'Logged', 'Aging', '']
            : ['Talent', 'Project', 'Amount owed', 'Logged', 'Aging']}
          rows={pending.map((e) => {
            const cells = [
              <TalentLink key={e.id} name={e.talentName} />,
              e.project,
              <Money key={`m-${e.id}`} value={e.talentShare} />,
              new Date(e.loggedAt).toLocaleString(),
              agingLabel(e.loggedAt),
            ]
            if (canApprove) {
              cells.push(
                <Btn key={`a-${e.id}`} variant="success" onClick={() => setApproveId(e.id)}>
                  Approve
                </Btn>,
              )
            }
            return cells
          })}
        />
        {pending.length === 0 && (
          <div style={{ padding: 16, color: T.t3 }}>No pending AP. All logged splits have been paid or none logged yet.</div>
        )}
      </Card>
      {approving && user && (
        <ApprovePayoutModal
          log={approving}
          vendor={vendor}
          bankReady={roster?.bankReady}
          taxFormsReady={roster?.taxFormsReady}
          approverName={user.name}
          onClose={() => setApproveId(null)}
          onApprove={(details) => {
            issuePayout(approving.id, details)
            setApproveId(null)
          }}
        />
      )}
    </Panel>
  )
}
