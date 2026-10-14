import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApplicationAnswersTab, fileFromApplication } from '@/components/agency/ApplicationAnswersTab'
import { hasPermission } from '@/constants'
import { PersonApplicationPanel } from '@/components/agency/PersonApplicationPanel'
import { UdfPanel } from '@/components/agency/UdfPanel'
import { ExpenseFormModal, InvoiceFormModal, RetainerFormModal } from '@/components/agency/FinanceFormModals'
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
import { ApplicationReview, SendApplicationModal } from '@/components/application/ApplicationModals'
import { BackToTopButton } from '@/components/ui/BackToTopButton'
import { DocViewer } from '@/components/ui/DocViewer'
import { AddNoteModal } from '@/components/agency/AddNoteModal'
import { HistoryLedger } from '@/components/agency/HistoryLedger'
import { QuickActionBar, type QuickActionId } from '@/components/agency/QuickActionBar'
import { NewIssueModal } from '@/components/agency/IssuesDashboard'
import { AddTaskModal } from '@/components/agency/AgencyTasksBoard'
import { AppointmentForm } from '@/components/agency/InteractiveCalendar'
import { PersonFocusModal, type PersonFocus } from '@/components/agency/PersonFocusModal'
import { downloadReport } from '@/lib/report-export'
import { RenewalOfferModal } from '@/components/agency/RenewalOffersHub'
import { createHistoryEntry } from '@/lib/history-ledger'
import { staffTicketAgents, useStaffDirectory } from '@/hooks/useStaffDirectory'
import { isApplicationReadyToImport } from '@/lib/application-prefill'
import { splitPersonName } from '@/lib/guardian-email'
import { inviteGuardian } from '@/services/guardian.service'
import { STAGE_LABELS } from '@/constants/stages'
import { isMinor } from '@/constants/app-sections'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { useResolvedImageUrl } from '@/hooks/useResolvedImageUrl'
import { useViewport } from '@/hooks/useViewport'
import { staffGridColumns } from '@/lib/viewport'
import { AGENCY_PROPERTY, formatAccountDisplay } from '@/lib/session-storage'
import { talentAccountPath } from '@/lib/talent-account'
import { resolvePipelineTalentId } from '@/lib/resolve-history-talent'
import { interestsToTalentTypes, resolvedUdf } from '@/lib/talent-udf'
import { T } from '@/lib/tokens'
import { isImageDoc, resolveProfilePhoto, uploadProfilePhoto } from '@/lib/profile-photo'
import { useImageCropper } from '@/components/ui/ImageCropper'
import { cropAspectForField } from '@/lib/crop-image'
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

export type AccountKind = 'applicant' | 'client'
type ProfileTab = 'general' | 'udf' | 'miscellaneous' | 'addresses' | 'application'
type ModalKind = 'note' | 'contact' | 'charge' | 'payment' | 'retainer' | 'issue' | 'docs' | 'renew' | 'appointment' | 'task' | 'payout' | null

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
  for (const key of Object.keys(data)) {
    if (!key.startsWith('doc_') || key.endsWith('_name') || key.endsWith('_type') || !data[key]) continue
    const doc = fileFromApplication(data, key, String(data[`${key}_name`] || key))
    if (doc) docs.push(doc)
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
        borderBottom: `1px solid ${T.cardBorder}`,
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
  const band = useViewport()
  const { user, companyCode } = useAuth()
  const ticketAgents = staffTicketAgents(useStaffDirectory())
  const { cropImage, cropper } = useImageCropper()
  const { history, setHistory, importAppToPipeline, handleSendApp, updateTalent: updatePipelineTalent, talents, saveApp, reviewingApp, setReviewingApp } = useAppData()
  const {
    clients,
    invoices,
    tickets,
    createInvoice,
    addRetainer,
    addTicket,
    createProspect,
    updateProspect,
    updateTalent: updateRosterTalent,
    updateTicket,
    addExpenseLog,
  } = useAgencyData()
  const [tab, setTab] = useState<ProfileTab>(application ? 'application' : 'general')
  const [modal, setModal] = useState<ModalKind>(null)
  const [focus, setFocus] = useState<PersonFocus | null>(null)
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
  const [localPhoto, setLocalPhoto] = useState<UploadedDoc | null>(null)
  const [parentNotice, setParentNotice] = useState('')
  const [parentSaving, setParentSaving] = useState(false)
  const [parentFirst, setParentFirst] = useState('')
  const [parentLast, setParentLast] = useState('')
  const [parentEmailInput, setParentEmailInput] = useState('')
  const contactsRef = useRef<HTMLDivElement>(null)
  const chargesRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUdf(resolvedUdf(prospect?.udf || rosterTalent?.udf, application, prospect))
    setContactPhone(phone || prospect?.phone || '')
    setContactEmail(email || prospect?.email || '')
  }, [prospect, rosterTalent, application, email, phone])

  useEffect(() => {
    const stored = splitPersonName(prospect?.parentName || pipelineTalent?.parent_name || '')
    setParentFirst(String(application?.data?.guardian_legal_first || stored.first))
    setParentLast(String(application?.data?.guardian_legal_last || stored.last))
    setParentEmailInput(
      String(
        application?.data?.guardian_invite_email ||
          application?.guardian_email ||
          prospect?.parentEmail ||
          pipelineTalent?.parent_email ||
          '',
      ),
    )
    setParentNotice('')
  }, [prospect?.id, application?.id, pipelineTalent?.id])

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
  const profilePhoto =
    localPhoto ||
    resolveProfilePhoto({ pipelineTalent, rosterTalent, prospect, application })
  const profilePhotoUrl = useResolvedImageUrl(profilePhoto)
  if (profilePhoto && !docs.some((d) => d.data === profilePhoto.data && d.name === profilePhoto.name)) {
    docs.unshift(profilePhoto)
  }
  const canEditPhoto = user?.role === 'director'
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null
  const canImport = Boolean(application && isApplicationReadyToImport(application))
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
    if (rosterTalent) updateRosterTalent(rosterTalent.id, { udf: next })
    setUdfSaved(true)
  }

  async function persistProfilePhoto(doc: UploadedDoc) {
    setLocalPhoto(doc)
    if (pipelineTalent) {
      try {
        await updatePipelineTalent({
          ...pipelineTalent,
          uploaded_docs: { ...(pipelineTalent.uploaded_docs || {}), profile_photo: doc },
        })
      } catch {
        /* toast is shown by AppDataContext */
      }
    }
    if (rosterTalent) updateRosterTalent(rosterTalent.id, { profilePhoto: doc })
    const person = prospect || ensureProspect()
    if (person) updateProspect(person.id, { profilePhoto: doc })
  }

  async function onProfilePhotoFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    try {
      const cropped = await cropImage(file, {
        aspect: cropAspectForField('profile_photo'),
        title: 'Crop profile photo',
      })
      if (!cropped) return
      const ownerId =
        pipelineTalent?.id || rosterTalent?.id || prospect?.id || application?.id || accountId || 'unassigned'
      const doc = await uploadProfilePhoto(cropped, ownerId, user?.name || 'staff')
      await persistProfilePhoto(doc)
    } catch {
      /* persist errors toast from AppDataContext; upload errors leave the previous photo */
    }
  }

  function addHistoryNote(text: string, category: import('@/types/history').HistoryCategory = 'general', type: import('@/types/history').HistoryType = 'note') {
    const entry = createHistoryEntry({
      type,
      text,
      category,
      userId: user?.id,
      staffName: user?.name,
      talentId: resolvePipelineTalentId(talents, {
        id: pipelineTalent?.id,
        email: email || prospect?.email || pipelineTalent?.email,
        applicationId: application?.id || pipelineTalent?.application_id,
        accountId: accountId || prospect?.accountId || pipelineTalent?.account_number,
      }),
      accountNumber: accountId || prospect?.accountId || pipelineTalent?.account_number || null,
    })
    setHistory((prev) => [entry, ...prev])
  }

  function historyLink() {
    return {
      talentId: resolvePipelineTalentId(talents, {
        id: pipelineTalent?.id,
        email: email || prospect?.email || pipelineTalent?.email,
        applicationId: application?.id || pipelineTalent?.application_id,
        accountId: accountId || prospect?.accountId || pipelineTalent?.account_number,
      }),
      accountNumber: accountId || prospect?.accountId || pipelineTalent?.account_number || null,
    }
  }

  function exportPerson(kind: 'profile' | 'ledger' | 'history' | 'contract') {
    const lines =
      kind === 'ledger'
        ? relatedInvoices.map((inv) => `${inv.project} · ${inv.clientName} · $${inv.amount} · ${inv.status}`)
        : kind === 'history'
          ? relatedHistory.map((entry) => `${new Date(entry.ts).toLocaleString()} · ${entry.text}`)
          : kind === 'contract'
            ? [
                `Representation: ${prospect?.representationType || '—'}`,
                ...(prospect?.contracts || []).map((contract) => `${contract.title} · ${contract.status}`),
                application?.access_code ? `Access code: ${application.access_code}` : '',
              ].filter(Boolean)
            : [
                `Account: ${formatAccountDisplay(accountId)}`,
                `Email: ${email || prospect?.email || '—'}`,
                `Phone: ${phone || prospect?.phone || '—'}`,
                `Status: ${statusLabel}`,
                `Work area: ${prospect?.workArea || rosterTalent?.workArea || '—'}`,
                `Pipeline: ${pipelineTalent ? STAGE_LABELS[pipelineTalent.stage] || pipelineTalent.stage : '—'}`,
              ]
    const label = { profile: 'Profile', ledger: 'Ledger', history: 'History', contract: 'Contracts' }[kind]
    downloadReport(`${displayName} ${label}`, lines.length ? lines : ['No records on file.'], 'markdown')
  }

  function onQuickAction(id: QuickActionId) {
    const personEmail = email || prospect?.email || ''
    const personPhone = phone || prospect?.phone || ''
    if (id === 'add-note' || id === 'add-call' || id === 'add-meeting' || id === 'log-email') setModal('note')
    else if (id === 'add-issue') setModal('issue')
    else if (id === 'add-charge') setModal('charge')
    else if (id === 'add-payment') setModal('payment')
    else if (id === 'add-payout') setModal('payout')
    else if (id === 'send-renewal' || id === 'add-agreement') setModal('renew')
    else if (id === 'add-appointment') setModal('appointment')
    else if (id === 'add-task') setModal('task')
    else if (id === 'send-email') {
      if (personEmail) navigate(`/send-email?to=${encodeURIComponent(personEmail)}`)
      else setModal('contact')
    }
    else if (id === 'send-sms') navigate(`/messaging?to=${encodeURIComponent(personPhone || displayName)}`)
    else if (id === 'related-invoices') chargesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else if (id === 'related-contracts' || id === 'send-dochub') setModal('docs')
    else if (id === 'view-profile') window.scrollTo({ top: 0, behavior: 'smooth' })
    else if (id === 'stage-status') setFocus('stage-status')
    else if (id === 'assigned-team') setFocus('assigned-team')
    else if (id === 'screening-status' || id === 'related-screenings' || id === 'initiate-screening') setFocus('screening')
    else if (id === 'portal-access' || id === 'notifications' || id === 'payment-settings') setFocus(id)
    else if (id === 'export-profile') exportPerson('profile')
    else if (id === 'export-ledger') exportPerson('ledger')
    else if (id === 'export-history') exportPerson('history')
    else if (id === 'export-contract') exportPerson('contract')
  }

  function saveInvoice(values: Omit<ClientInvoice, 'id'>, action?: 'new' | 'finish') {
    createInvoice({ ...values, talentName: displayName })
    if (action !== 'new') setModal(null)
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
    <>
      {cropper}
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'stretch',
        flex: 1,
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                aria-label={profilePhoto ? `View profile photo of ${displayName}` : `${displayName} profile`}
                onClick={() => {
                  if (profilePhoto) setViewDoc(profilePhoto)
                }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: `1px solid ${T.cardBorder}`,
                  background: '#eef2ff',
                  color: T.blue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 20,
                  overflow: 'hidden',
                  padding: 0,
                  cursor: profilePhoto ? 'pointer' : 'default',
                }}
              >
                {profilePhoto && isImageDoc(profilePhoto) && profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  initials(displayName)
                )}
              </button>
              {canEditPhoto && (
                <>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    aria-label="Change photo"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      void onProfilePhotoFile(file)
                    }}
                  />
                  <Btn variant="ghost" onClick={() => photoInputRef.current?.click()}>
                    Change photo
                  </Btn>
                </>
              )}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{displayName}</div>
              <div style={{ fontSize: 12, color: T.t3 }}>
                Last contact: {lastContact ? new Date(lastContact).toLocaleString() : '—'}
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.t3, fontWeight: 600 }}>ACCOUNT #</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{formatAccountDisplay(accountId)}</div>
          </div>
          <Badge color={statusColor}>{statusLabel}</Badge>
          <div>
            <div style={{ fontSize: 11, color: T.t3, fontWeight: 600 }}>PAYOUT DUE</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              <Money value={openBalance} />
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {application && (
          <Btn
            variant="success"
            disabled={!canImport}
            onClick={() => {
              if (application) setReviewingApp(application)
            }}
          >
            Review application
          </Btn>
        )}
        {extraActions}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: staffGridColumns(band, '1.1fr 1fr'), gap: 14, marginBottom: 14 }}>
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
          <FieldRow label="Minor" value={prospect?.isMinor || isMinor(String(application?.data?.dob || prospect?.dateOfBirth || pipelineTalent?.dob || '')) ? 'Yes' : application?.data?.dob || prospect?.dateOfBirth ? 'No' : ''} />
          <FieldRow label="Parent / guardian" value={[parentFirst, parentLast].filter(Boolean).join(' ') || prospect?.parentName || udf.emergencyName} />
          <FieldRow label="Parent email" value={parentEmailInput || prospect?.parentEmail} />
          <FieldRow label="Emergency phone" value={prospect?.parentPhone || udf.emergencyPhone} />
          {(prospect?.isMinor || isMinor(String(application?.data?.dob || prospect?.dateOfBirth || pipelineTalent?.dob || ''))) && (
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              <Field label="Parent first name">
                <input style={inputStyle} value={parentFirst} onChange={(e) => setParentFirst(e.target.value)} />
              </Field>
              <Field label="Parent last name">
                <input style={inputStyle} value={parentLast} onChange={(e) => setParentLast(e.target.value)} />
              </Field>
              <Field label="Parent email">
                <input style={inputStyle} type="email" value={parentEmailInput} onChange={(e) => setParentEmailInput(e.target.value)} />
              </Field>
              <Btn
                variant="primary"
                disabled={parentSaving}
                onClick={() => {
                  void (async () => {
                    const first = parentFirst.trim()
                    const last = parentLast.trim()
                    const emailValue = parentEmailInput.trim()
                    if (!first || !last || !emailValue.includes('@')) {
                      setParentNotice('Parent first name, last name, and a valid email are required.')
                      return
                    }
                    setParentSaving(true)
                    setParentNotice('')
                    const fullName = `${first} ${last}`
                    const person = prospect || ensureProspect()
                    if (person) updateProspect(person.id, { parentName: fullName, parentEmail: emailValue, isMinor: true })
                    if (pipelineTalent) {
                      try {
                        await updatePipelineTalent({
                          ...pipelineTalent,
                          parent_name: fullName,
                          parent_email: emailValue,
                          parent_guardian_required: 'Yes',
                          legal_minor_status: 'Yes',
                        })
                      } catch {
                        setParentSaving(false)
                        setParentNotice('Parent contact could not be saved.')
                        return
                      }
                    }
                    if (!application) {
                      setParentSaving(false)
                      setParentNotice('Parent saved. The access email sends when this minor has an application.')
                      return
                    }
                    const next = {
                      ...application,
                      guardian_email: emailValue,
                      data: {
                        ...(application.data || {}),
                        guardian_legal_first: first,
                        guardian_legal_last: last,
                        guardian_invite_email: emailValue,
                      },
                    }
                    saveApp(next)
                    const result = await inviteGuardian(next, emailValue, { force: false, markPending: false })
                    setParentSaving(false)
                    if (result.error || result.emailWarning) {
                      setParentNotice(result.error || result.emailWarning || 'Could not send the parent access email.')
                      return
                    }
                    setParentNotice(result.skipped
                      ? 'This parent already received an access email. Change the email to send a new one.'
                      : 'Parent access email sent.')
                  })()
                }}
              >
                {parentSaving ? 'Sending…' : application ? 'Save parent and send access email' : 'Save parent'}
              </Btn>
              {parentNotice && <div style={{ fontSize: 12, color: T.t2, lineHeight: 1.45 }}>{parentNotice}</div>}
            </div>
          )}
          <FieldRow label="Source" value={prospect?.source} />
          <FieldRow label="Pipeline" value={pipelineTalent ? STAGE_LABELS[pipelineTalent.stage] || pipelineTalent.stage : ''} />
        </Card>
        <div>
          <Card hover={false} style={{ marginBottom: 12 }}>
            <div ref={chargesRef} style={{ fontSize: 12, fontWeight: 700, color: T.t3, marginBottom: 8 }}>CHARGES / TRANSACTIONS</div>
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', borderBottom: `1px solid ${T.cardBorder}` }}>
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
      {tab === 'application' && application && (
        <>
          <PersonApplicationPanel application={application} onAddApplicant={(next) => saveApp(next)} />
          <ApplicationAnswersTab application={application} />
        </>
      )}

      <div ref={notesRef} style={{ marginTop: 16 }}>
        <Card hover={false}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, marginBottom: 8 }}>HISTORY NOTES</div>
          <HistoryLedger entries={relatedHistory} limit={8} />
        </Card>
      </div>

      {extraBody}

      {modal === 'note' && (
        <AddNoteModal
          personName={displayName}
          onClose={() => setModal(null)}
          onSave={({ text, category, type }) => addHistoryNote(text, category, type)}
        />
      )}
      {modal === 'issue' && <NewIssueModal defaultTalent={displayName} onClose={() => setModal(null)} />}
      {modal === 'renew' && rosterTalent && (
        <RenewalOfferModal talent={rosterTalent} onClose={() => setModal(null)} />
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
          onSave={(values, action) => {
            addRetainer(values)
            if (action !== 'new') setModal(null)
          }}
        />
      )}
      {modal === 'docs' && (
        <ModalShell title="Documents" onClose={() => setModal(null)} width={640}>
          {docs.length === 0 && <div style={{ color: T.t3, fontSize: 13 }}>No documents on file.</div>}
          {docs.map((doc) => (
            <div key={doc.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.cardBorder}` }}>
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
      {modal === 'appointment' && (
        <AppointmentForm
          defaultTalent={displayName}
          historyTalentId={historyLink().talentId}
          historyAccountNumber={historyLink().accountNumber}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'task' && (
        <AddTaskModal
          defaultRelated={displayName}
          historyTalentId={historyLink().talentId}
          historyAccountNumber={historyLink().accountNumber}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'payout' && (
        <ExpenseFormModal
          clientNames={invoiceClients.map((client) => client.name)}
          talentNames={[displayName]}
          onClose={() => setModal(null)}
          onSave={(values, action) => {
            addExpenseLog({ ...values, talentName: displayName })
            if (action !== 'new') setModal(null)
          }}
        />
      )}
      {focus && (
        <PersonFocusModal
          focus={focus}
          displayName={displayName}
          email={email || prospect?.email}
          phone={phone || prospect?.phone}
          accessCode={application?.access_code}
          applicationStatus={application?.status}
          prospectStage={prospect?.stage}
          pipelineStage={pipelineTalent ? STAGE_LABELS[pipelineTalent.stage] || pipelineTalent.stage : ''}
          assignedAgent={prospect?.assignedAgentName || udf.assignedAgent}
          screeningStatus={pipelineTalent?.screening_status}
          screeningUpdatedAt={pipelineTalent?.screening_updated_at}
          bankReady={rosterTalent?.bankReady}
          taxFormsReady={rosterTalent?.taxFormsReady}
          hasRoster={Boolean(rosterTalent)}
          onClose={() => setFocus(null)}
          onSaveContact={(nextEmail, nextPhone) => {
            const person = prospect || ensureProspect()
            if (person) {
              updateProspect(person.id, {
                email: nextEmail || person.email,
                phone: nextPhone || person.phone,
                messageEmails: nextEmail ? [nextEmail] : person.messageEmails,
              })
            }
            setContactEmail(nextEmail)
            setContactPhone(nextPhone)
            setFocus(null)
          }}
          onSavePayment={(bankReady, taxFormsReady) => {
            if (rosterTalent) updateRosterTalent(rosterTalent.id, { bankReady, taxFormsReady })
            setFocus(null)
          }}
        />
      )}
      {modal === 'renew' && application && (
        <SendApplicationModal
          talent={{
            id: application.talent_id || pipelineTalent?.id || application.id,
            name: displayName,
            email: email || prospect?.email,
            phone: phone || prospect?.phone,
            first_name: String(application.data?.legal_first || prospect?.firstName || ''),
            last_name: String(application.data?.legal_last || prospect?.lastName || ''),
            dob: String(application.data?.dob || prospect?.dateOfBirth || ''),
            application_data: application.data,
          }}
          prospect={prospect}
          companyCode={companyCode || application.company_code}
          onSend={(app: Application) => handleSendApp(app, { accountNumber: accountId })}
          onClose={() => setModal(null)}
        />
      )}

      <BackToTopButton />
      <DocViewer doc={viewDoc} onClose={() => setViewDoc(null)} />
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicketId(null)}
          updateTicket={updateTicket}
          isDirector={user?.role === 'director'}
          agents={ticketAgents}
        />
      )}
    </Panel>
    </div>
    <QuickActionBar onAction={onQuickAction} />
    </div>
    {reviewingApp && (
      <ApplicationReview
        app={reviewingApp}
        talent={
          (pipelineTalent &&
          (pipelineTalent.id === reviewingApp.talent_id || pipelineTalent.application_id === reviewingApp.id)
            ? pipelineTalent
            : null) ||
          talents.find((t) => t.id === reviewingApp.talent_id || t.application_id === reviewingApp.id) ||
          null
        }
        canScore={Boolean(
          user &&
            (hasPermission(user.role, 'submit_client_packet') ||
              hasPermission(user.role, 'admin_access') ||
              user.role === 'success_manager'),
        )}
        onScore={(patch: Pick<Talent, 'pillar_scores' | 'pillar_rationales' | 'jordan_score'>) => {
          const base =
            (pipelineTalent &&
            (pipelineTalent.id === reviewingApp.talent_id || pipelineTalent.application_id === reviewingApp.id)
              ? pipelineTalent
              : null) ||
            talents.find((t) => t.id === reviewingApp.talent_id || t.application_id === reviewingApp.id)
          if (!base) return
          return updatePipelineTalent({ ...base, ...patch })
        }}
        onClose={() => setReviewingApp(null)}
        onImportToPipeline={async () => {
          const imported = await importAppToPipeline(reviewingApp)
          const account = imported?.account_number || accountId
          if (account) navigate(talentAccountPath(account))
          else if (imported) navigate('/pipeline')
        }}
      />
    )}
    </>
  )
}
