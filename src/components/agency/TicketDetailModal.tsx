import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SupportTicket, TicketType } from '@/types/agency'
import { T } from '@/lib/tokens'
import { Badge, Btn, Field, StatusColor, TicketTypeColor, inputStyle } from './AgencyUI'
import { TalentLink } from '@/components/talent/TalentLink'

export type TicketAgent = { id: string; name: string; title: string }

const TICKET_TYPES: TicketType[] = ['availability', 'scheduling', 'contract', 'billing', 'general']

interface TicketDetailModalProps {
  ticket: SupportTicket
  onClose: () => void
  updateTicket: (id: string, patch: Partial<SupportTicket>) => void
  isDirector: boolean
  agents: TicketAgent[]
}

export function TicketDetailModal({
  ticket,
  onClose,
  updateTicket,
  isDirector,
  agents,
}: TicketDetailModalProps) {
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState(ticket.subject)
  const [body, setBody] = useState(ticket.body)
  const [priority, setPriority] = useState(ticket.priority)
  const [type, setType] = useState(ticket.type)
  const [dueDate, setDueDate] = useState(ticket.dueDate)

  useEffect(() => {
    setSubject(ticket.subject)
    setBody(ticket.body)
    setPriority(ticket.priority)
    setType(ticket.type)
    setDueDate(ticket.dueDate)
    setEditing(false)
  }, [ticket.id, ticket.subject, ticket.body, ticket.priority, ticket.type, ticket.dueDate])

  function saveEdit() {
    updateTicket(ticket.id, {
      subject: subject.trim() || ticket.subject,
      body: body.trim() || ticket.body,
      priority,
      type,
      dueDate: dueDate || ticket.dueDate,
    })
    setEditing(false)
  }

  function cancelEdit() {
    setSubject(ticket.subject)
    setBody(ticket.body)
    setPriority(ticket.priority)
    setType(ticket.type)
    setDueDate(ticket.dueDate)
    setEditing(false)
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved'
  const isOpen = ticket.status === 'open'
  const dueOverdue =
    !isClosed && ticket.dueDate && ticket.dueDate < new Date().toISOString().slice(0, 10)

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ticket.subject}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: T.cardBg,
          borderRadius: 12,
          padding: '28px 32px',
          width: 520,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <Field label="Subject">
                <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} />
              </Field>
            ) : (
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: T.t1,
                  margin: 0,
                  fontFamily: "'Syne', sans-serif",
                  lineHeight: 1.3,
                }}
              >
                {ticket.subject}
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              color: T.t3,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'flex-end' }}>
          <Badge color={StatusColor(ticket.status)}>{ticket.status}</Badge>
          {editing ? (
            <>
              <Field label="Type">
                <select
                  style={inputStyle}
                  value={type}
                  onChange={(e) => setType(e.target.value as TicketType)}
                >
                  {TICKET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  style={inputStyle}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  style={inputStyle}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
            </>
          ) : (
            <>
              <Badge color={TicketTypeColor(ticket.type)}>{ticket.type}</Badge>
              <Badge color={ticket.priority === 'high' ? T.red : ticket.priority === 'medium' ? T.amber : T.t3}>
                {ticket.priority}
              </Badge>
              {ticket.talentDecision && (
                <Badge color={ticket.talentDecision === 'confirmed' ? T.green : T.red}>
                  Talent {ticket.talentDecision}
                </Badge>
              )}
            </>
          )}
        </div>

        <div style={{ fontSize: 13, color: T.t2, marginBottom: 16, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: T.t3 }}>Client</span>
            <span style={{ fontWeight: 500 }}>{ticket.clientName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: T.t3 }}>Talent</span>
            <span style={{ fontWeight: 500 }}>
              {ticket.talentName ? <TalentLink name={ticket.talentName} /> : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <span style={{ color: T.t3 }}>Assignee</span>
            {isDirector ? (
              <select
                style={{ ...inputStyle, width: 'auto', minWidth: 160, marginBottom: 0 }}
                value={ticket.assignee}
                onChange={(e) => updateTicket(ticket.id, { assignee: e.target.value })}
              >
                {!agents.some((a) => a.name === ticket.assignee) && (
                  <option value={ticket.assignee}>{ticket.assignee}</option>
                )}
                {agents.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontWeight: 500 }}>{ticket.assignee || '—'}</span>
            )}
          </div>
          {!editing && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: T.t3 }}>Due</span>
              <span style={{ fontWeight: 500, color: dueOverdue ? T.red : T.t1 }}>
                {ticket.dueDate ? new Date(ticket.dueDate + 'T12:00:00').toLocaleDateString() : '—'}
                {dueOverdue ? ' · overdue' : ''}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: T.t3 }}>Created</span>
            <span style={{ fontWeight: 500 }}>{new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {editing ? (
          <Field label="Details">
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Description
            </div>
            <div
              style={{
                fontSize: 13,
                color: T.t1,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                background: T.inputBg,
                border: `1px solid ${T.inputBorder}`,
                borderRadius: 8,
                padding: '12px 14px',
              }}
            >
              {ticket.body || '—'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
          {editing ? (
            <>
              <Btn variant="secondary" onClick={cancelEdit}>
                Cancel
              </Btn>
              <Btn onClick={saveEdit}>Save</Btn>
            </>
          ) : (
            <>
              {!isOpen && (
                <Btn onClick={() => updateTicket(ticket.id, { status: 'open' })}>Open</Btn>
              )}
              {!isClosed && (
                <Btn variant="success" onClick={() => updateTicket(ticket.id, { status: 'closed' })}>
                  Close
                </Btn>
              )}
              <Btn variant="secondary" onClick={() => setEditing(true)}>
                Edit
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
