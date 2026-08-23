export interface GeneralEmailParams {
  toEmail: string
  toName: string
  subject: string
  htmlBody?: string
  textBody?: string
}

export type SendEmailResult =
  | { status: 'sent' }
  | { status: 'skipped'; reason: 'not_configured' }
  | { status: 'failed'; message: string }

/** Staff compose UI helper. Auth emails are sent by Supabase Auth, not this module. */
export async function sendGeneralEmail(_params: GeneralEmailParams): Promise<SendEmailResult> {
  return { status: 'skipped', reason: 'not_configured' }
}
