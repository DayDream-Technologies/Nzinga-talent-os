import { useEffect, useState } from 'react'
import { Btn, Card, Field, Panel, Table, inputStyle } from '@/components/agency/AgencyUI'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { historyForMassBlast } from '@/lib/history-ledger'
import { T } from '@/lib/tokens'

export function UnifiedEmailModule() {
  const { sendMessage, messages, clients, talent, prospects } = useAgencyData()
  const { setHistory } = useAppData()
  const { user } = useAuth()
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [fromName, setFromName] = useState('')
  const [sendIndividually, setSendIndividually] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'ok' | 'err' | 'skip'; msg: string } | null>(null)

  const recipients = to
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)

  useEffect(() => {
    if (!user) return
    setReplyTo((prev) => prev || user.email)
    setFromName((prev) => prev || `${user.name}\n${user.title || ''}`)
  }, [user])

  async function handleSend() {
    if (!recipients.length || !subject || !body) return
    setSending(true)
    setResult(null)
    try {
      const { sendGeneralEmail } = await import('@/lib/email')
      let sent = 0
      let skipped = 0
      for (const addr of recipients) {
        const res = await sendGeneralEmail({
          toEmail: addr,
          subject,
          htmlBody: `${body.replace(/\n/g, '<br>')}<br/><br/>${(fromName || '').replace(/\n/g, '<br>')}`,
          textBody: `${body}\n\n${fromName}`,
          replyTo: replyTo || user?.email,
          fromName: user?.name,
        })
        if (res.status === 'sent') sent += 1
        else if (res.status === 'skipped') skipped += 1
        sendMessage({ channel: 'email', to: addr, subject, preview: body.slice(0, 80) })
      }
      const people = [...talent, ...prospects, ...clients]
      const blast = historyForMassBlast({
        recipients: recipients.map((addr) => {
          const p = people.find((x) => ('email' in x ? String(x.email || '').toLowerCase() === addr.toLowerCase() : false))
          return {
            accountNumber: (p as { accountId?: string } | undefined)?.accountId,
            email: addr,
          }
        }),
        type: 'email',
        text: body,
        userId: user?.id,
        staffName: user?.name,
        subject,
      })
      setHistory((prev) => [...blast, ...prev])
      if (sent) setResult({ type: 'ok', msg: `Sent ${sent} individual message${sent === 1 ? '' : 's'}.` })
      else if (skipped) setResult({ type: 'skip', msg: 'Email service is not configured. History still logged per recipient.' })
      else setResult({ type: 'err', msg: 'Send failed.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Panel title="Send Email" subtitle="One composer for 1:1 and blasts. Send Individually keeps recipient lists private.">
      <Card>
        <Field label="To (comma-separated for a blast)">
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="maya@…, nike@…" style={inputStyle} />
        </Field>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: 13 }}>
          <input type="checkbox" checked={sendIndividually} onChange={(e) => setSendIndividually(e.target.checked)} />
          Send Individually (required for blasts — recipients never see each other)
        </label>
        <Field label="Subject">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Body">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} style={inputStyle} />
        </Field>
        <Field label="Signature">
          <textarea value={fromName} onChange={(e) => setFromName(e.target.value)} rows={3} style={inputStyle} />
        </Field>
        <Field label="Reply-To">
          <input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} style={inputStyle} />
        </Field>
        {result && (
          <div style={{ color: result.type === 'err' ? T.red : T.green, marginBottom: 10, fontWeight: 600 }}>{result.msg}</div>
        )}
        <Btn disabled={!recipients.length || !subject || !body || !sendIndividually} loading={sending} onClick={() => void handleSend()}>
          Send
        </Btn>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <Table
          headers={['To', 'Subject', 'When']}
          rows={messages
            .filter((m) => m.channel === 'email')
            .slice(0, 20)
            .map((m) => [m.to, m.subject, new Date(m.sentAt).toLocaleString()])}
        />
      </Card>
    </Panel>
  )
}
