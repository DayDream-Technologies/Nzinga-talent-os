import { useEffect, useState } from 'react'
import type { Appointment } from '@/types/agency'
import { AGENCY_TICKET_AGENTS } from '@/constants/agency-seed'
import {
  Btn,
  Field,
  ModalShell,
  MultiCheck,
  fromLocalDateTimeInput,
  inputStyle,
  toLocalDateTimeInput,
} from './AgencyUI'

export type AppointmentFormValues = Omit<Appointment, 'id'>

interface AppointmentFormModalProps {
  initial?: Appointment | null
  clientOptions: string[]
  talentOptions: string[]
  onClose: () => void
  onSave: (values: AppointmentFormValues) => void
  onDelete?: () => void
}

function defaultTimes() {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 2)
  const end = new Date(start.getTime() + 30 * 60000)
  return { startsAt: start.toISOString(), endsAt: end.toISOString() }
}

export function AppointmentFormModal({
  initial,
  clientOptions,
  talentOptions,
  onClose,
  onSave,
  onDelete,
}: AppointmentFormModalProps) {
  const defaults = defaultTimes()
  const [title, setTitle] = useState(initial?.title || '')
  const [location, setLocation] = useState(initial?.location || 'Zoom')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [startsLocal, setStartsLocal] = useState(
    toLocalDateTimeInput(initial?.startsAt || defaults.startsAt),
  )
  const [endsLocal, setEndsLocal] = useState(
    toLocalDateTimeInput(initial?.endsAt || defaults.endsAt),
  )
  const [clientNames, setClientNames] = useState<string[]>(initial?.clientNames || [])
  const [agentNames, setAgentNames] = useState<string[]>(
    initial?.agentNames || [AGENCY_TICKET_AGENTS[0]?.name].filter(Boolean),
  )
  const [talentNames, setTalentNames] = useState<string[]>(initial?.talentNames || [])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!initial) return
    setTitle(initial.title)
    setLocation(initial.location)
    setNotes(initial.notes)
    setStartsLocal(toLocalDateTimeInput(initial.startsAt))
    setEndsLocal(toLocalDateTimeInput(initial.endsAt))
    setClientNames(initial.clientNames || [])
    setAgentNames(initial.agentNames || [])
    setTalentNames(initial.talentNames || [])
  }, [initial])

  function submit() {
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    const startsAt = fromLocalDateTimeInput(startsLocal)
    const endsAt = fromLocalDateTimeInput(endsLocal)
    if (new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
      setError('End must be after start.')
      return
    }
    const withWhom =
      clientNames.length > 0
        ? clientNames.join(', ')
        : initial?.withWhom || '—'
    onSave({
      title: title.trim(),
      withWhom,
      clientNames,
      agentNames,
      talentNames,
      startsAt,
      endsAt,
      location: location.trim() || 'TBD',
      notes: notes.trim(),
    })
  }

  return (
    <ModalShell title={initial ? 'Edit appointment' : 'New appointment'} onClose={onClose} width={560}>
      <Field label="Title">
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Start date / time">
          <input
            type="datetime-local"
            style={inputStyle}
            value={startsLocal}
            onChange={(e) => setStartsLocal(e.target.value)}
          />
        </Field>
        <Field label="End date / time">
          <input
            type="datetime-local"
            style={inputStyle}
            value={endsLocal}
            onChange={(e) => setEndsLocal(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Location">
        <input style={inputStyle} value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
      <MultiCheck label="Client(s)" options={clientOptions} selected={clientNames} onChange={setClientNames} />
      <MultiCheck
        label="Agent(s)"
        options={AGENCY_TICKET_AGENTS.map((a) => a.name)}
        selected={agentNames}
        onChange={setAgentNames}
      />
      <MultiCheck label="Talent" options={talentOptions} selected={talentNames} onChange={setTalentNames} />
      <Field label="Notes">
        <textarea
          style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      {error && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
        {initial && onDelete && (
          <Btn
            variant="danger"
            onClick={() => {
              if (window.confirm('Delete this appointment?')) onDelete()
            }}
          >
            Delete
          </Btn>
        )}
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn onClick={submit}>{initial ? 'Save' : 'Create'}</Btn>
      </div>
    </ModalShell>
  )
}
