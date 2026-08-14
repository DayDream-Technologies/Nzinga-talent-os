export type TicketStatus = 'open' | 'in_progress' | 'closed' | 'resolved'
export type TicketType = 'availability' | 'scheduling' | 'contract' | 'billing' | 'general'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'partial'
export type PayoutStatus = 'pending' | 'issued' | 'completed'
export type EscrowStatus = 'pending' | 'cleared' | 'disbursed'
export type TaskStatus = 'open' | 'done'
export type ProspectStage = 'new' | 'screening' | 'interview' | 'offer' | 'signed' | 'declined'
/** Roster/talent niches (legacy + extended). */
export type WorkArea =
  | 'Acting'
  | 'Modeling'
  | 'Voiceover'
  | 'Influencer'
  | 'Influencing'
  | 'Commercial'
  | 'Sports'
  | 'Music'
/** Divisions selectable when creating a prospect. */
export type ProspectDivision = 'Modeling' | 'Influencing' | 'Sports' | 'Music'
export type PreferredContactMethod = 'call' | 'text' | 'email'
export type RepresentationType = 'exclusive' | 'nonexclusive'
export type TermLengthYears = 1 | 2

export interface AgencyClient {
  id: string
  name: string
  type: string
  contact: string
  email: string
}

export interface AgencyTalent {
  id: string
  accountId: string
  name: string
  role: string
  status: 'active' | 'prospect' | 'offboarding'
  workArea: WorkArea
  niches: string[]
  bankReady: boolean
  taxFormsReady: boolean
  available: boolean
  bookedDates: string[]
}

export interface AgencyProspect {
  id: string
  accountId: string
  name: string
  email: string
  /** Tiered division (Modeling / Influencing / Sports / Music). Legacy seed may use other WorkArea values. */
  workArea: WorkArea
  stage: ProspectStage
  source: string
  submittedAt: string
  notes: string
  /** Company code: NZG | NZINGA | TCG */
  organization: string
  dateOfBirth?: string
  interestLevel?: number
  preferredContact?: PreferredContactMethod
  representationType?: RepresentationType
  termLengthYears?: TermLengthYears
  assignedAgentId?: string
  assignedAgentName?: string
  createdById?: string
  createdByName?: string
  /** True when DOB indicates under 18 */
  isMinor?: boolean
  parentName?: string
  parentEmail?: string
  parentPhone?: string
  /** Emails that should receive account messages (prospect + parent if minor) */
  messageEmails: string[]
  /** ISO date (YYYY-MM-DD). Empty when no representation contract exists yet. */
  contractStart?: string | null
  /** ISO date (YYYY-MM-DD). Empty/null means open-ended / still live. */
  contractEnd?: string | null
}

export interface SupportTicket {
  id: string
  subject: string
  clientId: string
  clientName: string
  talentName?: string
  status: TicketStatus
  type: TicketType
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  /** ISO date (YYYY-MM-DD) */
  dueDate: string
  body: string
  assignee: string
}

export interface AgencyTask {
  id: string
  title: string
  assignee: string
  due: string
  status: TaskStatus
  relatedClient?: string
  completedBy?: string
  completedAt?: string
}

export interface ChecklistItem {
  id: string
  title: string
  done: boolean
}

export interface Appointment {
  id: string
  title: string
  /** Display / legacy single-party label (often clients joined). */
  withWhom: string
  clientNames: string[]
  agentNames: string[]
  talentNames: string[]
  startsAt: string
  endsAt: string
  location: string
  notes: string
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  talentName?: string
  clientName?: string
  type: 'booking' | 'meeting' | 'block'
}

export interface InvoiceDocument {
  name: string
  data: string
  type: string
}

export interface ClientInvoice {
  id: string
  clientId: string
  clientName: string
  talentName: string
  project: string
  /** Line / subtotal amount before tax */
  amount: number
  commissionPct: number
  status: InvoiceStatus
  issuedAt: string
  dueAt: string
  paidAt?: string
  interestApplied: number
  /** Client or agency tax ID / EIN */
  taxId: string
  /** Sales tax / VAT rate percent */
  taxRatePct: number
  /** Computed tax on amount (stored for display) */
  taxAmount: number
  invoiceNumber?: string
  poNumber?: string
  paymentTerms?: string
  billingAddress?: string
  notes?: string
  document?: InvoiceDocument | null
}

export interface RetainerPlan {
  id: string
  clientId: string
  clientName: string
  monthlyAmount: number
  dayOfMonth: number
  active: boolean
  description: string
}

export interface EscrowDeposit {
  id: string
  clientName: string
  project: string
  amount: number
  receivedAt: string
  status: EscrowStatus
  invoiceId?: string
  notes: string
}

export interface ExpensePayoutLog {
  id: string
  project: string
  clientName: string
  talentName: string
  gross: number
  agencyCommission: number
  talentShare: number
  status: PayoutStatus
  loggedAt: string
}

export interface Vendor {
  id: string
  name: string
  type: 'talent' | 'vendor' | 'service'
  bankLast4: string
  taxFormsReady: boolean
  email: string
}

export interface Disbursement {
  id: string
  payee: string
  amount: number
  method: string
  status: PayoutStatus
  paidAt?: string
  project: string
}

export interface MessageThread {
  id: string
  channel: 'email' | 'sms'
  to: string
  subject: string
  preview: string
  sentAt: string
  status: 'draft' | 'sent' | 'delivered'
}
