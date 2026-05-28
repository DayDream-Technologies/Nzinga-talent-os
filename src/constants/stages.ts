export { STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES } from '@/types/stages'

export const REQUIRED_DOCS = [
  {
    id: 'gov_id',
    label: 'Government-Issued ID',
    icon: '🪪',
    note: "Passport, driver's license, or state ID",
  },
  {
    id: 'tax_doc',
    label: 'Tax Documentation (W-9)',
    icon: '📄',
    note: 'IRS W-9 form — required for payments',
  },
  {
    id: 'banking',
    label: 'Banking Information',
    icon: '🏦',
    note: 'Voided check or bank letter',
  },
  {
    id: 'proof_income',
    label: 'Proof of Income',
    icon: '💰',
    note: 'For self-support verification only — not used in approvals',
  },
] as const
