// @ts-nocheck
import { useState } from 'react'
import { T, Btn, FInput, FTextarea, FSelect, Section } from '@/components/ui-compat'
import { sendGeneralEmail } from '@/lib/email'

const EMAIL_TEMPLATES = [
  { id: 'custom', label: '— Custom Email —' },
  { id: 'followup', label: 'Follow-Up Check-In' },
  { id: 'docs_needed', label: 'Documents Needed' },
  { id: 'status_update', label: 'Status Update' },
  { id: 'welcome', label: 'Welcome / Onboarding' },
]

const TEMPLATE_CONTENT: Record<string, { subject: string; body: string }> = {
  followup: {
    subject: 'Quick Check-In — Nzinga Talent Group',
    body: 'Hi {name},\n\nWe wanted to check in and see how things are going. Please let us know if you have any questions or need anything from our team.\n\nBest regards,\nNzinga Talent Group',
  },
  docs_needed: {
    subject: 'Action Required: Documents Needed',
    body: "Hi {name},\n\nWe're reaching out because we still need a few documents to move your file forward. Please upload the following at your earliest convenience:\n\n\u2022 [Document name]\n\nIf you have questions about any of these items, don't hesitate to reach out.\n\nThank you,\nNzinga Talent Group",
  },
  status_update: {
    subject: 'Your Application Status \u2014 Nzinga Talent Group',
    body: "Hi {name},\n\nWe wanted to give you a quick update on where things stand with your file.\n\n[Status details here]\n\nPlease reach out if you have any questions.\n\nBest,\nNzinga Talent Group",
  },
  welcome: {
    subject: 'Welcome to Nzinga Talent Group!',
    body: "Hi {name},\n\nWelcome aboard! We're excited to have you as part of the Nzinga Talent Group family.\n\nYour success manager will be in touch shortly with next steps for onboarding.\n\nLooking forward to working with you!\n\nBest regards,\nNzinga Talent Group",
  },
}

interface ComposeEmailProps {
  talentName: string
  talentEmail: string
  talentId: string
  onEmailSent: (entry: { subject: string; to: string }) => void
}

export function ComposeEmail({ talentName, talentEmail, talentId, onEmailSent }: ComposeEmailProps) {
  const [open, setOpen] = useState(false)
  const [template, setTemplate] = useState('custom')
  const [to, setTo] = useState(talentEmail || '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  function applyTemplate(tid: string) {
    setTemplate(tid)
    if (tid !== 'custom' && TEMPLATE_CONTENT[tid]) {
      const t = TEMPLATE_CONTENT[tid]
      setSubject(t.subject)
      setBody(t.body.replace(/\{name\}/g, talentName))
    }
  }

  async function handleSend() {
    if (!to || !subject || !body) return
    setSending(true)
    setResult(null)

    const res = await sendGeneralEmail({
      toEmail: to,
      toName: talentName,
      subject,
      htmlBody: body.replace(/\n/g, '<br>'),
      textBody: body,
    })

    setSending(false)
    if (res.status === 'sent') {
      setResult('sent')
      onEmailSent({ subject, to })
      setTimeout(() => {
        setOpen(false)
        setSubject('')
        setBody('')
        setResult(null)
        setTemplate('custom')
      }, 1500)
    } else if (res.status === 'skipped') {
      setResult('Email not configured — running in demo mode.')
    } else {
      setResult(res.message || 'Failed to send.')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => { setTo(talentEmail || ''); setOpen(true) }}
        style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}
      >
        ✉ Send Email
      </button>
    )
  }

  return (
    <Section title="Compose Email" accent={T.blue} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: T.t3, display: 'block', marginBottom: 2 }}>Template</label>
          <FSelect value={template} onChange={applyTemplate} options={EMAIL_TEMPLATES.map(t => t.id)} labels={EMAIL_TEMPLATES.map(t => t.label)} style={{ width: '100%' }} />
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: T.t3, display: 'block', marginBottom: 2 }}>To</label>
        <FInput value={to} onChange={setTo} placeholder="recipient@email.com" type="email" />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: T.t3, display: 'block', marginBottom: 2 }}>Subject</label>
        <FInput value={subject} onChange={setSubject} placeholder="Email subject..." />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: T.t3, display: 'block', marginBottom: 2 }}>Body</label>
        <FTextarea value={body} onChange={setBody} placeholder="Write your message..." rows={5} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn variant="primary" sm onClick={handleSend} disabled={sending || !to || !subject || !body}>
          {sending ? '⟳ Sending…' : '📧 Send'}
        </Btn>
        <Btn variant="ghost" sm onClick={() => setOpen(false)}>Cancel</Btn>
        {result === 'sent' && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ Email sent!</span>}
        {result && result !== 'sent' && <span style={{ fontSize: 11, color: T.red }}>{result}</span>}
      </div>
    </Section>
  )
}
