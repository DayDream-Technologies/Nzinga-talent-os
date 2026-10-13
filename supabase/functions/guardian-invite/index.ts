import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { authenticateRequest, getSupabaseAdmin, corsHeaders, jsonResponse, errorResponse } from '../shared/auth.ts'

const SUBJECT = 'Parent/Guardian Access Required – Nzinga Management Agency'
const BUTTON = 'Verify Email & Set Up Parent Access'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function greetingName(first: string, last: string): string {
  const name = [first, last].map((part) => part.trim()).filter(Boolean).join(' ')
  return name || 'Parent/Guardian'
}

function letter(parentName: string, childName: string, actionUrl: string): { html: string; text: string } {
  const childLabel = childName === 'Parent/Guardian' ? 'Your child' : childName
  const text = [
    `Hi ${parentName},`,
    '',
    `Your child, ${childLabel}, has listed you as their legal guardian as part of their application for potential representation with Nzinga Management Agency.`,
    '',
    'Please use the link below to verify your email address, set up your parent/guardian access, and complete the required portion of your child’s application.',
    '',
    actionUrl,
    '',
    'If you are not the intended recipient of this email or do not recognize this request, please disregard and delete this message.',
    '',
    'Thank you,',
    'Nzinga Management Agency',
  ].join('\n')
  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f1ec;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e0d6;padding:40px 36px;">
          <tr><td style="color:#1c1917;font-size:16px;line-height:1.7;">
            <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#6b6258;">Nzinga Management Agency</p>
            <p style="margin:0 0 16px;">Hi ${escapeHtml(parentName)},</p>
            <p style="margin:0 0 16px;">Your child, ${escapeHtml(childLabel)}, has listed you as their legal guardian as part of their application for potential representation with Nzinga Management Agency.</p>
            <p style="margin:0 0 24px;">Please use the link below to verify your email address, set up your parent/guardian access, and complete the required portion of your child’s application.</p>
            <p style="margin:0 0 28px;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#1a365d;color:#ffffff;text-decoration:none;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;">${BUTTON}</a></p>
            <p style="margin:0 0 16px;">If you are not the intended recipient of this email or do not recognize this request, please disregard and delete this message.</p>
            <p style="margin:0;">Thank you,<br />Nzinga Management Agency</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  return { html, text }
}

function allowedRedirect(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname
    const local = host === 'localhost' || host === '127.0.0.1'
    const hosted =
      host === 'talentmanagerx.com' ||
      host.endsWith('.talentmanagerx.com') ||
      host.endsWith('.amplifyapp.com')
    if (url.pathname !== '/guardian/verify') return false
    if (local) return url.protocol === 'http:' || url.protocol === 'https:'
    return url.protocol === 'https:' && hosted
  } catch {
    return false
  }
}

interface InviteBody {
  applicationId?: string
  guardianEmail?: string
  parentFirst?: string
  parentLast?: string
  token?: string
  inviteId?: string
  redirectTo?: string
  expiresAt?: string
}

serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405, origin)

  const user = await authenticateRequest(req)
  if (!user) return errorResponse('Unauthorized', 401, origin)

  let body: InviteBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const applicationId = String(body.applicationId || '').trim()
  const guardianEmail = String(body.guardianEmail || '').trim().toLowerCase()
  const redirectTo = String(body.redirectTo || '').trim()
  const token = String(body.token || '').trim()
  const inviteId = String(body.inviteId || '').trim()
  if (!applicationId || !guardianEmail.includes('@') || !token || !inviteId) {
    return errorResponse('applicationId, guardianEmail, token, and inviteId are required', 400, origin)
  }
  if (!allowedRedirect(redirectTo)) {
    return errorResponse('The parent access link is not on an allowed site.', 400, origin)
  }

  const admin = getSupabaseAdmin()
  const { data: app, error: appErr } = await admin
    .from('applications')
    .select('id, company_code, talent_email, talent_name, data, guardian_status')
    .eq('id', applicationId)
    .maybeSingle()
  if (appErr || !app) return errorResponse('Application not found', 404, origin)

  const { data: staff } = await admin
    .from('users')
    .select('id, company_code')
    .eq('auth_uid', user.id)
    .maybeSingle()
  const callerEmail = user.email.toLowerCase()
  const ownsApplication = callerEmail !== '' && callerEmail === String(app.talent_email || '').toLowerCase()
  const sameCompany = !staff?.company_code || !app.company_code || staff.company_code === app.company_code
  const { data: profile } = await admin
    .from('prospect_profiles')
    .select('application_id')
    .eq('auth_uid', user.id)
    .maybeSingle()
  const profileOwns = profile?.application_id === applicationId
  if (!(staff && sameCompany) && !ownsApplication && !profileOwns) {
    return errorResponse('You cannot send a parent access email for this application', 403, origin)
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  const fromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || 'hello@talentmanagerx.com'
  if (!apiKey) return errorResponse('Email service is not configured.', 503, origin)

  const data = (app.data || {}) as Record<string, string>
  const childFirst = String(data.legal_first || '').trim()
  const childLast = String(data.legal_last || '').trim()
  const childFallback = greetingName(childFirst, childLast)
  const childName = childFallback === 'Parent/Guardian'
    ? String(app.talent_name || '').trim() || 'Your child'
    : childFallback
  const parentName = greetingName(String(body.parentFirst || ''), String(body.parentLast || ''))

  const linkOptions = {
    redirectTo,
    data: {
      account_type: 'guardian',
      application_id: applicationId,
      invite_token: token,
    },
  }
  let link = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: guardianEmail,
    options: linkOptions,
  })
  if (link.error) {
    console.error('[guardian-invite] magiclink failed, trying invite', link.error.message)
    link = await admin.auth.admin.generateLink({
      type: 'invite',
      email: guardianEmail,
      options: linkOptions,
    })
  }
  const actionUrl = link.data?.properties?.action_link
  if (link.error || !actionUrl) {
    console.error('[guardian-invite] generateLink failed', link.error?.message)
    return errorResponse(link.error?.message || 'Could not create the parent access link.', 502, origin)
  }

  const message = letter(parentName, childName, actionUrl)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Nzinga Management Agency <${fromAddress}>`,
      to: [guardianEmail],
      subject: SUBJECT,
      html: message.html,
      text: message.text,
    }),
  })
  if (!res.ok) {
    const errBody = await res.text()
    console.error('[guardian-invite] resend failed', res.status, errBody)
    return errorResponse('Could not send the parent access email.', 502, origin)
  }

  const expiresAt = body.expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const { error: insertErr } = await admin.from('guardian_invites').upsert({
    id: inviteId,
    application_id: applicationId,
    guardian_email: guardianEmail,
    token,
    status: 'pending',
    invited_at: new Date().toISOString(),
    expires_at: expiresAt,
  })
  if (insertErr) {
    console.error('[guardian-invite] invite row failed after email sent', insertErr.message)
  }

  await admin.from('applications').update({
    guardian_email: guardianEmail,
  }).eq('id', applicationId)

  return jsonResponse({ sent: true }, 200, origin)
})
