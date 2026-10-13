export const GUARDIAN_EMAIL_SUBJECT = 'Parent/Guardian Access Required – Nzinga Management Agency'

export const GUARDIAN_EMAIL_BUTTON = 'Verify Email & Set Up Parent Access'

export function splitPersonName(full: string | undefined): { first: string; last: string } {
  const parts = String(full || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

export function guardianGreetingName(first: string | undefined, last: string | undefined): string {
  const name = [first, last]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
  return name || 'Parent/Guardian'
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface GuardianLetter {
  subject: string
  html: string
  text: string
}

/** One email: why the parent was contacted, and the link that verifies their email. */
export function buildGuardianLetter(input: {
  parentFirst?: string
  parentLast?: string
  childFirst?: string
  childLast?: string
  actionUrl: string
}): GuardianLetter {
  const parentName = guardianGreetingName(input.parentFirst, input.parentLast)
  const childName = guardianGreetingName(input.childFirst, input.childLast)
  const childLabel = childName === 'Parent/Guardian' ? 'Your child' : childName
  const url = input.actionUrl.trim()
  const text = [
    `Hi ${parentName},`,
    '',
    `Your child, ${childLabel}, has listed you as their legal guardian as part of their application for potential representation with Nzinga Management Agency.`,
    '',
    'Please use the link below to verify your email address, set up your parent/guardian access, and complete the required portion of your child’s application.',
    '',
    url,
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
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e0d6;padding:40px 36px;">
            <tr>
              <td style="color:#1c1917;font-size:16px;line-height:1.7;">
                <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#6b6258;">Nzinga Management Agency</p>
                <p style="margin:0 0 16px;">Hi ${escapeHtml(parentName)},</p>
                <p style="margin:0 0 16px;">Your child, ${escapeHtml(childLabel)}, has listed you as their legal guardian as part of their application for potential representation with Nzinga Management Agency.</p>
                <p style="margin:0 0 24px;">Please use the link below to verify your email address, set up your parent/guardian access, and complete the required portion of your child’s application.</p>
                <p style="margin:0 0 28px;">
                  <a href="${escapeHtml(url)}" style="display:inline-block;background:#1a365d;color:#ffffff;text-decoration:none;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;">${GUARDIAN_EMAIL_BUTTON}</a>
                </p>
                <p style="margin:0 0 16px;">If you are not the intended recipient of this email or do not recognize this request, please disregard and delete this message.</p>
                <p style="margin:0;">Thank you,<br />Nzinga Management Agency</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject: GUARDIAN_EMAIL_SUBJECT, html, text }
}

export function shouldSendGuardianInvite(
  previous: { guardian_email?: string | null; status?: string | null } | null,
  email: string,
  force: boolean,
): boolean {
  const next = email.trim().toLowerCase()
  if (!next || !next.includes('@')) return false
  if (force) return true
  if (!previous?.guardian_email) return true
  return previous.guardian_email.trim().toLowerCase() !== next
}
