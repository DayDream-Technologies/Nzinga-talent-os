export const AGENCY_HOURS: Record<number, { start: string; end: string } | null> = {
  0: { start: '13:00', end: '17:00' },
  1: { start: '09:00', end: '18:00' },
  2: { start: '09:00', end: '18:00' },
  3: { start: '09:00', end: '18:00' },
  4: { start: '09:00', end: '18:00' },
  5: { start: '09:00', end: '18:00' },
  6: { start: '10:00', end: '17:00' },
}

export const SCHEDULE_CONFLICT_COPY =
  'That time or date is currently unavailable. Please choose a different time or date to schedule your meeting.'

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function isWithinAgencyHours(isoStart: string, staffHours?: { start: string; end: string } | null): boolean {
  const d = new Date(isoStart)
  if (Number.isNaN(d.getTime())) return false
  const window = staffHours === undefined ? AGENCY_HOURS[d.getDay()] : staffHours
  if (!window) return false
  const t = d.getHours() * 60 + d.getMinutes()
  return t >= minutes(window.start) && t < minutes(window.end)
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const a0 = Date.parse(aStart)
  const a1 = Date.parse(aEnd)
  const b0 = Date.parse(bStart)
  const b1 = Date.parse(bEnd)
  if (![a0, a1, b0, b1].every(Number.isFinite)) return false
  return a0 < b1 && b0 < a1
}

export function hasScheduleConflict(
  candidate: { startsAt: string; endsAt: string },
  existing: Array<{ startsAt: string; endsAt: string; id?: string }>,
  ignoreId?: string,
): boolean {
  return existing.some((row) => {
    if (ignoreId && row.id === ignoreId) return false
    return rangesOverlap(candidate.startsAt, candidate.endsAt, row.startsAt, row.endsAt)
  })
}
