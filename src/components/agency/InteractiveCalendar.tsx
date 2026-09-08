import { useMemo, useState } from 'react'
import { Btn, Card, Field, ModalShell, Panel, Table, inputStyle } from '@/components/agency/AgencyUI'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { hasScheduleConflict, isWithinAgencyHours, SCHEDULE_CONFLICT_COPY } from '@/lib/calendar-hours'
import { createHistoryEntry } from '@/lib/history-ledger'
import { isCalendarSyncConnected } from '@/lib/integrations'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { T } from '@/lib/tokens'
import { AUTO_STACK_GRID } from '@/lib/viewport'

function toIso(date: string, time: string) {
  return new Date(`${date}T${time || '09:00'}:00`).toISOString()
}

export function AppointmentForm({
  onClose,
  presetStart,
}: {
  onClose: () => void
  presetStart?: string
}) {
  const { addAppointment, addCalendarEvent, appointments } = useAgencyData()
  const { setHistory } = useAppData()
  const { user } = useAuth()
  const start = presetStart ? new Date(presetStart) : new Date()
  const [title, setTitle] = useState('')
  const [talent, setTalent] = useState('')
  const [date, setDate] = useState(start.toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState(presetStart ? start.toISOString().slice(11, 16) : '09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('Meeting')
  const startsAt = toIso(date, startTime)
  const endsAt = toIso(date, endTime)
  const inHours = isWithinAgencyHours(startsAt)
  const conflict = hasScheduleConflict({ startsAt, endsAt }, appointments)
  const missing = !title.trim() ? ['Title'] : []

  return (
    <ModalShell title="Add Appointment" onClose={onClose} width={560}>
      {!isCalendarSyncConnected() && <IntegrationNotice id="calendar" compact />}
      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Linked talent">
        <input value={talent} onChange={(e) => setTalent(e.target.value)} style={inputStyle} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: AUTO_STACK_GRID, gap: 8 }}>
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Start">
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="End">
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      <Field label="Location / virtual link">
        <input value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Category">
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          {['Audition', 'Booking', 'Meeting', 'Renewal', 'Internal'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      {!inHours && <div style={{ color: T.amber, fontSize: 12, marginBottom: 8 }}>{SCHEDULE_CONFLICT_COPY} (outside agency hours)</div>}
      {conflict && <div style={{ color: T.red, fontSize: 12, marginBottom: 8 }}>{SCHEDULE_CONFLICT_COPY}</div>}
      {missing.length > 0 && <div style={{ color: T.amber, fontSize: 12 }}>Required: {missing.join(', ')}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          disabled={missing.length > 0 || conflict}
          onClick={() => {
            addAppointment({
              title: title.trim(),
              withWhom: talent,
              clientNames: [],
              agentNames: user?.name ? [user.name] : [],
              talentNames: talent ? [talent] : [],
              startsAt,
              endsAt,
              location,
              notes: '',
              category,
            })
            addCalendarEvent({
              title: title.trim(),
              date,
              type: category.toLowerCase() === 'booking' ? 'booking' : 'meeting',
              talentName: talent,
              clientName: '',
            })
            setHistory((prev) => [
              createHistoryEntry({
                type: 'meeting',
                text: `Appointment: ${title.trim()} on ${date}`,
                category: 'communication',
                staffName: user?.name,
                userId: user?.id,
              }),
              ...prev,
            ])
            onClose()
          }}
        >
          Save
        </Btn>
      </div>
    </ModalShell>
  )
}

export function InteractiveCalendarModule({ personFilter }: { personFilter?: string }) {
  const { appointments, calendar } = useAgencyData()
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [cursor, setCursor] = useState(new Date())
  const [form, setForm] = useState<string | null>(null)

  const events = useMemo(() => {
    const fromAppt = appointments
      .filter((a) => !personFilter || a.talentNames.includes(personFilter) || a.withWhom === personFilter)
      .map((a) => ({
        id: a.id,
        title: a.title,
        start: a.startsAt,
        end: a.endsAt,
        category: a.category || 'Meeting',
      }))
    const fromCal = calendar
      .filter((e) => !personFilter || e.talentName === personFilter)
      .map((e) => ({
        id: e.id,
        title: e.title,
        start: `${e.date}T09:00:00`,
        end: `${e.date}T10:00:00`,
        category: e.type,
      }))
    return [...fromAppt, ...fromCal]
  }, [appointments, calendar, personFilter])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: startPad + daysInMonth }, (_, i) => {
    if (i < startPad) return null
    return i - startPad + 1
  })

  return (
    <Panel
      title={personFilter ? `Appointments · ${personFilter}` : 'Calendar'}
      subtitle="Month, week, day, and agenda share the same appointments list."
      actions={
        <>
          {(['month', 'week', 'day', 'agenda'] as const).map((v) => (
            <Btn key={v} variant={view === v ? 'primary' : 'secondary'} onClick={() => setView(v)}>
              {v}
            </Btn>
          ))}
          <Btn onClick={() => setForm(new Date().toISOString())}>Add</Btn>
        </>
      }
    >
      {!isCalendarSyncConnected() && <IntegrationNotice id="calendar" />}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <Btn variant="secondary" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          Prev
        </Btn>
        <div style={{ fontWeight: 700 }}>
          {cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <Btn variant="secondary" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          Next
        </Btn>
      </div>
      {view === 'agenda' || view === 'day' || view === 'week' ? (
        <Card>
          <Table
            headers={['When', 'Title', 'Category']}
            rows={events
              .filter((e) => (view === 'day' ? e.start.slice(0, 10) === cursor.toISOString().slice(0, 10) : true))
              .map((e) => [new Date(e.start).toLocaleString(), e.title, e.category])}
          />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(72px, 1fr))', gap: 4, overflowX: 'auto' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} style={{ fontSize: 11, color: T.t3, fontWeight: 700, padding: 6 }}>
              {d}
            </div>
          ))}
          {cells.map((day, idx) => {
            const iso = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
            const dayEvents = day ? events.filter((e) => e.start.slice(0, 10) === iso) : []
            return (
              <button
                key={idx}
                type="button"
                disabled={!day}
                onClick={() => day && setForm(`${iso}T09:00:00`)}
                style={{
                  minHeight: 72,
                  textAlign: 'left',
                  border: `1px solid ${T.cardBorder}`,
                  background: T.cardBg,
                  borderRadius: 6,
                  padding: 6,
                  cursor: day ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>{day || ''}</div>
                {dayEvents.slice(0, 3).map((e) => (
                  <div key={e.id} style={{ fontSize: 10, color: T.blue, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.title}
                  </div>
                ))}
              </button>
            )
          })}
        </div>
      )}
      {form && <AppointmentForm onClose={() => setForm(null)} presetStart={form} />}
    </Panel>
  )
}
