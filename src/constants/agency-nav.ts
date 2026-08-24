/** Full-menu + sidebar information architecture for agency operations. */

import type { Role } from '@/types'

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
          { id: 'applications', label: 'Applications', path: 'applications' },
          { id: 'renewal-offers', label: 'Create Renewal Offers', path: 'renewal-offers' },
          { id: 'clients', label: 'Clients', path: 'clients' },
          { id: 'active-roster', label: 'Clients', path: 'active-roster' },
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
  {
    id: 'admin',
    label: 'Admin',
    groups: [
      {
        label: 'Admin',
        items: [
          { id: 'admin-users', label: 'Team Users', path: 'admin/users' },
          { id: 'admin-invite', label: 'Invite Team Member', path: 'admin/invite' },
          { id: 'admin-roles', label: 'Roles', path: 'admin/roles' },
          { id: 'admin-audit', label: 'Audit Log', path: 'admin/audit-log' },
          { id: 'admin-settings', label: 'System Settings', path: 'admin/settings' },
          { id: 'settings', label: 'My Settings', path: 'settings' },
        ],
      },
    ],
  },
]

/** Agent (scout / team leads): talent ops + roster/applicant reports */
const AGENT_PATHS = [
  'prospects',
  'applications',
  'renewal-offers',
  'clients',
  'active-roster',
  'pipeline',
  'prospect-tracking',
  'send-email',
  'messaging',
  'support-tickets',
  'agency-tasks',
  'appointments',
  'new-ticket',
  'calendar',
  'settings',
  'report-roster-scorecard',
  'report-applicant-pool',
  'report-onboarding',
  'report-roster-openings',
  'reports',
] as const

/** Account manager (ops): finance modules + AR/AP/escrow reports */
const ACCOUNT_MANAGER_PATHS = [
  'escrow-deposit',
  'client-invoices',
  'post-retainers',
  'overdue-interest',
  'batch-receipts',
  'retainer-plans',
  'log-expense',
  'vendors',
  'disbursements',
  'issue-payouts',
  'settings',
  'report-escrow-balances',
  'report-gross-bookings',
  'report-ar-aging',
  'report-overdue-accounts',
  'report-pending-payouts',
  'reports',
] as const

const ALL_MODULE_PATHS = [
  ...new Set([...AGENT_PATHS, ...ACCOUNT_MANAGER_PATHS]),
]

/** Allowed agency paths per role. `workspace` is always allowed separately. */
export const AGENCY_MODULE_ACCESS: Record<Role, readonly string[]> = {
  scout: AGENT_PATHS,
  team1_lead: AGENT_PATHS,
  team2_lead: AGENT_PATHS,
  ops_specialist: ACCOUNT_MANAGER_PATHS,
  success_manager: ALL_MODULE_PATHS,
  director: ALL_MODULE_PATHS,
}

export function canAccessAgencyPath(role: Role, path: string): boolean {
  const normalized = path.replace(/^\//, '').split('?')[0]
  if (!normalized || normalized === 'workspace') return true
  if (normalized === 'settings') return true
  if (normalized === 'talent' || normalized.startsWith('talent/')) return true
  if (normalized === 'applications' || normalized.startsWith('applications/')) {
    return (AGENCY_MODULE_ACCESS[role] || []).includes('applications')
  }
  // Nested admin routes remain director-only (handled elsewhere); deny here for agency gate
  if (normalized.startsWith('admin')) return role === 'director'
  // Legacy roster → clients
  if (normalized === 'roster') return canAccessAgencyPath(role, 'clients')
  return (AGENCY_MODULE_ACCESS[role] || []).includes(normalized)
}

export function filterAgencyNav(role: Role): AgencyNavCategory[] {
  return AGENCY_NAV.map((cat) => ({
    ...cat,
    groups: cat.groups
      .map((g) => ({
        ...g,
        // Prefer /clients label; hide duplicate active-roster nav item
        items: g.items
          .filter((item) => item.path !== 'active-roster')
          .filter((item) => {
            if (cat.id === 'admin' && item.path.startsWith('admin')) return role === 'director'
            if (cat.id === 'admin' && item.path === 'settings') return true
            return canAccessAgencyPath(role, item.path)
          }),
      }))
      .filter((g) => g.items.length > 0),
  })).filter((cat) => {
    if (cat.id === 'admin') return role === 'director' || cat.groups.some((g) => g.items.some((i) => i.path === 'settings'))
    return cat.groups.length > 0
  })
}

/** Flat lookup: path → title */
export const AGENCY_PAGE_TITLES: Record<string, string> = Object.fromEntries(
  AGENCY_NAV.flatMap((cat) =>
    cat.groups.flatMap((g) => g.items.map((i) => [i.path, i.label] as const)),
  ).concat([
    ['workspace', 'My Workspace'],
    ['reports', 'My Reports'],
    ['clients', 'Clients'],
    ['active-roster', 'Clients'],
    ['settings', 'Settings'],
    ['admin/users', 'Team Users'],
    ['admin/roles', 'Role Management'],
    ['admin/audit-log', 'Audit Log'],
    ['admin/settings', 'System Settings'],
    ['admin/invite', 'Invite Team Member'],
  ]),
)

/** Sidebar quick links (primary daily ops) — kept for reference; shell hides sidebar. */
export const AGENCY_SIDEBAR: { label: string; items: AgencyNavItem[] }[] = [
  {
    label: 'WORKSPACE',
    items: [{ id: 'workspace', label: 'My Workspace', path: 'workspace' }],
  },
  {
    label: 'TALENT INFO',
    items: [
      { id: 'prospects', label: 'Prospects', path: 'prospects' },
      { id: 'applications', label: 'Applications', path: 'applications' },
      { id: 'clients', label: 'Clients', path: 'clients' },
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
      { id: 'reports', label: 'My Reports', path: 'reports' },
      { id: 'report-roster-scorecard', label: 'Roster Scorecard', path: 'report-roster-scorecard' },
      { id: 'report-gross-bookings', label: 'Gross Bookings', path: 'report-gross-bookings' },
      { id: 'report-pending-payouts', label: 'Pending Payouts', path: 'report-pending-payouts' },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { id: 'admin-invite', label: 'Invite Team Member', path: 'admin/invite' },
      { id: 'admin-users', label: 'Team Users', path: 'admin/users' },
      { id: 'settings', label: 'Settings', path: 'settings' },
    ],
  },
]

export function filterAgencySidebar(
  role: Role,
  sections: { label: string; items: AgencyNavItem[] }[] = AGENCY_SIDEBAR,
): { label: string; items: AgencyNavItem[] }[] {
  return sections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => canAccessAgencyPath(role, item.path)),
    }))
    .filter((sec) => sec.items.length > 0)
}
