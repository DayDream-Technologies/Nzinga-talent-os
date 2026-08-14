/** Sequential talent account IDs, e.g. NZG-100001. */

export const ACCOUNT_NUMBER_PREFIX = 'NZG'
export const ACCOUNT_NUMBER_START = 100001

const ACCOUNT_RE = new RegExp(`^${ACCOUNT_NUMBER_PREFIX}-(\\d+)$`, 'i')

export function formatAccountNumber(seq: number): string {
  return `${ACCOUNT_NUMBER_PREFIX}-${String(seq).padStart(6, '0')}`
}

export function parseAccountSeq(accountNumber: string | undefined | null): number | null {
  if (!accountNumber) return null
  const match = accountNumber.trim().match(ACCOUNT_RE)
  return match ? parseInt(match[1], 10) : null
}

export function nextAccountNumber(existing: Array<string | undefined | null>): string {
  let max = ACCOUNT_NUMBER_START - 1
  for (const value of existing) {
    const seq = parseAccountSeq(value)
    if (seq != null && seq > max) max = seq
  }
  return formatAccountNumber(max + 1)
}

export function assignAccountNumber<T extends { account_number?: string }>(
  record: T,
  existing: Array<string | undefined | null>,
): T {
  if (record.account_number?.trim()) return record
  return { ...record, account_number: nextAccountNumber(existing) }
}
