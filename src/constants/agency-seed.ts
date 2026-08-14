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

/** Scenario: Sarah (agent) · Nike (client) · Maya (talent) · $10k shoot @ 20% commission */

export const AGENCY_STAFF = {
  id: 'staff_sarah',
  name: 'Sarah Chen',
  title: 'Senior Booking Agent',
}

/** Agents who can be assigned support tickets (excludes director & ops). */
export const AGENCY_TICKET_AGENTS: { id: string; name: string; title: string }[] = [
  AGENCY_STAFF,
  { id: 'u1', name: 'Jordan Hayes', title: 'Talent Scout' },
  { id: 'u2', name: 'Marcus Bell', title: 'Team 1 Lead' },
  { id: 'u4', name: 'Devon Cruz', title: 'Team 2 Lead' },
  { id: 'u6', name: 'Alexis Grant', title: 'Success Manager' },
]

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
    accountId: 'NZG-200101',
    name: 'Maya Rivera',
    role: 'Signed Model',
    status: 'active',
    workArea: 'Modeling',
    niches: ['Commercial', 'Editorial'],
    bankReady: true,
    taxFormsReady: true,
    available: false,
    bookedDates: ['2026-08-12', '2026-08-13'],
  },
  {
    id: 'talent_leo',
    accountId: 'NZG-200102',
    name: 'Leo Park',
    role: 'Signed Model',
    status: 'active',
    workArea: 'Modeling',
    niches: ['Lifestyle', 'Fitness'],
    bankReady: true,
    taxFormsReady: true,
    available: true,
    bookedDates: [],
  },
  {
    id: 'talent_ava',
    accountId: 'NZG-200103',
    name: 'Ava Brooks',
    role: 'Signed Model',
    status: 'active',
    workArea: 'Modeling',
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
    accountId: 'NZG-200001',
    name: 'Kai Johnson',
    email: 'kai@example.com',
    workArea: 'Acting',
    stage: 'screening',
    source: 'Portal application',
    submittedAt: '2026-08-01T10:00:00Z',
    notes: 'Awaiting agent screening.',
    organization: 'NZG',
    messageEmails: ['kai@example.com'],
    assignedAgentName: 'Sarah Chen',
    contractStart: '2026-01-15',
    contractEnd: null,
  },
  {
    id: 'pros_2',
    accountId: 'NZG-200002',
    name: 'Riley Quinn',
    email: 'riley@example.com',
    workArea: 'Modeling',
    stage: 'interview',
    source: 'Scout referral',
    submittedAt: '2026-07-28T14:00:00Z',
    notes: 'Interview scheduled next week.',
    organization: 'NZG',
    messageEmails: ['riley@example.com'],
    assignedAgentName: 'Jordan Hayes',
    contractStart: '2025-08-01',
    contractEnd: '2026-07-31',
  },
  {
    id: 'pros_3',
    accountId: 'NZG-200003',
    name: 'Sam Ortiz',
    email: 'sam@example.com',
    workArea: 'Acting',
    stage: 'new',
    source: 'Open call',
    submittedAt: '2026-08-04T09:00:00Z',
    notes: 'New inbound applicant.',
    organization: 'NZG',
    messageEmails: ['sam@example.com'],
    assignedAgentName: 'Sarah Chen',
    contractStart: null,
    contractEnd: null,
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
    type: 'availability',
    priority: 'high',
    createdAt: '2026-08-05T08:15:00Z',
    dueDate: '2026-08-08',
    body: 'Nike production team needs confirmation that Maya is available for a $10,000 commercial shoot on Aug 12–13.',
    assignee: 'Sarah Chen',
  },
  {
    id: 'tkt_2',
    subject: 'Reschedule Nike briefing call',
    clientId: 'client_nike',
    clientName: 'Nike',
    talentName: 'Maya Rivera',
    status: 'in_progress',
    type: 'scheduling',
    priority: 'medium',
    createdAt: '2026-08-06T11:00:00Z',
    dueDate: '2026-08-07',
    body: 'Client asked to move the briefing from Aug 5 morning to later in the week.',
    assignee: 'Jordan Hayes',
  },
  {
    id: 'tkt_3',
    subject: 'Usage rights clarification on commercial agreement',
    clientId: 'client_nike',
    clientName: 'Nike',
    talentName: 'Maya Rivera',
    status: 'open',
    type: 'contract',
    priority: 'high',
    createdAt: '2026-08-06T15:30:00Z',
    dueDate: '2026-08-10',
    body: 'Legal wants confirmation on territory and duration for stills vs video usage.',
    assignee: 'Marcus Bell',
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

export const CHECKLIST_SEED: ChecklistItem[] = [
  { id: 'chk_1', title: 'Review Nike support ticket — confirm Maya availability', done: false },
  { id: 'chk_2', title: 'Check Appointments for Nike briefing call', done: false },
  { id: 'chk_3', title: 'Create Agency Task: send contract to Nike', done: false },
  { id: 'chk_4', title: 'Block Maya on Shared Calendar for shoot dates', done: false },
]

export const APPOINTMENTS_SEED: Appointment[] = [
  {
    id: 'appt_1',
    title: 'Nike initial briefing call',
    withWhom: 'Nike',
    clientNames: ['Nike'],
    agentNames: ['Sarah Chen'],
    talentNames: ['Maya Rivera'],
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
    taxId: '13-1234567',
    taxRatePct: 8.875,
    taxAmount: 888,
    invoiceNumber: 'INV-2026-001',
    poNumber: 'PO-NIKE-8842',
    paymentTerms: 'Net 30',
    billingAddress: 'One Bowerman Dr, Beaverton, OR 97005',
    notes: 'Commercial shoot package — tax applied at NY combined rate.',
    document: null,
  },
  {
    id: 'inv_nike_2',
    clientId: 'client_nike',
    clientName: 'Nike',
    talentName: 'Leo Park',
    project: 'Lifestyle Lookbook Day Rate',
    amount: 4500,
    commissionPct: 20,
    status: 'sent',
    issuedAt: '2026-08-10',
    dueAt: '2026-09-09',
    interestApplied: 0,
    taxId: '13-1234567',
    taxRatePct: 8.875,
    taxAmount: 399,
    invoiceNumber: 'INV-2026-002',
    poNumber: 'PO-NIKE-8843',
    paymentTerms: 'Net 30',
    billingAddress: 'One Bowerman Dr, Beaverton, OR 97005',
    notes: '',
    document: null,
  },
  {
    id: 'inv_nike_3',
    clientId: 'client_nike',
    clientName: 'Nike',
    talentName: 'Ava Brooks',
    project: 'Beauty Campaign Still Set',
    amount: 6200,
    commissionPct: 20,
    status: 'sent',
    issuedAt: '2026-08-11',
    dueAt: '2026-09-10',
    interestApplied: 0,
    taxId: '13-1234567',
    taxRatePct: 8.875,
    taxAmount: 550,
    invoiceNumber: 'INV-2026-003',
    poNumber: '',
    paymentTerms: 'Net 30',
    billingAddress: 'One Bowerman Dr, Beaverton, OR 97005',
    notes: '',
    document: null,
  },
  {
    id: 'inv_nike_4',
    clientId: 'client_nike',
    clientName: 'Nike',
    talentName: 'Maya Rivera',
    project: 'Usage Buyout — Social Cutdowns',
    amount: 2800,
    commissionPct: 20,
    status: 'sent',
    issuedAt: '2026-08-12',
    dueAt: '2026-09-11',
    interestApplied: 0,
    taxId: '13-1234567',
    taxRatePct: 0,
    taxAmount: 0,
    invoiceNumber: 'INV-2026-004',
    poNumber: 'PO-NIKE-8901',
    paymentTerms: 'Due on receipt',
    billingAddress: 'One Bowerman Dr, Beaverton, OR 97005',
    notes: 'Tax-exempt usage buyout.',
    document: null,
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
