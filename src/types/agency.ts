export type TicketStatus = 'open' | 'in_progress' | 'resolved'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'partial'
export type PayoutStatus = 'pending' | 'issued' | 'completed'
export type EscrowStatus = 'pending' | 'cleared' | 'disbursed'
export type TaskStatus = 'open' | 'done'
export type ProspectStage = 'new' | 'screening' | 'interview' | 'offer' | 'signed' | 'declined'

export interface AgencyClient {
  id: string
  name: string
  type: string
  contact: string
  email: string
}

export interface AgencyTalent {
  id: string
  name: string
  role: string
  status: 'active' | 'prospect' | 'offboarding'
  niches: string[]
  bankReady: boolean
  taxFormsReady: boolean
  available: boolean
  bookedDates: string[]
}

export interface AgencyProspect {
  id: string
  name: string
  email: string
  stage: ProspectStage
  source: string
  submittedAt: string
  notes: string
}

export interface SupportTicket {
  id: string
  subject: string
  clientId: string
  clientName: string
  talentName?: string
  status: TicketStatus
  priority: 'low' | 'medium' | 'high'
  createdAt: string
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
}

export interface Appointment {
  id: string
  title: string
  withWhom: string
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

export interface ClientInvoice {
  id: string
  clientId: string
  clientName: string
  talentName: string
  project: string
  amount: number
  commissionPct: number
  status: InvoiceStatus
  issuedAt: string
  dueAt: string
  paidAt?: string
  interestApplied: number
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
