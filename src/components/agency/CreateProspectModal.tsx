import { useMemo, useState } from 'react'
import type {
  AgencyProspect,
  PreferredContactMethod,
  ProspectDivision,
  RepresentationType,
  TermLengthYears,
} from '@/types/agency'
import { COMPANY_CODES } from '@/constants/roles'
import { Btn, Field, ModalShell, inputStyle } from './AgencyUI'
import { T } from '@/lib/tokens'

export const PROSPECT_DIVISIONS: ProspectDivision[] = ['Modeling', 'Influencing', 'Sports', 'Music']

export const PROSPECT_LEAD_SOURCES = [
  'Portal application',
  'Scout referral',
  'Open call',
  'Social',
  'Event',
  'Other',
] as const

export function ageFromDateOfBirth(dob: string, asOf = new Date()): number | null {
  if (!dob) return null
  const birth = new Date(`${dob}T12:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  let age = asOf.getFullYear() - birth.getFullYear()
  const m = asOf.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && asOf.getDate() < birth.getDate())) age -= 1
  return age
}

export type CreateProspectInput = Omit<
  AgencyProspect,
  'id' | 'accountId' | 'submittedAt' | 'stage' | 'contractStart' | 'contractEnd' | 'contracts'
> & { contracts?: AgencyProspect['contracts'] }

interface CreateProspectModalProps {
  defaultOrganization: string
  agent: { id: string; name: string }
  onClose: () => void
  onCreate: (values: CreateProspectInput) => void
}

export function CreateProspectModal({
  defaultOrganization,
  agent,
  onClose,
  onCreate,
}: CreateProspectModalProps) {
  const orgOptions = Object.keys(COMPANY_CODES)
  const [organization, setOrganization] = useState(
    orgOptions.includes(defaultOrganization) ? defaultOrganization : 'NZG',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [source, setSource] = useState<string>(PROSPECT_LEAD_SOURCES[0])
  const [sourceDetail, setSourceDetail] = useState('')
  const [interestLevel, setInterestLevel] = useState(5)
  const [preferredContact, setPreferredContact] = useState<PreferredContactMethod>('email')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [workArea, setWorkArea] = useState<ProspectDivision>('Modeling')
  const [representationType, setRepresentationType] = useState<RepresentationType>('exclusive')
  const [termLengthYears, setTermLengthYears] = useState<TermLengthYears>(1)
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [error, setError] = useState('')

  const age = useMemo(() => ageFromDateOfBirth(dateOfBirth), [dateOfBirth])
  const isMinor = age != null && age < 18
  const needsSourceDetail = source === 'Scout referral' || source === 'Other'

  function submit() {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) {
      setError('Name is required.')
      return
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('A valid email is required.')
      return
    }
    if (!dateOfBirth || age == null) {
      setError('Date of birth is required.')
      return
    }
    if (isMinor) {
      if (!parentName.trim() || !parentEmail.trim() || !parentPhone.trim()) {
        setError('Parent name, email, and phone are required for prospects under 18.')
        return
      }
      if (!parentEmail.includes('@')) {
        setError('A valid parent email is required.')
        return
      }
    }

    const messageEmails = [trimmedEmail.toLowerCase()]
    if (isMinor && parentEmail.trim()) {
      const pe = parentEmail.trim().toLowerCase()
      if (!messageEmails.includes(pe)) messageEmails.push(pe)
    }

    const sourceLabel =
      needsSourceDetail && sourceDetail.trim()
        ? `${source} — ${sourceDetail.trim()}`
        : source

    onCreate({
      name: trimmedName,
      email: trimmedEmail,
      notes: notes.trim(),
      source: sourceLabel,
      workArea,
      organization,
      dateOfBirth,
      interestLevel,
      preferredContact,
      representationType,
      termLengthYears,
      assignedAgentId: agent.id,
      assignedAgentName: agent.name,
      createdById: agent.id,
      createdByName: agent.name,
      isMinor,
      parentName: isMinor ? parentName.trim() : undefined,
      parentEmail: isMinor ? parentEmail.trim() : undefined,
      parentPhone: isMinor ? parentPhone.trim() : undefined,
      messageEmails,
    })
  }

  return (
    <ModalShell title="Create prospect" onClose={onClose} width={580}>
      <Field label="Organization">
        <select style={inputStyle} value={organization} onChange={(e) => setOrganization(e.target.value)}>
          {orgOptions.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Name *">
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email *">
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Date of birth *">
        <input
          type="date"
          style={inputStyle}
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
        {age != null && (
          <div style={{ fontSize: 11, color: isMinor ? T.amber : T.t3, marginTop: 4 }}>
            Age {age}
            {isMinor ? ' — minor; parent/guardian contact required' : ''}
          </div>
        )}
      </Field>
      <Field label="Comments">
        <textarea
          style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes for screening…"
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Lead source *">
          <select style={inputStyle} value={source} onChange={(e) => setSource(e.target.value)}>
            {PROSPECT_LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Interest level (1–10) *">
          <select
            style={inputStyle}
            value={interestLevel}
            onChange={(e) => setInterestLevel(Number(e.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {needsSourceDetail && (
        <Field label={source === 'Scout referral' ? 'Referred by (name)' : 'Source detail'}>
          <input
            style={inputStyle}
            value={sourceDetail}
            onChange={(e) => setSourceDetail(e.target.value)}
            placeholder="Name or details"
          />
        </Field>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Preferred contact *">
          <select
            style={inputStyle}
            value={preferredContact}
            onChange={(e) => setPreferredContact(e.target.value as PreferredContactMethod)}
          >
            <option value="call">Call</option>
            <option value="text">Text</option>
            <option value="email">Email</option>
          </select>
        </Field>
        <Field label="Tiered division *">
          <select
            style={inputStyle}
            value={workArea}
            onChange={(e) => setWorkArea(e.target.value as ProspectDivision)}
          >
            {PROSPECT_DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Representation type *">
          <select
            style={inputStyle}
            value={representationType}
            onChange={(e) => setRepresentationType(e.target.value as RepresentationType)}
          >
            <option value="exclusive">Exclusive</option>
            <option value="nonexclusive">Non-exclusive</option>
          </select>
        </Field>
        <Field label="Term length *">
          <select
            style={inputStyle}
            value={termLengthYears}
            onChange={(e) => setTermLengthYears(Number(e.target.value) as TermLengthYears)}
          >
            <option value={1}>1 year</option>
            <option value={2}>2 years</option>
          </select>
        </Field>
      </div>

      {isMinor && (
        <div
          style={{
            border: `1px solid ${T.amber}55`,
            background: T.amberL,
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 8 }}>
            Parent / guardian (required under 18)
          </div>
          <Field label="Parent name *">
            <input style={inputStyle} value={parentName} onChange={(e) => setParentName(e.target.value)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Parent email *">
              <input
                style={inputStyle}
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </Field>
            <Field label="Parent phone *">
              <input
                style={inputStyle}
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
              />
            </Field>
          </div>
          <div style={{ fontSize: 11, color: T.t3 }}>
            Prospect and parent emails will both be associated with this account for messages.
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, color: T.t3, marginBottom: 12 }}>
        Assigned agent: <strong style={{ color: T.t1 }}>{agent.name}</strong>
      </div>

      {error && (
        <div style={{ color: T.red, fontSize: 12, marginBottom: 10 }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn onClick={submit}>Create prospect</Btn>
      </div>
    </ModalShell>
  )
}
