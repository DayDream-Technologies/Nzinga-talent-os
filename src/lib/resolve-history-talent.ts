import type { Talent } from '@/types'

/** Map an agency prospect/client (or any person) to a pipeline `talents.id`. */
export function resolvePipelineTalentId(
  talents: Talent[],
  opts: {
    id?: string | null
    email?: string | null
    applicationId?: string | null
    accountId?: string | null
  },
): string | null {
  if (opts.id && talents.some((t) => t.id === opts.id)) return opts.id
  const accountId = opts.accountId?.trim()
  if (accountId) {
    const byAccount = talents.find((t) => t.account_number === accountId)
    if (byAccount) return byAccount.id
  }
  const applicationId = opts.applicationId?.trim()
  if (applicationId) {
    const byApp = talents.find((t) => t.application_id === applicationId)
    if (byApp) return byApp.id
  }
  const email = opts.email?.trim().toLowerCase()
  if (email) {
    const byEmail = talents.find((t) => (t.email || '').trim().toLowerCase() === email)
    if (byEmail) return byEmail.id
  }
  return null
}
