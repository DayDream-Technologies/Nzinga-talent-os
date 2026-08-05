import type {
  AgencyClient,
  AgencyProspect,
  AgencyTalent,
  AgencyTask,
  Appointment,
  CalendarEvent,
  ClientInvoice,
  Disbursement,
  EscrowDeposit,
  ExpensePayoutLog,
  MessageThread,
  RetainerPlan,
  SupportTicket,
  Vendor,
} from '@/types/agency'

/** Scenario: Sarah (agent) · Nike (client) · Maya (talent) · $10k shoot @ 20% commission */

export const AGENCY_STAFF = {
  id: 'staff_sarah',
  name: 'Sarah Chen',
  title: 'Senior Booking Agent',
}

export const AGENCY_CLIENTS_SEED: AgencyClient[] = [
  {
    id: 'client_nike',
    name: 'Nike',
    type: 'Production Brand',
    contact: 'Jordan Hale — Production',
    email: 'production@nike.example',
  },
]

export const AGENCY_TALENT_SEED: AgencyTalent[] = [
  {
    id: 'talent_maya',
    name: 'Maya Rivera',
    role: 'Signed Model',
    status: 'active',
    niches: ['Commercial', 'Editorial'],
    bankReady: true,
    taxFormsReady: true,
    available: false,
    bookedDates: ['2026-08-12', '2026-08-13'],
  },
  {
    id: 'talent_leo',
    name: 'Leo Park',
    role: 'Signed Model',
    status: 'active',
    niches: ['Lifestyle', 'Fitness'],
    bankReady: true,
    taxFormsReady: true,
    available: true,
    bookedDates: [],
  },
  {
    id: 'talent_ava',
    name: 'Ava Brooks',
    role: 'Signed Model',
    status: 'active',
    niches: ['Beauty', 'Runway'],
    bankReady: false,
    taxFormsReady: true,
    available: true,
    bookedDates: [],
  },
]

export const AGENCY_PROSPECTS_SEED: AgencyProspect[] = [
  {
    id: 'pros_1',
    name: 'Kai Johnson',
    email: 'kai@example.com',
    stage: 'screening',
    source: 'Portal application',
    submittedAt: '2026-08-01T10:00:00Z',
    notes: 'Awaiting agent screening.',
  },
  {
    id: 'pros_2',
    name: 'Riley Quinn',
    email: 'riley@example.com',
    stage: 'interview',
    source: 'Scout referral',
    submittedAt: '2026-07-28T14:00:00Z',
    notes: 'Interview scheduled next week.',
  },
  {
    id: 'pros_3',
    name: 'Sam Ortiz',
    email: 'sam@example.com',
    stage: 'new',
    source: 'Open call',
    submittedAt: '2026-08-04T09:00:00Z',
    notes: 'New inbound applicant.',
  },
]

export const SUPPORT_TICKETS_SEED: SupportTicket[] = [
  {
    id: 'tkt_1',
    subject: 'Confirm Maya availability — commercial shoot',
    clientId: 'client_nike',
    clientName: 'Nike',
    talentName: 'Maya Rivera',
    status: 'open',
    priority: 'high',
    createdAt: '2026-08-05T08:15:00Z',
    body: 'Nike production team needs confirmation that Maya is available for a $10,000 commercial shoot on Aug 12–13.',
    assignee: 'Sarah Chen',
  },
]

export const AGENCY_TASKS_SEED: AgencyTask[] = [
  {
    id: 'task_1',
    title: 'Send contract agreement to Nike production team',
    assignee: 'Sarah Chen',
    due: '2026-08-06',
    status: 'open',
    relatedClient: 'Nike',
  },
]

export const APPOINTMENTS_SEED: Appointment[] = [
  {
    id: 'appt_1',
    title: 'Nike initial briefing call',
    withWhom: 'Nike Production — Jordan Hale',
    startsAt: '2026-08-05T10:00:00Z',
    endsAt: '2026-08-05T10:30:00Z',
    location: 'Zoom',
    notes: 'Discuss Maya commercial shoot scope and usage.',
  },
]

export const CALENDAR_EVENTS_SEED: CalendarEvent[] = [
  {
    id: 'cal_1',
    title: 'Nike briefing call',
    date: '2026-08-05',
    clientName: 'Nike',
    type: 'meeting',
  },
  {
    id: 'cal_2',
    title: 'Maya — Nike Commercial Shoot',
    date: '2026-08-12',
    talentName: 'Maya Rivera',
    clientName: 'Nike',
    type: 'booking',
  },
  {
    id: 'cal_3',
    title: 'Maya — Nike Commercial Shoot',
    date: '2026-08-13',
    talentName: 'Maya Rivera',
    clientName: 'Nike',
    type: 'booking',
  },
]

export const INVOICES_SEED: ClientInvoice[] = [
  {
    id: 'inv_nike_1',
    clientId: 'client_nike',
    clientName: 'Nike',
    talentName: 'Maya Rivera',
    project: '$10,000 Commercial Shoot',
    amount: 10000,
    commissionPct: 20,
    status: 'sent',
    issuedAt: '2026-08-14',
    dueAt: '2026-09-13',
    interestApplied: 0,
  },
]

export const RETAINER_PLANS_SEED: RetainerPlan[] = []

export const ESCROW_SEED: EscrowDeposit[] = []

export const EXPENSE_LOGS_SEED: ExpensePayoutLog[] = []

export const VENDORS_SEED: Vendor[] = [
  {
    id: 'ven_maya',
    name: 'Maya Rivera',
    type: 'talent',
    bankLast4: '4821',
    taxFormsReady: true,
    email: 'maya@example.com',
  },
  {
    id: 'ven_studio',
    name: 'Northlight Studios',
    type: 'service',
    bankLast4: '1190',
    taxFormsReady: true,
    email: 'billing@northlight.example',
  },
]

export const DISBURSEMENTS_SEED: Disbursement[] = []

export const MESSAGES_SEED: MessageThread[] = [
  {
    id: 'msg_1',
    channel: 'email',
    to: 'production@nike.example',
    subject: 'Maya availability confirmation',
    preview: 'Confirming Maya Rivera for Aug 12–13 commercial…',
    sentAt: '2026-08-05T09:00:00Z',
    status: 'sent',
  },
]

export const PROJECT_SCENARIO = {
  name: '$10,000 Commercial Shoot',
  client: 'Nike',
  talent: 'Maya Rivera',
  gross: 10000,
  commissionPct: 20,
  agencyShare: 2000,
  talentShare: 8000,
}
