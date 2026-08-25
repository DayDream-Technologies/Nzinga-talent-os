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
    items.push({
      id: event.id,
      date: event.date,
      title: event.title,
      kind: event.type === 'booking' ? 'Shoot' : event.type === 'meeting' ? 'Meeting' : 'Blocked',
      detail: event.clientName,
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

export type TalentPayoutRequest = Pick<Disbursement, 'payee' | 'amount' | 'method' | 'project'>
export type TalentExpenseRow = ExpensePayoutLog
