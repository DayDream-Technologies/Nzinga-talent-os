import { invokeEdgeFunction } from './edge-functions'
import { supabaseConfigured } from './supabase'

export interface ApplicationInviteEmailParams {
  toEmail: string
  toName: string
  accessCode: string
}

export interface GeneralEmailParams {
  toEmail: string
  toName: string
  subject: string
  htmlBody?: string
  textBody?: string
  templateId?: number
  templateVars?: Record<string, string>
}

export type SendEmailResult =
  | { status: 'sent' }
  | { status: 'skipped'; reason: 'not_configured' }
  | { status: 'failed'; message: string }

export function isEmailConfigured(): boolean {
  return supabaseConfigured
}

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
): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { status: 'skipped', reason: 'not_configured' }
  }

  const portalLink = getPortalApplicationUrl()

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6b21a8;">You're Invited to Apply</h2>
      <p>Hi ${params.toName},</p>
      <p>You've been invited to complete your application with Nzinga Talent Group.</p>
      <div style="background: #f3e8ff; border: 1px solid #d8b4fe; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <div style="font-size: 12px; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.1em;">Your Access Code</div>
        <div style="font-size: 28px; font-weight: 800; color: #6b21a8; letter-spacing: 0.15em; margin-top: 4px;">${params.accessCode}</div>
      </div>
      <p>Visit the portal to get started:</p>
      <p><a href="${portalLink}" style="background: #7c3aed; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Open Application Portal</a></p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">If you have questions, reply to this email or contact your representative.</p>
      <p style="color: #6b7280; font-size: 12px;">— Nzinga Talent Group</p>
    </div>
  `.trim()

  const result = await invokeEdgeFunction('send-email', {
    to_email: params.toEmail,
    to_name: params.toName,
    subject: `You're Invited to Apply — Nzinga Talent Group`,
    html_body: htmlBody,
    text_body: `Hi ${params.toName}, you've been invited to apply. Your access code is: ${params.accessCode}. Visit ${portalLink} to get started.`,
  })

  if (!result.ok) {
    return { status: 'failed', message: result.error }
  }

  return { status: 'sent' }
}

export async function sendGeneralEmail(params: GeneralEmailParams): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { status: 'skipped', reason: 'not_configured' }
  }

  const body: Record<string, unknown> = {
    to_email: params.toEmail,
    to_name: params.toName,
    subject: params.subject,
  }

  if (params.templateId) {
    body.template_id = params.templateId
    body.template_vars = params.templateVars
  } else if (params.htmlBody) {
    body.html_body = params.htmlBody
    body.text_body = params.textBody
  } else if (params.textBody) {
    body.text_body = params.textBody
  }

  const result = await invokeEdgeFunction('send-email', body)

  if (!result.ok) {
    return { status: 'failed', message: result.error }
  }

  return { status: 'sent' }
}
