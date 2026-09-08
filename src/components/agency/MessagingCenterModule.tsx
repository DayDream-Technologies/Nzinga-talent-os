import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Btn, Card, Field, ModalShell, Panel, Table, inputStyle } from '@/components/agency/AgencyUI'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { historyForMassBlast } from '@/lib/history-ledger'
import { isTwilioConnected } from '@/lib/integrations'
import { T } from '@/lib/tokens'
import { talentAccountPath } from '@/lib/talent-account'
import { useViewport } from '@/hooks/useViewport'

export function MessagingCenterModule() {
  const { messages, sendMessage, prospects, talent } = useAgencyData()
  const { setHistory } = useAppData()
  const { user } = useAuth()
  const connected = isTwilioConnected()
  const band = useViewport()
  const sms = useMemo(() => messages.filter((m) => m.channel === 'sms'), [messages])
  const [selectedTo, setSelectedTo] = useState(sms[0]?.to || '')
  const [composeOpen, setComposeOpen] = useState(false)
  const [body, setBody] = useState('')
  const [to, setTo] = useState('')
  const [filter, setFilter] = useState('')

  const threads = useMemo(() => {
    const latest = new Map<string, (typeof sms)[number]>()
    for (const m of sms) {
      const prev = latest.get(m.to)
      if (!prev || m.sentAt > prev.sentAt) latest.set(m.to, m)
    }
    return [...latest.values()]
  }, [sms])

  const thread = sms.filter((m) => m.to === selectedTo)
  const people = [...prospects, ...talent]

  function recipientMeta(name: string) {
    const p = people.find((x) => x.name === name)
    return {
      accountId: 'accountId' in (p || {}) ? (p as { accountId?: string }).accountId : undefined,
      stage: 'stage' in (p || {}) ? String((p as { stage?: string }).stage || '') : 'client',
    }
  }

  return (
    <Panel
      title="Text Messaging Center"
      subtitle="Unified inbox for individual SMS and blasts. Twilio powers send and receive."
      actions={<Btn onClick={() => setComposeOpen(true)}>New text</Btn>}
    >
      {!connected && <IntegrationNotice id="twilio" />}
      <div style={{ display: 'grid', gridTemplateColumns: band === 'mobile' ? '1fr' : 'minmax(240px, 320px) 1fr', gap: 12, minHeight: 420 }}>
        <Card hover={false} style={{ padding: 0 }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${T.cardBorder}` }}>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search name or number"
              style={inputStyle}
            />
          </div>
          {threads
            .filter((m) => {
              const q = filter.toLowerCase()
              const text = `${m.to} ${m.body || ''} ${m.preview || ''}`.toLowerCase()
              return !filter || text.includes(q)
            })
            .map((m) => {
              const meta = recipientMeta(m.to)
              const snippet = (m.body || m.preview || '').slice(0, 48)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedTo(m.to)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: `1px solid ${T.cardBorder}`,
                    background: selectedTo === m.to ? T.rowSelected : 'transparent',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: T.t1 }}>{m.to}</span>
                    <span style={{ fontSize: 11, color: T.t4 }}>{new Date(m.sentAt).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.t3 }}>
                    {meta.stage || 'SMS'} · {snippet}
                  </div>
                </button>
              )
            })}
          {sms.length === 0 && <div style={{ padding: 16, color: T.t3, fontSize: 13 }}>No conversations yet.</div>}
        </Card>
        <Card hover={false}>
          {selectedTo ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  {(() => {
                    const meta = recipientMeta(selectedTo)
                    return meta.accountId ? (
                      <Link to={talentAccountPath(meta.accountId)} style={{ fontWeight: 800, color: T.blue }}>
                        {selectedTo}
                      </Link>
                    ) : (
                      <span style={{ fontWeight: 800 }}>{selectedTo}</span>
                    )
                  })()}
                  <Badge color={T.blue}>SMS</Badge>
                </div>
                <Btn variant="secondary" onClick={() => setComposeOpen(true)}>
                  Reply
                </Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                {thread.map((m) => (
                  <div key={m.id} style={{ background: T.mutedBg, borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>
                      {user?.name || 'Staff'} · {new Date(m.sentAt).toLocaleString()}
                    </div>
                    <div>{m.body || m.preview}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: T.t3 }}>Select a conversation.</div>
          )}
        </Card>
      </div>
      {composeOpen && (
        <ModalShell title="New text" onClose={() => setComposeOpen(false)}>
          {!connected && <IntegrationNotice id="twilio" compact />}
          <Field label="To">
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Name or number" style={inputStyle} />
          </Field>
          <Field label="Message">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setComposeOpen(false)}>
              Cancel
            </Btn>
            <Btn
              disabled={!connected || !to.trim() || !body.trim()}
              onClick={() => {
                const names = to.split(',').map((s) => s.trim()).filter(Boolean)
                sendMessage({ channel: 'sms', to: names.join(', '), subject: '', preview: body, body, from: user?.name || 'Staff' })
                const blast = historyForMassBlast({
                  recipients: names.map((n) => {
                    const p = people.find((x) => x.name === n)
                    return { accountNumber: (p as { accountId?: string } | undefined)?.accountId, email: (p as { email?: string } | undefined)?.email }
                  }),
                  type: 'sms',
                  text: body,
                  userId: user?.id,
                  staffName: user?.name,
                })
                setHistory((prev) => [...blast, ...prev])
                setSelectedTo(names[0] || to)
                setComposeOpen(false)
                setBody('')
                setTo('')
              }}
            >
              Send
            </Btn>
          </div>
        </ModalShell>
      )}
    </Panel>
  )
}
