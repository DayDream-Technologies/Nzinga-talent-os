import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENCY_STAFF } from '@/constants/agency-seed'
import { portalCard, portalInput, portalMuted, portalPrimary, useTalentPortalPrefs } from '@/components/talent-portal/TalentPortalShell'
import { useTalentPortal } from '@/hooks/useTalentPortal'
import { agentContact, agentMailto, belongingToTalent, opportunityStatusLabel } from '@/lib/talent-portal'
import type { TicketType } from '@/types/agency'

const REQUEST_TYPES: { id: TicketType; label: string }[] = [
  { id: 'availability', label: 'Availability' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'contract', label: 'Contract' },
  { id: 'billing', label: 'Billing' },
  { id: 'general', label: 'General' },
]

export function TalentMessagesPage() {
  const { displayName, prospect, tickets, invoices, calendar, addTicket } = useTalentPortal()
  const { prefs } = useTalentPortalPrefs()
  const agent = agentContact(prospect)
  const [type, setType] = useState<TicketType>('general')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [notice, setNotice] = useState('')
  const showEmail = prefs.notifications !== 'portal'
  const showPortalAlerts = prefs.notifications !== 'email'

  const mineTickets = belongingToTalent(tickets, displayName, (t) => [t.talentName])
  const mailto = agentMailto({
    agentName: agent.name,
    agentEmail: agent.email,
    talentName: displayName,
  })

  const notifications = useMemo(() => {
    const items: { id: string; text: string }[] = []
    for (const t of mineTickets.filter((row) => row.status === 'open' || row.status === 'in_progress')) {
      items.push({ id: t.id, text: `${opportunityStatusLabel(t.status)}: ${t.subject}` })
    }
    for (const inv of belongingToTalent(invoices, displayName, (i) => [i.talentName]).filter((i) => i.status !== 'paid')) {
      items.push({ id: inv.id, text: `Invoice ${inv.invoiceNumber || inv.id} is ${inv.status} · due ${inv.dueAt}` })
    }
    const today = new Date().toISOString().slice(0, 10)
    for (const ev of belongingToTalent(calendar, displayName, (e) => [e.talentName]).filter((e) => e.date >= today)) {
      items.push({ id: ev.id, text: `Upcoming ${ev.type}: ${ev.title} on ${ev.date}` })
    }
    return items
  }, [calendar, displayName, invoices, mineTickets])

  function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) {
      setNotice('Add a subject and details for your request.')
      return
    }
    const due = new Date()
    due.setDate(due.getDate() + 7)
    addTicket({
      subject: subject.trim(),
      body: body.trim(),
      type,
      status: 'open',
      priority: 'medium',
      clientId: 'talent_portal',
      clientName: 'Talent request',
      talentName: displayName,
      assignee: agent.name || AGENCY_STAFF.name,
      dueDate: due.toISOString().slice(0, 10),
    })
    setNotice('Request sent to your agency. You can track it under Career activity.')
    setSubject('')
    setBody('')
  }

  return (
    <>
      <h1 style={{ fontFamily: "'Syne', 'Outfit', sans-serif", fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
        Communication
      </h1>
      <p style={{ color: portalMuted, fontSize: 14, marginBottom: 22 }}>
        Email your agent, submit a structured request, and review notifications.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        {showEmail ? (
          <section style={portalCard}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Message your assigned agent</h2>
            <p style={{ fontSize: 13, color: portalMuted, lineHeight: 1.5, margin: '0 0 12px' }}>
              {agent.name} is your booking agent. Open your email app with a prefilled address and subject — this is the
              fastest way to reach them.
            </p>
            <a
              href={mailto}
              style={{
                display: 'inline-block',
                background: '#16a34a',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Email {agent.name}
            </a>
            <p style={{ fontSize: 12, color: portalMuted, margin: '10px 0 0' }}>{agent.email}</p>
          </section>
        ) : (
          <section style={portalCard}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Email is off</h2>
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>
              You chose portal-only notifications.{' '}
              <Link to="/talent/settings" style={{ color: '#16a34a', fontWeight: 600 }}>
                Change this in Settings
              </Link>
              .
            </p>
          </section>
        )}

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Submit a structured request</h2>
          <form onSubmit={submitRequest} style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
            <label style={{ fontSize: 12, color: portalMuted }}>
              Type
              <select value={type} onChange={(e) => setType(e.target.value as TicketType)} style={{ ...portalInput, marginTop: 6 }}>
                {REQUEST_TYPES.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, color: portalMuted }}>
              Subject
              <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...portalInput, marginTop: 6 }} />
            </label>
            <label style={{ fontSize: 12, color: portalMuted }}>
              Details
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} style={{ ...portalInput, marginTop: 6, resize: 'vertical' }} />
            </label>
            <button type="submit" style={{ ...portalPrimary, width: 'fit-content' }}>
              Send request
            </button>
            {notice && <p style={{ fontSize: 13, color: '#16a34a', margin: 0 }}>{notice}</p>}
          </form>
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Notifications & updates</h2>
          {!showPortalAlerts ? (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>
              You chose email-only notifications, so portal alerts are hidden.{' '}
              <Link to="/talent/settings" style={{ color: '#16a34a', fontWeight: 600 }}>
                Change this in Settings
              </Link>
              .
            </p>
          ) : notifications.length === 0 ? (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>You are all caught up.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {notifications.map((n) => (
                <li key={n.id} style={{ fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--tp-border)' }}>
                  {n.text}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
