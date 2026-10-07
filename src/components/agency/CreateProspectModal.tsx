import { useMemo, useState } from 'react'
import type {
  AgencyProspect,
  PreferredContactMethod,
  ProspectDivision,
  RepresentationType,
  TermLengthYears,
  WorkArea,
} from '@/types/agency'
import { catalogNames } from '@/lib/lookup-catalogs'
import { COMPANY_CODES } from '@/constants/roles'
import { Btn, Field, ModalShell, inputStyle } from './AgencyUI'
import { T } from '@/lib/tokens'
import { useUnsavedClose } from '@/components/ui/ConfirmDialog'

export const PROSPECT_DIVISIONS: ProspectDivision[] = ['Modeling', 'Influencing', 'Sports', 'Music']

export const PROSPECT_LEAD_SOURCES = [
  'Referral',
  'Social Media',
  'Showcase',
  'Direct Inquiry',
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
  onCreate: (values: CreateProspectInput, action?: 'new' | 'finish') => void
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
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [error, setError] = useState('')

  const age = useMemo(() => ageFromDateOfBirth(dateOfBirth), [dateOfBirth])
  const isMinor = age != null && age < 18

  function resetBlank() {
    setFirstName('')
    setEmail('')
    setDateOfBirth('')
    setParentName('')
    setParentEmail('')
    setParentPhone('')
    setError('')
  }

  function submit(action: 'new' | 'finish') {
    const trimmedName = firstName.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) {
      setError('First name is required.')
      return
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('A valid email is required.')
      return
    }
    if (!organization) {
      setError('Organization is required.')
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

    onCreate(
      {
        name: trimmedName,
        firstName: trimmedName,
        lastName: '',
        email: trimmedEmail,
        notes: '',
        source: catalogNames('Acquisition Channels')[0] || 'Direct Inquiry',
        workArea: (['Modeling', 'Acting', 'Influencing', 'Sports', 'Music'] as WorkArea[]).find((area) =>
          catalogNames('Roster Groups').includes(area),
        ) || 'Modeling',
        organization,
        dateOfBirth,
        interestLevel: 5,
        preferredContact: 'email' as PreferredContactMethod,
        representationType: 'exclusive' as RepresentationType,
        termLengthYears: 1 as TermLengthYears,
        assignedAgentId: agent.id,
        assignedAgentName: agent.name,
        createdById: agent.id,
        createdByName: agent.name,
        isMinor,
        parentName: isMinor ? parentName.trim() : undefined,
        parentEmail: isMinor ? parentEmail.trim() : undefined,
        parentPhone: isMinor ? parentPhone.trim() : undefined,
        messageEmails,
      },
      action,
    )
    if (action === 'new') resetBlank()
  }

  const dirty = Boolean(
    firstName.trim() ||
      email.trim() ||
      dateOfBirth ||
      parentName.trim() ||
      parentEmail.trim() ||
      parentPhone.trim(),
  )
  const { requestClose, dialog } = useUnsavedClose(dirty, onClose)

  return (
    <>
      <ModalShell title="Create prospect" onClose={requestClose} width={520}>
        <Field label="Organization *">
          <select style={inputStyle} value={organization} onChange={(e) => setOrganization(e.target.value)}>
            {orgOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
        <Field label="First name *">
          <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field label="Email *">
          <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Date of birth *">
          <input type="date" style={inputStyle} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          {age != null && (
            <div style={{ fontSize: 11, color: isMinor ? T.amber : T.t3, marginTop: 4 }}>
              Age {age}
              {isMinor ? ' — minor; parent/guardian contact required' : ''}
            </div>
          )}
        </Field>

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
            <Field label="Parent email *">
              <input style={inputStyle} type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
            </Field>
            <Field label="Parent phone *">
              <input style={inputStyle} type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
            </Field>
          </div>
        )}

        {error && <div style={{ color: T.red, fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Btn variant="secondary" onClick={requestClose}>
            Cancel
          </Btn>
          <Btn variant="secondary" onClick={() => submit('new')}>
            Save and New
          </Btn>
          <Btn onClick={() => submit('finish')}>Save and Finish</Btn>
        </div>
      </ModalShell>
      {dialog}
    </>
  )
}
