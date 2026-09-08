import type { HistoryCategory, HistoryEntry, HistoryType } from '@/types/history'

export function categoryFromMethod(method?: string | null): HistoryCategory {
  if (method === 'communication' || method === 'opportunity' || method === 'internal' || method === 'general') {
    return method
  }
  return 'general'
}

export function createHistoryEntry(input: {
  type?: HistoryType
  text: string
  userId?: string | null
  staffName?: string
  talentId?: string | null
  accountNumber?: string | null
  category?: HistoryCategory
  emailSubject?: string
  emailTo?: string
  blastId?: string
}): HistoryEntry {
  const category = input.category || 'general'
  return {
    id: `h_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
    talent_id: input.talentId ?? null,
    account_number: input.accountNumber ?? null,
    user_id: input.userId ?? null,
    type: input.type || 'note',
    text: input.text,
    ts: new Date().toISOString(),
    flagged: false,
    is_document: false,
    staff_name: input.staffName,
    method: category,
    category,
    email_subject: input.emailSubject,
    email_to: input.emailTo,
    blast_id: input.blastId,
  }
}

export function historyForMassBlast(opts: {
  recipients: Array<{ talentId?: string | null; accountNumber?: string | null; email?: string; name?: string }>
  type: 'email' | 'sms'
  text: string
  userId?: string | null
  staffName?: string
  subject?: string
}): HistoryEntry[] {
  const blastId = `blast_${Date.now()}`
  return opts.recipients.map((r) =>
    createHistoryEntry({
      type: opts.type,
      text: opts.text,
      userId: opts.userId,
      staffName: opts.staffName,
      talentId: r.talentId ?? null,
      accountNumber: r.accountNumber ?? null,
      category: 'communication',
      emailSubject: opts.subject,
      emailTo: r.email,
      blastId,
    }),
  )
}

export function historyCategoryLabel(entry: HistoryEntry): string {
  const cat = entry.category || categoryFromMethod(entry.method)
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}
