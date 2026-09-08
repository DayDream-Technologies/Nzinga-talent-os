import { useMemo, useState } from 'react'
import { Badge, Btn, Card, Field, ModalShell, Panel, Table, inputStyle, StatusColor } from '@/components/agency/AgencyUI'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { useViewport } from '@/hooks/useViewport'
import { createHistoryEntry } from '@/lib/history-ledger'
import { T } from '@/lib/tokens'
import type { TicketStatus, TicketType } from '@/types/agency'

const STAFF_TABS = ['Description', 'Links', 'Details', 'Dates'] as const
const CATEGORIES: { id: TicketType; label: string }[] = [
  { id: 'legal', label: 'Contract / Legal' },
  { id: 'payment', label: 'Payment / Commission' },
  { id: 'booking', label: 'Booking Issue' },
  { id: 'profile', label: 'Profile / Media Update' },
  { id: 'general', label: 'General' },
  { id: 'contract', label: 'Contract Help' },
  { id: 'billing', label: 'Billing' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'availability', label: 'Availability' },
]

export function NewIssueModal({
  onClose,
  defaultTalent,
}: {
  onClose: () => void
  defaultTalent?: string
}) {
  const { addTicket, talent, clients } = useAgencyData()
  const { setHistory } = useAppData()
  const { user } = useAuth()
  const [tab, setTab] = useState<(typeof STAFF_TABS)[number]>('Description')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [talentName, setTalentName] = useState(defaultTalent || talent[0]?.name || '')
  const [division, setDivision] = useState('Modeling')
  const [assignee, setAssignee] = useState(user?.name || '')
  const [status, setStatus] = useState<TicketStatus>('open')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [type, setType] = useState<TicketType>('general')
  const [dueDate, setDueDate] = useState('')
  const [followUp, setFollowUp] = useState('')
  const missing = !title.trim() ? ['Title'] : []
  const mobile = useViewport() === 'mobile'

  return (
    <ModalShell title="New Issue" onClose={onClose} width={720}>
      <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: 16 }}>
        <div style={{ width: mobile ? '100%' : 140, flexShrink: 0, display: mobile ? 'flex' : 'block', overflowX: mobile ? 'auto' : 'visible', gap: 4 }}>
          {STAFF_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 8px',
                border: 'none',
                background: tab === t ? T.mutedBg : 'transparent',
                fontWeight: tab === t ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: T.t1,
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {tab === 'Description' && (
            <>
              <Field label="Title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Description">
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} style={inputStyle} />
              </Field>
            </>
          )}
          {tab === 'Links' && (
            <>
              <Field label="Talent / Client">
                <input value={talentName} onChange={(e) => setTalentName(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Division">
                <input value={division} onChange={(e) => setDivision(e.target.value)} style={inputStyle} />
              </Field>
            </>
          )}
          {tab === 'Details' && (
            <>
              <Field label="Assigned to">
                <input value={assignee} onChange={(e) => setAssignee(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} style={inputStyle}>
                  {['unassigned', 'open', 'in_progress', 'pending_client', 'resolved', 'closed'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} style={inputStyle}>
                  {['low', 'medium', 'high', 'urgent'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select value={type} onChange={(e) => setType(e.target.value as TicketType)} style={inputStyle}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
          {tab === 'Dates' && (
            <>
              <Field label="Due date">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Follow-up">
                <input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} style={inputStyle} />
              </Field>
            </>
          )}
        </div>
      </div>
      {missing.length > 0 && <div style={{ color: T.amber, fontSize: 12, marginTop: 8 }}>Required: {missing.join(', ')}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          disabled={missing.length > 0}
          onClick={() => {
            addTicket({
              subject: title.trim(),
              clientId: clients[0]?.id || 'internal',
              clientName: clients[0]?.name || talentName,
              talentName,
              status,
              type,
              priority,
              dueDate: dueDate || new Date().toISOString().slice(0, 10),
              body,
              assignee,
              createdBy: user?.name,
              division,
              followUpAt: followUp || null,
            })
            setHistory((prev) => [
              createHistoryEntry({
                type: 'issue',
                text: `New support ticket submitted: ${title.trim()}`,
                category: 'internal',
                staffName: user?.name,
                userId: user?.id,
              }),
              ...prev,
            ])
            onClose()
          }}
        >
          Create issue
        </Btn>
      </div>
    </ModalShell>
  )
}

export function IssuesDashboardModule() {
  const { tickets, updateTicket } = useAgencyData()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const rows = useMemo(
    () =>
      tickets.filter((t) => {
        if (status !== 'all' && t.status !== status) return false
        const blob = `${t.id} ${t.subject} ${t.talentName || ''} ${t.body}`.toLowerCase()
        return !q || blob.includes(q.toLowerCase())
      }),
    [tickets, q, status],
  )

  function age(createdAt: string) {
    const ms = Date.now() - Date.parse(createdAt)
    if (!Number.isFinite(ms)) return '—'
    const s = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <Panel
      title="Issues / Support Tickets"
      subtitle="Staff and portal tickets. Add issue opens the full staff form."
      actions={<Btn onClick={() => setOpen(true)}>+ Add Issue</Btn>}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find an issue" style={{ ...inputStyle, maxWidth: 260 }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, maxWidth: 180 }}>
          <option value="all">All statuses</option>
          {['unassigned', 'open', 'in_progress', 'pending_client', 'resolved', 'closed'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <Card>
        <Table
          headers={['Issue ID', 'Opened', 'Created By', 'Status', 'Age', 'Issue', 'Talent / Client', 'Division']}
          rows={rows.map((t) => [
            t.id,
            new Date(t.createdAt).toLocaleDateString(),
            t.createdBy || 'Staff',
            <Badge key={`s-${t.id}`} color={StatusColor(t.status)}>
              {t.status}
            </Badge>,
            age(t.createdAt),
            t.subject,
            t.talentName || t.clientName,
            t.division || '—',
          ])}
        />
      </Card>
      {open && <NewIssueModal onClose={() => setOpen(false)} />}
    </Panel>
  )
}
