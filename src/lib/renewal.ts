export type RenewalTerm = '6m' | '1y' | '2y' | '3y' | 'custom'

export function addMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function termMonths(term: RenewalTerm, customMonths?: number): number {
  if (term === '6m') return 6
  if (term === '1y') return 12
  if (term === '2y') return 24
  if (term === '3y') return 36
  return customMonths && customMonths > 0 ? customMonths : 12
}

export function calculateRenewalWindow(opts: {
  currentStart?: string | null
  currentEnd?: string | null
  term: RenewalTerm
  customMonths?: number
}): { start: string; end: string } {
  const months = termMonths(opts.term, opts.customMonths)
  const start = opts.currentEnd || opts.currentStart || new Date().toISOString().slice(0, 10)
  return { start, end: addMonths(start, months) }
}

export function previewRenewalOffer(opts: {
  legalName: string
  division?: string
  commissionRate?: string
  start: string
  end: string
  sameTerms: boolean
  notes?: string
}): string {
  const rate = opts.commissionRate?.trim() || '—'
  const terms = opts.sameTerms
    ? 'Existing representation terms stay the same.'
    : 'Terms need to be modified / reviewed before execution.'
  return [
    'RENEWAL OFFER',
    `Talent: ${opts.legalName}`,
    opts.division ? `Division: ${opts.division}` : '',
    `Current % Rate: ${rate}`,
    `New agreement: ${opts.start} – ${opts.end}`,
    terms,
    opts.notes ? `Special terms: ${opts.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
