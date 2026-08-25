/** Agent (scout / team leads): talent ops + roster/applicant reports */
export const AGENT_MODULE_PATHS = [
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
export const ACCOUNT_MANAGER_MODULE_PATHS = [
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

export const ALL_MODULE_PATHS = [
  ...new Set([...AGENT_MODULE_PATHS, ...ACCOUNT_MANAGER_MODULE_PATHS]),
] as const

export const ADMIN_MODULE_PATHS = [
  'admin/users',
  'admin/invite',
  'admin/roles',
  'admin/audit-log',
  'admin/settings',
] as const

export const ROLE_MODULE_PATH_OPTIONS = [
  ...ALL_MODULE_PATHS.filter((p) => p !== 'active-roster' && p !== 'settings'),
] as const
