import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApplicationAnswersTab, fileFromApplication } from '@/components/agency/ApplicationAnswersTab'
import { UdfPanel } from '@/components/agency/UdfPanel'
import { InvoiceFormModal, RetainerFormModal } from '@/components/agency/FinanceFormModals'
import {
  Badge,
  Btn,
  Card,
  Field,
  ModalShell,
  Money,
  Panel,
  StatusColor,
  Table,
  inputStyle,
} from '@/components/agency/AgencyUI'
import { TicketDetailModal } from '@/components/agency/TicketDetailModal'
import { SendApplicationModal } from '@/components/application/ApplicationModals'
import { DocViewer } from '@/components/ui/DocViewer'
import { AGENCY_TICKET_AGENTS } from '@/constants/agency-seed'
import { isAppComplete } from '@/constants/app-sections'
import { STAGE_LABELS } from '@/constants/stages'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { AGENCY_PROPERTY, formatAccountDisplay } from '@/lib/session-storage'
import { talentAccountPath } from '@/lib/talent-account'
import { interestsToTalentTypes, resolvedUdf } from '@/lib/talent-udf'
import { T } from '@/lib/tokens'
import type { Application } from '@/types/application'
import type {
  AgencyProspect,
  AgencyTalent,
  ClientInvoice,
  SupportTicket,
  TicketType,
  WorkArea,
} from '@/types/agency'
import type { HistoryEntry } from '@/types/history'
import type { Talent } from '@/types/talent'
import type { TalentUdf } from '@/types/udf'
import type { UploadedDoc } from '@/types/talent'
import { getVisibleSections, isFieldVisible } from '@/constants/app-sections'

export type AccountKind = 'applicant' | 'client'
type ProfileTab = 'general' | 'udf' | 'miscellaneous' | 'addresses' | 'application'
type ModalKind = 'note' | 'contact' | 'charge' | 'payment' | 'retainer' | 'issue' | 'docs' | 'renew' | null

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function workAreaFromApp(app: Application): WorkArea {
  const types = interestsToTalentTypes(String(app.data?.representation_interests || ''))
  if (types.includes('Acting')) return 'Acting'
  if (types.includes('Influencing')) return 'Influencing'
  if (types.includes('Sports')) return 'Sports'
  return 'Modeling'
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

function applicationDocs(app: Application | null | undefined): UploadedDoc[] {
  if (!app?.data) return []
  const data = app.data
  const docs: UploadedDoc[] = []
  for (const section of getVisibleSections(data)) {
    for (const field of section.fields) {
      if (field.type !== 'file_upload' || !isFieldVisible(field, data)) continue
      const doc = fileFromApplication(data, field.id, field.label)
      if (doc) docs.push(doc)
    }
  }
  return docs
}

function FieldRow({ label, value }: { label: string; value?: ReactNode }) {
  const empty = value === undefined || value === null || value === ''
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
      <span style={{ color: T.t1, fontWeight: 500, textAlign: 'right' }}>{empty ? '—' : value}</span>
    </div>
  )
}

export function AccountProfileTemplate({
  kind,
  displayName,
  statusLabel,
  statusColor,
  accountId,
  email,
  phone,
  application,
  prospect,
  rosterTalent,
  pipelineTalent,
  backTo,
  extraActions,
  extraBody,
  onUploadContract,
}: {
  kind: AccountKind
  displayName: string
  statusLabel: string
  statusColor: string
  accountId?: string
  email?: string
  phone?: string
  application?: Application | null
  prospect?: AgencyProspect | null
  rosterTalent?: AgencyTalent | null
  pipelineTalent?: Talent | null
  backTo: { label: string; to: string }
  extraActions?: ReactNode
  extraBody?: ReactNode
  onUploadContract?: (file: File) => void
}) {
  const navigate = useNavigate()
  const { user, companyCode } = useAuth()
  const { history, setHistory, importAppToPipeline, handleSendApp } = useAppData()
  const {
    clients,
    invoices,
    tickets,
    createInvoice,
    addRetainer,
    addTicket,
    createProspect,
    updateProspect,
    updateTalent,
    updateTicket,
  } = useAgencyData()
  const [tab, setTab] = useState<ProfileTab>(application ? 'application' : 'general')
  const [modal, setModal] = useState<ModalKind>(null)
  const [noteText, setNoteText] = useState('')
  const [contactPhone, setContactPhone] = useState(phone || prospect?.phone || '')
  const [contactEmail, setContactEmail] = useState(email || prospect?.email || '')
  const [issueSubject, setIssueSubject] = useState('')
  const [issueBody, setIssueBody] = useState('')
  const [issueType, setIssueType] = useState<TicketType>('general')
  const [issuePriority, setIssuePriority] = useState<SupportTicket['priority']>('medium')
  const [viewDoc, setViewDoc] = useState<UploadedDoc | null>(null)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [udf, setUdf] = useState<TalentUdf>(() => resolvedUdf(prospect?.udf || rosterTalent?.udf, application, prospect))
  const [udfSaved, setUdfSaved] = useState(false)
  const contactsRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUdf(resolvedUdf(prospect?.udf || rosterTalent?.udf, application, prospect))
    setContactPhone(phone || prospect?.phone || '')
    setContactEmail(email || prospect?.email || '')
  }, [prospect, rosterTalent, application, email, phone])

  const relatedInvoices = invoices.filter((inv) => inv.talentName === displayName)
  const relatedTickets = tickets.filter((ticket) => ticket.talentName === displayName)
  const relatedHistory = history.filter(
    (entry) =>
      (pipelineTalent?.id && entry.talent_id === pipelineTalent.id) ||
      (accountId && entry.account_number === accountId),
  )
  const openBalance = relatedInvoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.amount || 0) + (inv.taxAmount || 0), 0)
  const lastContact =
    relatedHistory[0]?.ts ||
    prospect?.lastLoginAt ||
    application?.last_saved ||
    application?.created_at ||
    ''
  const invoiceClients = clients.length ? clients.map((c) => ({ id: c.id, name: c.name })) : [{ id: 'internal', name: displayName }]
  const docs = [
    ...applicationDocs(application),
    ...(prospect?.contracts || []).map((c) => ({
      name: c.document.name,
      data: c.document.data,
      type: c.document.type,
    })),
  ]
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null
  const canImport = Boolean(application && isAppComplete(application) && application.status === 'submitted')
  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'udf', label: 'UDF' },
    { id: 'miscellaneous', label: 'Miscellaneous' },
    { id: 'addresses', label: 'Addresses' },
    ...(application ? [{ id: 'application' as const, label: 'Application' }] : []),
  ]

  function ensureProspect(): AgencyProspect | null {
    if (prospect) return prospect
    if (!application?.talent_email && !email) return null
    const created = createProspect({
      name: displayName,
      email: (application?.talent_email || email || '').trim(),
      workArea: application ? workAreaFromApp(application) : 'Modeling',
      source: 'Portal application',
      notes: '',
      organization: application?.company_code || 'NZG',
      messageEmails: [application?.talent_email || email || ''].filter(Boolean),
      firstName: String(application?.data?.legal_first || splitName(displayName).firstName),
      lastName: String(application?.data?.legal_last || splitName(displayName).lastName),
      phone: String(application?.data?.phone || phone || ''),
      city: String(application?.data?.city || ''),
      state: String(application?.data?.state || ''),
      linkedApplicationId: application?.id || null,
      stage: application?.status === 'submitted' ? 'application_completed' : 'application_started',
    })
    return created
  }

  function persistUdf(next: TalentUdf) {
    const person = prospect || ensureProspect()
    if (person) updateProspect(person.id, { udf: next })
    if (rosterTalent) updateTalent(rosterTalent.id, { udf: next })
    setUdfSaved(true)
  }

  function addHistoryNote(text: string) {
    const entry: HistoryEntry = {
      id: `h_${Date.now()}`,
      talent_id: pipelineTalent?.id || null,
      account_number: accountId || prospect?.accountId || null,
      user_id: user?.id || null,
      type: 'note',
      text,
      ts: new Date().toISOString(),
      flagged: false,
      is_document: false,
      staff_name: user?.name,
    }
    setHistory((prev) => [entry, ...prev])
  }

  function saveInvoice(values: Omit<ClientInvoice, 'id'>) {
    createInvoice({ ...values, talentName: displayName })
    setModal(null)
  }

  const paidInitial: ClientInvoice = {
    id: '',
    clientId: invoiceClients[0]?.id || 'internal',
    clientName: invoiceClients[0]?.name || displayName,
    talentName: displayName,
    project: 'Payment received',
    amount: 0,
    commissionPct: 0,
    status: 'paid',
    issuedAt: today(),
    dueAt: today(),
    paidAt: today(),
    interestApplied: 0,
    taxId: '',
    taxRatePct: 0,
    taxAmount: 0,
  }

  return (
    <Panel
      title={displayName}
      subtitle={`${kind === 'applicant' ? 'Applicant' : 'Client'} account · ${formatAccountDisplay(accountId)}`}
      actions={
        <>
          <Link to={backTo.to} style={{ fontSize: 12, fontWeight: 600, color: T.blue, alignSelf: 'center' }}>
            {backTo.label}
          </Link>
          <Btn onClick={() => setModal('note')}>Add Note</Btn>
        </>
      }
    >
      <Card hover={false} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: T.t3, fontWeight: 600 }}>PAYOUT DUE</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              <Money value={openBalance} />
            </div>
          </div>
          <Badge color={statusColor}>{statusLabel}</Badge>
          <div>
            <div style={{ fontSize: 11, color: T.t3, fontWeight: 600 }}>ACCOUNT #</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{formatAccountDisplay(accountId)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#eef2ff',
                color: T.blue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}
            >
              {initials(displayName)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{displayName}</div>
              <div style={{ fontSize: 12, color: T.t3 }}>
                Last contact: {lastContact ? new Date(lastContact).toLocaleString() : '—'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <Btn variant="secondary" onClick={() => setModal('note')}>Add Note</Btn>
        <Btn variant="secondary" onClick={() => setModal('contact')}>Add contact</Btn>
        <Btn variant="secondary" onClick={() => setModal(kind === 'applicant' ? 'renew' : 'note')}>Renew</Btn>
        <Btn variant="secondary" onClick={() => contactsRef.current?.scrollIntoView({ behavior: 'smooth' })}>Contacts</Btn>
        <Btn variant="secondary" onClick={() => notesRef.current?.scrollIntoView({ behavior: 'smooth' })}>History Notes</Btn>
        <Btn variant="secondary" onClick={() => setModal('payment')}>Add Payment</Btn>
        <Btn onClick={() => setModal('charge')}>Add Charge</Btn>
        <Btn variant="secondary" onClick={() => setModal('retainer')}>Recurring Fees</Btn>
        <Btn variant="secondary" onClick={() => setModal('issue')}>Add Issue</Btn>
        <Btn variant="secondary" onClick={() => navigate('/send-email')}>Send Email</Btn>
        <Btn variant="secondary" onClick={() => setModal('docs')}>View documents</Btn>
        {kind === 'applicant' && (
          <Btn variant="success" disabled={!canImport} onClick={() => application && importAppToPipeline(application)}>
            Import to pipeline
          </Btn>
        )}
        {accountId && (
          <Btn variant="ghost" onClick={() => navigate(talentAccountPath(accountId))}>
            Open talent account
          </Btn>
        )}
        {extraActions}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card hover={false}>
          <div ref={contactsRef} style={{ fontSize: 12, fontWeight: 700, color: T.t3, marginBottom: 8 }}>
            ACCOUNT DETAILS
          </div>
          <FieldRow label="Legal name" value={displayName} />
          <FieldRow label="Preferred name" value={String(application?.data?.preferred_name || udf.stageName || '')} />
          <FieldRow label="Email" value={email || prospect?.email} />
          <FieldRow label="Phone" value={phone || prospect?.phone} />
          <FieldRow label="Property" value={prospect?.property || AGENCY_PROPERTY} />
          <FieldRow
            label="Address"
            value={[prospect?.street, prospect?.city, prospect?.state, prospect?.postal].filter(Boolean).join(', ')}
          />
          <FieldRow label="Date of birth" value={String(application?.data?.dob || prospect?.dateOfBirth || '')} />
          <FieldRow label="Assigned agent" value={prospect?.assignedAgentName || udf.assignedAgent} />
          <FieldRow label="Work area" value={prospect?.workArea || rosterTalent?.workArea} />
          <FieldRow label="Minor" value={prospect?.isMinor ? 'Yes' : application?.data?.dob ? 'No' : ''} />
          <FieldRow label="Parent / guardian" value={prospect?.parentName || udf.emergencyName} />
          <FieldRow label="Emergency phone" value={prospect?.parentPhone || udf.emergencyPhone} />
          <FieldRow label="Source" value={prospect?.source} />
          <FieldRow label="Pipeline" value={pipelineTalent ? STAGE_LABELS[pipelineTalent.stage] || pipelineTalent.stage : ''} />
        </Card>
        <div>
          <Card hover={false} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, marginBottom: 8 }}>CHARGES / TRANSACTIONS</div>
            <Table
              headers={['Project', 'Client', 'Amount', 'Status']}
              rows={relatedInvoices.map((inv) => [
                inv.project,
                inv.clientName,
                <Money key={inv.id} value={(inv.amount || 0) + (inv.taxAmount || 0)} />,
                <Badge key={`${inv.id}-st`} color={StatusColor(inv.status)}>
                  {inv.status}
                </Badge>,
              ])}
            />
          </Card>
          <Card hover={false}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, marginBottom: 8 }}>SERVICE ISSUES</div>
            <Table
              headers={['Subject', 'Type', 'Status']}
              rows={relatedTickets.map((ticket) => [
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  style={{ background: 'none', border: 'none', color: T.blue, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  {ticket.subject}
                </button>,
                ticket.type,
                ticket.status,
              ])}
            />
          </Card>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb' }}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === item.id ? `2px solid ${T.blue}` : '2px solid transparent',
              padding: '8px 10px',
              fontWeight: 700,
              color: tab === item.id ? T.blue : T.t3,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <Card hover={false}>
          <FieldRow label="Account #" value={formatAccountDisplay(accountId)} />
          <FieldRow label="Status" value={statusLabel} />
          <FieldRow label="Organization" value={prospect?.organization || application?.company_code} />
          <FieldRow label="Representation" value={prospect?.representationType} />
          <FieldRow label="Access code" value={application?.access_code} />
          <FieldRow label="Application status" value={application?.status} />
          <FieldRow label="Message recipients" value={prospect?.messageEmails?.join(', ')} />
        </Card>
      )}
      {tab === 'udf' && (
        <UdfPanel
          value={udf}
          onChange={(next) => {
            setUdf(next)
            setUdfSaved(false)
          }}
          onSave={() => persistUdf(udf)}
          saved={udfSaved}
        />
      )}
      {tab === 'miscellaneous' && (
        <Card hover={false}>
          <FieldRow label="Notes" value={prospect?.notes} />
          <FieldRow label="Bank ready" value={rosterTalent ? (rosterTalent.bankReady ? 'Yes' : 'No') : ''} />
          <FieldRow label="Tax forms" value={rosterTalent ? (rosterTalent.taxFormsReady ? 'Yes' : 'No') : ''} />
          <FieldRow label="Availability" value={rosterTalent ? (rosterTalent.available ? 'Available' : 'Booked') : udf.availabilityStatus} />
          <FieldRow label="Niches" value={rosterTalent?.niches?.join(', ')} />
          <FieldRow label="Currently represented" value={String(application?.data?.currently_represented || '')} />
        </Card>
      )}
      {tab === 'addresses' && (
        <Card hover={false}>
          <FieldRow label="Property" value={prospect?.property || AGENCY_PROPERTY} />
          <FieldRow label="Street" value={prospect?.street} />
          <FieldRow label="City" value={prospect?.city || String(application?.data?.city || '')} />
          <FieldRow label="State" value={prospect?.state || String(application?.data?.state || '')} />
          <FieldRow label="Postal" value={prospect?.postal} />
          <FieldRow label="Market" value={String(application?.data?.current_market || '')} />
          <FieldRow label="Country" value={String(application?.data?.country || '')} />
        </Card>
      )}
      {tab === 'application' && application && <ApplicationAnswersTab application={application} />}

      <div ref={notesRef} style={{ marginTop: 16 }}>
        <Card hover={false}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, marginBottom: 8 }}>HISTORY NOTES</div>
          {relatedHistory.length === 0 ? (
            <div style={{ color: T.t3, fontSize: 13 }}>No notes yet.</div>
          ) : (
            relatedHistory.slice(0, 12).map((entry) => (
              <div key={entry.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                <div style={{ color: T.t3, fontSize: 11 }}>{new Date(entry.ts).toLocaleString()} · {entry.type}</div>
                <div>{entry.text}</div>
              </div>
            ))
          )}
        </Card>
      </div>

      {extraBody}

      {modal === 'note' && (
        <ModalShell title="Add note" onClose={() => setModal(null)}>
          <Field label="Note">
            <textarea style={{ ...inputStyle, minHeight: 96 }} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn
              onClick={() => {
                if (noteText.trim()) addHistoryNote(noteText.trim())
                setNoteText('')
                setModal(null)
              }}
            >
              Save note
            </Btn>
          </div>
        </ModalShell>
      )}
      {modal === 'contact' && (
        <ModalShell title="Add / update contact" onClose={() => setModal(null)}>
          <Field label="Email">
            <input style={inputStyle} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <input style={inputStyle} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn
              onClick={() => {
                const person = prospect || ensureProspect()
                if (person) {
                  updateProspect(person.id, {
                    email: contactEmail.trim() || person.email,
                    phone: contactPhone.trim() || person.phone,
                    messageEmails: contactEmail.trim() ? [contactEmail.trim()] : person.messageEmails,
                  })
                }
                setModal(null)
              }}
            >
              Save contact
            </Btn>
          </div>
        </ModalShell>
      )}
      {modal === 'charge' && (
        <InvoiceFormModal
          clients={invoiceClients}
          talentNames={[displayName]}
          onClose={() => setModal(null)}
          onSave={saveInvoice}
        />
      )}
      {modal === 'payment' && (
        <InvoiceFormModal
          initial={paidInitial}
          clients={invoiceClients}
          talentNames={[displayName]}
          onClose={() => setModal(null)}
          onSave={saveInvoice}
        />
      )}
      {modal === 'retainer' && (
        <RetainerFormModal
          clients={invoiceClients}
          onClose={() => setModal(null)}
          onSave={(values) => {
            addRetainer(values)
            setModal(null)
          }}
        />
      )}
      {modal === 'issue' && (
        <ModalShell title="Add issue" onClose={() => setModal(null)}>
          <Field label="Subject">
            <input style={inputStyle} value={issueSubject} onChange={(e) => setIssueSubject(e.target.value)} />
          </Field>
          <Field label="Type">
            <select style={inputStyle} value={issueType} onChange={(e) => setIssueType(e.target.value as TicketType)}>
              {(['availability', 'scheduling', 'contract', 'billing', 'general'] as TicketType[]).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              style={inputStyle}
              value={issuePriority}
              onChange={(e) => setIssuePriority(e.target.value as SupportTicket['priority'])}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </Field>
          <Field label="Details">
            <textarea style={{ ...inputStyle, minHeight: 80 }} value={issueBody} onChange={(e) => setIssueBody(e.target.value)} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn
              onClick={() => {
                addTicket({
                  subject: issueSubject.trim() || `Issue for ${displayName}`,
                  clientId: invoiceClients[0]?.id || 'internal',
                  clientName: invoiceClients[0]?.name || displayName,
                  talentName: displayName,
                  status: 'open',
                  type: issueType,
                  priority: issuePriority,
                  dueDate: today(),
                  body: issueBody.trim() || `Opened from ${kind} profile`,
                  assignee: user?.name || AGENCY_TICKET_AGENTS[0]?.name || 'Unassigned',
                })
                ensureProspect()
                setIssueSubject('')
                setIssueBody('')
                setModal(null)
              }}
            >
              Create issue
            </Btn>
          </div>
        </ModalShell>
      )}
      {modal === 'docs' && (
        <ModalShell title="Documents" onClose={() => setModal(null)} width={640}>
          {docs.length === 0 && <div style={{ color: T.t3, fontSize: 13 }}>No documents on file.</div>}
          {docs.map((doc) => (
            <div key={doc.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span>{doc.name}</span>
              <Btn variant="ghost" onClick={() => setViewDoc(doc)}>View</Btn>
            </div>
          ))}
          {onUploadContract && (
            <label style={{ display: 'inline-block', marginTop: 12, color: T.blue, fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onUploadContract(file)
                  e.target.value = ''
                }}
              />
              Upload contract
            </label>
          )}
        </ModalShell>
      )}
      {modal === 'renew' && application && (
        <SendApplicationModal
          talent={{ id: application.talent_id || application.id, name: displayName }}
          companyCode={companyCode || application.company_code}
          onSend={handleSendApp}
          onClose={() => setModal(null)}
        />
      )}

      <DocViewer doc={viewDoc} onClose={() => setViewDoc(null)} />
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicketId(null)}
          updateTicket={updateTicket}
          isDirector={user?.role === 'director'}
          agents={AGENCY_TICKET_AGENTS}
        />
      )}
    </Panel>
  )
}
