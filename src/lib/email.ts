import { supabase, supabaseConfigured } from './supabase'
import { getSupabaseFunctionUrls } from './supabase-config'

export interface GeneralEmailParams {
  toEmail: string
  toName?: string
  subject: string
  htmlBody?: string
  textBody?: string
  replyTo?: string
  fromName?: string
}

export type SendEmailResult =
  | { status: 'sent'; providerId?: string }
  | { status: 'skipped'; reason: 'not_configured' }
  | { status: 'failed'; message: string }

/** Send an email via the send-email Edge Function. */
export async function sendGeneralEmail(params: GeneralEmailParams): Promise<SendEmailResult> {
  if (!supabaseConfigured || !supabase) {
    return { status: 'skipped', reason: 'not_configured' }
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { status: 'failed', message: 'Not authenticated. Log in and try again.' }
  }

  const url = getSupabaseFunctionUrls().sendEmail
  if (!url) {
    return { status: 'skipped', reason: 'not_configured' }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      },
      body: JSON.stringify({
        to: params.toEmail,
        to_name: params.toName,
        subject: params.subject,
        html_body: params.htmlBody,
        text_body: params.textBody,
        reply_to: params.replyTo,
        from_name: params.fromName,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unknown error' }))
      const msg = body?.error || `Email service returned ${res.status}`
      if (res.status === 503) {
        return { status: 'skipped', reason: 'not_configured' }
      }
      return { status: 'failed', message: msg }
    }

    const data = await res.json()
    return { status: 'sent', providerId: data.provider_id }
  } catch (err) {
    return { status: 'failed', message: (err as Error).message || 'Network error sending email.' }
  }
}
