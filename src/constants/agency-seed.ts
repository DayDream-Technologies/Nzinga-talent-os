import type {
  AgencyClient,
  AgencyProspect,
  AgencyTalent,
  AgencyTask,
  Appointment,
  CalendarEvent,
  ChecklistItem,
  ClientInvoice,
  Disbursement,
  EscrowDeposit,
  ExpensePayoutLog,
  MessageThread,
  RetainerPlan,
  SupportTicket,
  Vendor,
} from '@/types/agency'

/** Placeholder so older imports keep a shape. Live staff come from the users table. */
export const AGENCY_STAFF = {
  id: '',
  name: '',
  title: '',
  email: '',
}

export const AGENCY_TICKET_AGENTS: { id: string; name: string; title: string }[] = []

export const AGENCY_CLIENTS_SEED: AgencyClient[] = []
export const AGENCY_TALENT_SEED: AgencyTalent[] = []
export const AGENCY_PROSPECTS_SEED: AgencyProspect[] = []
export const SUPPORT_TICKETS_SEED: SupportTicket[] = []
export const AGENCY_TASKS_SEED: AgencyTask[] = []
export const CHECKLIST_SEED: ChecklistItem[] = []
export const APPOINTMENTS_SEED: Appointment[] = []
export const CALENDAR_EVENTS_SEED: CalendarEvent[] = []
export const INVOICES_SEED: ClientInvoice[] = []
export const RETAINER_PLANS_SEED: RetainerPlan[] = []
export const ESCROW_SEED: EscrowDeposit[] = []
export const EXPENSE_LOGS_SEED: ExpensePayoutLog[] = []
export const VENDORS_SEED: Vendor[] = []
export const DISBURSEMENTS_SEED: Disbursement[] = []
export const MESSAGES_SEED: MessageThread[] = []
