import { AGENCY_STAFF } from '@/constants/agency-seed'
import { DEMO_TALENT_LOGIN } from '@/constants/demo-talent'
import type {
  AgencyProspect,
  AgencyTalent,
  Appointment,
  CalendarEvent,
  ClientInvoice,
  Disbursement,
  EscrowDeposit,
  ExpensePayoutLog,
  SupportTicket,
} from '@/types/agency'
import type { ProspectProfile, Talent, UploadedDoc } from '@/types'

export const TALENT_PORTAL_PATHS = [
  '/talent/login',
  '/talent/home',
  '/talent/activity',
  '/talent/money',
  '/talent/files',
  '/talent/messages',
  '/talent/settings',
] as const

export function isTalentPortalPath(pathname: string): boolean {
  return (TALENT_PORTAL_PATHS as readonly string[]).includes(pathname)
}

export function namesMatch(a?: string | null, b?: string | null): boolean {
  return Boolean(a?.trim()) && a!.trim().toLowerCase() === b?.trim().toLowerCase()
}

export function matchTalentRecords(opts: {
  profile: ProspectProfile
  talent: Talent
  prospects: AgencyProspect[]
  roster: AgencyTalent[]
}): { prospect: AgencyProspect | null; rosterTalent: AgencyTalent | null; displayName: string } {
  const email = opts.profile.email.toLowerCase()
  const accountId = opts.talent.account_number
  const rosterTalent =
    opts.roster.find(
      (item) =>
        (item.email || '').toLowerCase() === email ||
        (accountId && item.accountId === accountId) ||
        namesMatch(item.name, opts.talent.name),
    ) ?? null
  const prospect =
    opts.prospects.find((p) => p.email.toLowerCase() === email) ??
    opts.prospects.find((p) => Boolean(accountId) && p.accountId === accountId) ??
    opts.prospects.find((p) => p.id === rosterTalent?.linkedProspectId) ??
    opts.prospects.find((p) => namesMatch(p.name, opts.talent.name)) ??
    null
  return {
    prospect,
    rosterTalent,
    displayName: rosterTalent?.name || prospect?.name || opts.talent.name || opts.profile.name,
  }
}

export function belongingToTalent<T>(rows: T[], name: string, pick: (row: T) => Array<string | undefined | null>): T[] {
  return rows.filter((row) => pick(row).some((value) => namesMatch(value, name)))
}

export function invoiceCommission(inv: ClientInvoice): { commission: number; talentShare: number; gross: number } {
  const gross = (inv.amount || 0) + (inv.taxAmount || 0)
  const commission = Math.round((inv.amount || 0) * ((inv.commissionPct || 0) / 100))
  return { gross, commission, talentShare: (inv.amount || 0) - commission }
}

export function formatMoney(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export function agentContact(prospect: AgencyProspect | null): { name: string; email: string } {
  const name = prospect?.assignedAgentName || DEMO_TALENT_LOGIN.agentName
  const email =
    (name === AGENCY_STAFF.name ? AGENCY_STAFF.email : undefined) || DEMO_TALENT_LOGIN.agentEmail
  return { name, email }
}

export function agentMailto(opts: { agentName: string; agentEmail: string; talentName: string; subject?: string }): string {
  const subject = opts.subject || `Message from ${opts.talentName}`
  const body = `Hi ${opts.agentName},\n\n`
  return `mailto:${opts.agentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function talentCalendarItems(opts: {
  name: string
  calendar: CalendarEvent[]
  appointments: Appointment[]
  invoices: ClientInvoice[]
  bookedDates: string[]
}): Array<{ id: string; date: string; title: string; kind: string; detail?: string }> {
  const items: Array<{ id: string; date: string; title: string; kind: string; detail?: string }> = []
  for (const event of belongingToTalent(opts.calendar, opts.name, (e) => [e.talentName])) {
    const call = event.callTime ? `Call ${formatCallTime(event.callTime)}` : ''
    items.push({
      id: event.id,
      date: event.date,
      title: event.title,
      kind: event.type === 'booking' ? 'Shoot' : event.type === 'meeting' ? 'Meeting' : 'Blocked',
      detail: [event.clientName, call].filter(Boolean).join(' · ') || undefined,
    })
  }
  for (const appt of belongingToTalent(opts.appointments, opts.name, (a) => a.talentNames)) {
    items.push({
      id: appt.id,
      date: appt.startsAt.slice(0, 10),
      title: appt.title,
      kind: 'Meeting',
      detail: appt.location,
    })
  }
  for (const inv of belongingToTalent(opts.invoices, opts.name, (i) => [i.talentName])) {
    if (inv.status === 'paid') continue
    items.push({
      id: `due_${inv.id}`,
      date: inv.dueAt,
      title: `Invoice due · ${inv.project}`,
      kind: 'Deadline',
      detail: inv.invoiceNumber,
    })
  }
  for (const date of opts.bookedDates) {
    if (items.some((item) => item.date === date && item.kind === 'Shoot')) continue
    items.push({ id: `block_${date}`, date, title: 'Blocked / booked', kind: 'Blocked' })
  }
  return items.sort((a, b) => a.date.localeCompare(b.date))
}

export function trustBalance(escrow: EscrowDeposit[], name: string): number {
  return belongingToTalent(escrow, name, (e) => [e.talentName]).reduce((sum, row) => {
    if (row.status === 'disbursed') return sum
    return sum + (row.amount || 0)
  }, 0)
}

export function collectPortalFiles(opts: {
  contracts: Array<{ id: string; title: string; document: { name: string; data: string; type: string } }>
  uploadedDocs: Record<string, UploadedDoc | null | undefined>
  profilePhoto: UploadedDoc | null
  portalAssets: UploadedDoc[]
}): Array<{ id: string; label: string; group: string; doc: UploadedDoc }> {
  const files: Array<{ id: string; label: string; group: string; doc: UploadedDoc }> = []
  for (const c of opts.contracts) {
    files.push({
      id: c.id,
      label: c.title,
      group: 'Contracts & agreements',
      doc: { name: c.document.name, data: c.document.data, type: c.document.type },
    })
  }
  if (opts.profilePhoto) {
    files.push({ id: 'profile_photo', label: 'Profile photo', group: 'Photos, videos & assets', doc: opts.profilePhoto })
  }
  for (const [key, doc] of Object.entries(opts.uploadedDocs || {})) {
    if (!doc) continue
    files.push({ id: key, label: doc.name || key, group: 'Agency-uploaded materials', doc })
  }
  opts.portalAssets.forEach((doc, i) => {
    files.push({
      id: `asset_${i}_${doc.name}`,
      label: doc.name,
      group: doc.type?.startsWith('image/') || doc.doc_type === 'lookbook' ? 'Photos, videos & assets' : 'Agency-uploaded materials',
      doc,
    })
  })
  return files
}

export function opportunityStatusLabel(status: SupportTicket['status']): string {
  if (status === 'open') return 'Submitted'
  if (status === 'in_progress') return 'In review'
  if (status === 'resolved') return 'Confirmed'
  return 'Closed'
}

export type OpportunityDecision = 'confirm' | 'decline'

export function isTalentOpportunity(ticket: SupportTicket): boolean {
  return ticket.type === 'availability' || ticket.type === 'scheduling'
}

export function canRespondToOpportunity(ticket: SupportTicket): boolean {
  return isTalentOpportunity(ticket) && (ticket.status === 'open' || ticket.status === 'in_progress')
}

export function opportunityDecisionPatch(
  ticket: SupportTicket,
  decision: OpportunityDecision,
  at = new Date().toISOString(),
): Partial<SupportTicket> {
  const stamp = at.slice(0, 10)
  const line = decision === 'confirm' ? `\n\nTalent confirmed on ${stamp}.` : `\n\nTalent declined on ${stamp}.`
  const alreadyNoted = /Talent (confirmed|declined) on /.test(ticket.body)
  return {
    status: decision === 'confirm' ? 'resolved' : 'closed',
    talentDecision: decision === 'confirm' ? 'confirmed' : 'declined',
    body: alreadyNoted ? ticket.body : `${ticket.body}${line}`,
  }
}

export function formatCallTime(callTime?: string): string {
  if (!callTime) return ''
  const [hStr, mStr = '00'] = callTime.split(':')
  const hour24 = Number(hStr)
  if (!Number.isFinite(hour24)) return callTime
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour = ((hour24 + 11) % 12) + 1
  return `${hour}:${String(mStr).padStart(2, '0')} ${suffix}`
}

const USAGE_RE = /usage|buyout|rights/i

export type UsageRightsItem = {
  id: string
  source: 'contract' | 'invoice' | 'roster'
  title: string
  detail: string
  date: string
}

export function usageRightsTimeline(opts: {
  name: string
  tickets: SupportTicket[]
  invoices: ClientInvoice[]
  usageRights?: string
}): UsageRightsItem[] {
  const items: UsageRightsItem[] = []
  for (const ticket of belongingToTalent(opts.tickets, opts.name, (t) => [t.talentName])) {
    if (ticket.type === 'contract' || USAGE_RE.test(ticket.subject) || USAGE_RE.test(ticket.body)) {
      items.push({
        id: ticket.id,
        source: 'contract',
        title: ticket.subject,
        detail: ticket.body,
        date: ticket.createdAt.slice(0, 10),
      })
    }
  }
  for (const inv of belongingToTalent(opts.invoices, opts.name, (i) => [i.talentName])) {
    if (USAGE_RE.test(inv.project) || USAGE_RE.test(inv.notes || '')) {
      items.push({
        id: inv.id,
        source: 'invoice',
        title: inv.project,
        detail: `${inv.invoiceNumber || inv.id} · ${inv.status}${inv.paidAt ? ` · paid ${inv.paidAt}` : ''}`,
        date: inv.paidAt || inv.issuedAt,
      })
    }
  }
  if (opts.usageRights?.trim()) {
    items.push({
      id: 'udf_usage',
      source: 'roster',
      title: 'Roster usage-rights notes',
      detail: opts.usageRights.trim(),
      date: '',
    })
  }
  return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

export function invoiceCalendarYear(inv: ClientInvoice): string {
  return (inv.paidAt || inv.issuedAt || '').slice(0, 4)
}

export function paidEarningsForYear(invoices: ClientInvoice[], name: string, year: string): ClientInvoice[] {
  return belongingToTalent(invoices, name, (i) => [i.talentName]).filter(
    (inv) => inv.status === 'paid' && invoiceCalendarYear(inv) === year,
  )
}

export function csvCell(value: string | number): string {
  const text = String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function yearEnd1099Csv(invoices: ClientInvoice[], name: string, year: string): string {
  const rows = paidEarningsForYear(invoices, name, year)
  const header = 'Booking,Client,Invoice,Paid date,Gross,Commission,Talent share'
  const lines = rows.map((inv) => {
    const split = invoiceCommission(inv)
    return [
      csvCell(inv.project),
      csvCell(inv.clientName),
      csvCell(inv.invoiceNumber || inv.id),
      csvCell(inv.paidAt || inv.issuedAt),
      csvCell(split.gross),
      csvCell(split.commission),
      csvCell(split.talentShare),
    ].join(',')
  })
  const totals = rows.reduce(
    (acc, inv) => {
      const split = invoiceCommission(inv)
      acc.gross += split.gross
      acc.commission += split.commission
      acc.talentShare += split.talentShare
      return acc
    },
    { gross: 0, commission: 0, talentShare: 0 },
  )
  const totalLine = ['Total', '', '', '', csvCell(totals.gross), csvCell(totals.commission), csvCell(totals.talentShare)].join(',')
  return [header, ...lines, totalLine].join('\n')
}

export function downloadTextFile(filename: string, contents: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([contents], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export type TalentPayoutRequest = Pick<Disbursement, 'payee' | 'amount' | 'method' | 'project'>
export type TalentExpenseRow = ExpensePayoutLog
