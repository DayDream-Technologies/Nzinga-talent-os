/**
 * Optional EmailJS integration for application invitation emails.
 * The app works without these variables; Send Application still creates the app and access code.
 */

export interface ApplicationInviteEmailParams {
  toEmail: string
  toName: string
  accessCode: string
}

export type SendInviteEmailResult =
  | { status: 'sent' }
  | { status: 'skipped'; reason: 'not_configured' }
  | { status: 'failed'; message: string }

export function isEmailJsConfigured(): boolean {
  const { VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY } =
    import.meta.env
  return Boolean(
    VITE_EMAILJS_SERVICE_ID?.trim() &&
      VITE_EMAILJS_TEMPLATE_ID?.trim() &&
      VITE_EMAILJS_PUBLIC_KEY?.trim(),
  )
}

/** Public URL for the prospect application portal (used in invite emails when EmailJS is enabled). */
export function getPortalApplicationUrl(): string {
  const base = import.meta.env.VITE_APP_URL?.trim().replace(/\/$/, '')
  if (base) return `${base}/portal`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/portal`
  }
  return '/portal'
}

export async function sendApplicationInviteEmail(
  params: ApplicationInviteEmailParams,
): Promise<SendInviteEmailResult> {
  if (!isEmailJsConfigured()) {
    return { status: 'skipped', reason: 'not_configured' }
  }

  const { VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY } =
    import.meta.env

  const payload = {
    service_id: VITE_EMAILJS_SERVICE_ID,
    template_id: VITE_EMAILJS_TEMPLATE_ID,
    user_id: VITE_EMAILJS_PUBLIC_KEY,
    template_params: {
      to_email: params.toEmail,
      to_name: params.toName,
      access_code: params.accessCode,
      portal_link: getPortalApplicationUrl(),
      from_name: 'Nzinga Talent Group',
    },
  }

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      return { status: 'failed', message: 'Email service returned an error.' }
    }
    return { status: 'sent' }
  } catch {
    return { status: 'failed', message: 'Email service is unavailable.' }
  }
}
