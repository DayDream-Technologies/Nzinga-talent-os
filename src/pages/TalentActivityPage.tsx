import { useState } from 'react'
import { portalCard, portalDanger, portalGhost, portalInput, portalMuted, portalPrimary } from '@/components/talent-portal/TalentPortalShell'
import { useTalentPortal } from '@/hooks/useTalentPortal'
import {
  belongingToTalent,
  canRespondToOpportunity,
  formatCallTime,
  opportunityDecisionPatch,
  opportunityStatusLabel,
  talentCalendarItems,
} from '@/lib/talent-portal'

export function TalentActivityPage() {
  const {
    displayName,
    rosterTalent,
    tickets,
    calendar,
    appointments,
    invoices,
    addCalendarEvent,
    updateCalendarEvent,
    updateTalent,
    updateTicket,
  } = useTalentPortal()
  const [blockDate, setBlockDate] = useState('')
  const [saved, setSaved] = useState('')

  const opportunities = belongingToTalent(tickets, displayName, (t) => [t.talentName])
  const bookings = belongingToTalent(calendar, displayName, (e) => [e.talentName]).filter((e) => e.type === 'booking')
  const items = talentCalendarItems({
    name: displayName,
    calendar,
    appointments,
    invoices: belongingToTalent(invoices, displayName, (i) => [i.talentName]),
    bookedDates: rosterTalent?.bookedDates || [],
  })

  function addBlockedDate() {
    if (!rosterTalent || !blockDate) return
    const next = rosterTalent.bookedDates.includes(blockDate)
      ? rosterTalent.bookedDates
      : [...rosterTalent.bookedDates, blockDate].sort()
    updateTalent(rosterTalent.id, { bookedDates: next, available: false })
    addCalendarEvent({
      title: `${displayName} — personal hold`,
      date: blockDate,
      talentName: displayName,
      type: 'block',
    })
    setSaved(`Blocked ${blockDate}. Your agent can see this hold.`)
    setBlockDate('')
  }

  function removeBlockedDate(date: string) {
    if (!rosterTalent) return
    updateTalent(rosterTalent.id, {
      bookedDates: rosterTalent.bookedDates.filter((d) => d !== date),
      available: rosterTalent.bookedDates.filter((d) => d !== date).length === 0,
    })
  }

  function respond(ticketId: string, decision: 'confirm' | 'decline') {
    const ticket = tickets.find((row) => row.id === ticketId)
    if (!ticket || !canRespondToOpportunity(ticket)) return
    updateTicket(ticket.id, opportunityDecisionPatch(ticket, decision))
    setSaved(decision === 'confirm' ? 'Opportunity confirmed. Your agent’s ticket is updated.' : 'Opportunity declined. Your agent’s ticket is updated.')
  }

  function respondCallTime(eventId: string, response: 'confirmed' | 'declined') {
    updateCalendarEvent(eventId, { talentCallResponse: response })
    setSaved(response === 'confirmed' ? 'Call time confirmed.' : 'Call time declined. Your agent can see this on the booking.')
  }

  return (
    <>
      <h1 style={{ fontFamily: "'Syne', 'Outfit', sans-serif", fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
        Career activity
      </h1>
      <p style={{ color: portalMuted, fontSize: 14, marginBottom: 22 }}>
        Opportunities, confirmed bookings, status tracking, and your calendar.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Submitted opportunities</h2>
          {opportunities.length === 0 ? (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>No submitted opportunities yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {opportunities.map((row) => (
                <li key={row.id} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--tp-inset)', border: '1px solid var(--tp-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 14 }}>{row.subject}</strong>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{opportunityStatusLabel(row.status)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: portalMuted, marginTop: 6 }}>
                    {row.clientName} · {row.type} · due {row.dueDate}
                    {row.talentDecision ? ` · you ${row.talentDecision}` : ''}
                  </div>
                  <p style={{ fontSize: 13, margin: '8px 0 0', lineHeight: 1.45 }}>{row.body}</p>
                  {canRespondToOpportunity(row) && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button type="button" style={portalPrimary} onClick={() => respond(row.id, 'confirm')}>
                        Confirm
                      </button>
                      <button type="button" style={portalDanger} onClick={() => respond(row.id, 'decline')}>
                        Decline
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Confirmed bookings</h2>
          {bookings.length === 0 ? (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>No confirmed shoots on the shared calendar.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {bookings.map((row) => {
                const callLabel = formatCallTime(row.callTime)
                const response = row.talentCallResponse || (row.callTime ? 'pending' : undefined)
                return (
                  <li key={row.id} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--tp-inset)', border: '1px solid var(--tp-border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {row.date} · {row.title}
                      {row.clientName ? ` · ${row.clientName}` : ''}
                    </div>
                    {callLabel ? (
                      <p style={{ fontSize: 13, color: portalMuted, margin: '6px 0 0' }}>
                        Call time {callLabel}
                        {response === 'confirmed' ? ' · confirmed' : response === 'declined' ? ' · declined' : ' · awaiting confirmation'}
                      </p>
                    ) : (
                      <p style={{ fontSize: 13, color: portalMuted, margin: '6px 0 0' }}>No call time posted yet.</p>
                    )}
                    {row.callTime && response === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button type="button" style={portalPrimary} onClick={() => respondCallTime(row.id, 'confirmed')}>
                          Confirm call time
                        </button>
                        <button type="button" style={portalDanger} onClick={() => respondCallTime(row.id, 'declined')}>
                          Can't make this call
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Calendar</h2>
          <p style={{ fontSize: 12, color: portalMuted, margin: '0 0 12px' }}>
            Shoots, meetings, and invoice deadlines. Blocked dates also appear here.
          </p>
          {items.length === 0 ? (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>Nothing on the calendar yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 90px 1fr',
                    gap: 10,
                    fontSize: 13,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--tp-border)',
                  }}
                >
                  <span>{item.date}</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>{item.kind}</span>
                  <span>
                    {item.title}
                    {item.detail ? ` · ${item.detail}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Availability</h2>
          {rosterTalent ? (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={rosterTalent.available}
                  onChange={(e) => updateTalent(rosterTalent.id, { available: e.target.checked })}
                />
                Available for new bookings
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} style={{ ...portalInput, width: 180 }} />
                <button type="button" style={portalPrimary} onClick={addBlockedDate}>
                  Block date
                </button>
              </div>
              {(rosterTalent.bookedDates || []).length > 0 && (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {rosterTalent.bookedDates.map((date) => (
                    <li key={date} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 999, background: 'var(--tp-inset)', fontSize: 12 }}>
                      {date}
                      <button type="button" style={{ ...portalGhost, padding: '2px 6px' }} onClick={() => removeBlockedDate(date)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {saved && <p style={{ fontSize: 12, color: '#16a34a', margin: '10px 0 0' }}>{saved}</p>}
            </>
          ) : (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>No roster record is linked, so availability cannot be updated yet.</p>
          )}
        </section>
      </div>
    </>
  )
}
