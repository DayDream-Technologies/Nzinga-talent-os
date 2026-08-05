/** Full-menu + sidebar information architecture for agency operations. */

export interface AgencyNavItem {
  id: string
  label: string
  path: string
}

export interface AgencyNavGroup {
  label: string
  items: AgencyNavItem[]
}

export interface AgencyNavCategory {
  id: string
  label: string
  groups: AgencyNavGroup[]
}

export const AGENCY_NAV: AgencyNavCategory[] = [
  {
    id: 'talent',
    label: 'Talent Info',
    groups: [
      {
        label: 'Talent Info',
        items: [
          { id: 'prospects', label: 'Prospects', path: 'prospects' },
          { id: 'renewal-offers', label: 'Create Renewal Offers', path: 'renewal-offers' },
          { id: 'active-roster', label: 'Active Roster', path: 'active-roster' },
          { id: 'prospect-tracking', label: 'Prospect Tracking Board', path: 'prospect-tracking' },
        ],
      },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    groups: [
      {
        label: 'Communication',
        items: [
          { id: 'send-email', label: 'Send Email', path: 'send-email' },
          { id: 'messaging', label: 'Text Messaging Center', path: 'messaging' },
        ],
      },
    ],
  },
  {
    id: 'services',
    label: 'Client Services',
    groups: [
      {
        label: 'Client Services',
        items: [
          { id: 'support-tickets', label: 'Support Tickets', path: 'support-tickets' },
          { id: 'agency-tasks', label: 'Agency Tasks', path: 'agency-tasks' },
          { id: 'appointments', label: 'Appointments & Meetings', path: 'appointments' },
          { id: 'new-ticket', label: 'New Tickets', path: 'new-ticket' },
          { id: 'calendar', label: 'Calendar', path: 'calendar' },
        ],
      },
    ],
  },
  {
    id: 'accounting',
    label: 'Accounting',
    groups: [
      {
        label: 'Accounting',
        items: [
          { id: 'escrow-deposit', label: 'Record Escrow / Deposit', path: 'escrow-deposit' },
        ],
      },
      {
        label: 'Receivables',
        items: [
          { id: 'client-invoices', label: 'Client Invoices', path: 'client-invoices' },
          { id: 'post-retainers', label: 'Post Recurring Retainers', path: 'post-retainers' },
          { id: 'overdue-interest', label: 'Post Overdue Interest', path: 'overdue-interest' },
          { id: 'batch-receipts', label: 'Batch Client Receipts', path: 'batch-receipts' },
          { id: 'retainer-plans', label: 'Manage Retainer Plans', path: 'retainer-plans' },
        ],
      },
      {
        label: 'Payables',
        items: [
          { id: 'log-expense', label: 'Log Expense / Payout', path: 'log-expense' },
          { id: 'vendors', label: 'Vendors & Service Providers', path: 'vendors' },
          { id: 'disbursements', label: 'Disbursements / Payouts', path: 'disbursements' },
          { id: 'issue-payouts', label: 'Issue Talent Payouts', path: 'issue-payouts' },
        ],
      },
    ],
  },
  {
    id: 'reports',
    label: 'My Reports',
    groups: [
      {
        label: 'Roster & Booking Reports',
        items: [
          { id: 'report-roster-scorecard', label: 'Roster Performance Scorecard', path: 'report-roster-scorecard' },
          { id: 'report-applicant-pool', label: 'Applicant Pool & Pipeline Log', path: 'report-applicant-pool' },
          { id: 'report-escrow-balances', label: 'Escrow & Deposit Balances', path: 'report-escrow-balances' },
          { id: 'report-onboarding', label: 'Onboarding & Offboarding', path: 'report-onboarding' },
          { id: 'report-roster-openings', label: 'Roster Openings & Availability', path: 'report-roster-openings' },
        ],
      },
      {
        label: 'Receivables & Commissions',
        items: [
          { id: 'report-gross-bookings', label: 'Gross Bookings & Commission Summary', path: 'report-gross-bookings' },
          { id: 'report-ar-aging', label: 'Aged Client Invoices (AR Aging)', path: 'report-ar-aging' },
          { id: 'report-overdue-accounts', label: 'Overdue Client Accounts', path: 'report-overdue-accounts' },
        ],
      },
      {
        label: 'Payables & Talent Disbursals',
        items: [
          { id: 'report-pending-payouts', label: 'Pending Talent Payouts (AP Aging)', path: 'report-pending-payouts' },
        ],
      },
    ],
  },
]

/** Flat lookup: path → title */
export const AGENCY_PAGE_TITLES: Record<string, string> = Object.fromEntries(
  AGENCY_NAV.flatMap((cat) =>
    cat.groups.flatMap((g) => g.items.map((i) => [i.path, i.label] as const)),
  ).concat([['workspace', 'My Workspace']]),
)

/** Sidebar quick links (primary daily ops). */
export const AGENCY_SIDEBAR: { label: string; items: AgencyNavItem[] }[] = [
  {
    label: 'WORKSPACE',
    items: [{ id: 'workspace', label: 'My Workspace', path: 'workspace' }],
  },
  {
    label: 'TALENT INFO',
    items: [
      { id: 'prospects', label: 'Prospects', path: 'prospects' },
      { id: 'active-roster', label: 'Active Roster', path: 'active-roster' },
      { id: 'prospect-tracking', label: 'Tracking Board', path: 'prospect-tracking' },
    ],
  },
  {
    label: 'CLIENT SERVICES',
    items: [
      { id: 'support-tickets', label: 'Support Tickets', path: 'support-tickets' },
      { id: 'agency-tasks', label: 'Agency Tasks', path: 'agency-tasks' },
      { id: 'appointments', label: 'Appointments', path: 'appointments' },
      { id: 'calendar', label: 'Calendar', path: 'calendar' },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { id: 'client-invoices', label: 'Client Invoices', path: 'client-invoices' },
      { id: 'escrow-deposit', label: 'Escrow / Deposit', path: 'escrow-deposit' },
      { id: 'issue-payouts', label: 'Issue Payouts', path: 'issue-payouts' },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { id: 'report-roster-scorecard', label: 'Roster Scorecard', path: 'report-roster-scorecard' },
      { id: 'report-gross-bookings', label: 'Gross Bookings', path: 'report-gross-bookings' },
      { id: 'report-pending-payouts', label: 'Pending Payouts', path: 'report-pending-payouts' },
    ],
  },
]
