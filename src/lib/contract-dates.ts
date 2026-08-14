export function parseDay(value?: string | null): Date | null {
  if (!value?.trim()) return null
  const iso = value.includes('T') ? value : `${value}T00:00:00`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function hasContract(start?: string | null): boolean {
  return Boolean(start?.trim())
}

export function isContractLive(start?: string | null, end?: string | null): boolean {
  const started = parseDay(start)
  if (!started || started > startOfToday()) return false
  const ended = parseDay(end)
  return !ended || ended >= startOfToday()
}

export function formatContractStart(start?: string | null): string {
  const d = parseDay(start)
  return d ? d.toLocaleDateString() : 'Pending'
}

export function formatContractEnd(start?: string | null, end?: string | null): string {
  if (!hasContract(start)) return ''
  if (isContractLive(start, end)) return 'Current'
  const d = parseDay(end)
  return d ? d.toLocaleDateString() : ''
}
