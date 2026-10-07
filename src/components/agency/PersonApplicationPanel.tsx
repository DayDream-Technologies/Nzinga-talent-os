import { useState } from 'react'
import { isAppComplete } from '@/constants/app-sections'
import { ageFromDateOfBirth } from '@/components/agency/CreateProspectModal'
import { Btn, Card, Field, ModalShell, Table, inputStyle } from '@/components/agency/AgencyUI'
import { T } from '@/lib/tokens'
import type { Application } from '@/types'

export interface CoApplicant {
  type: string
  name: string
  email: string
  status: string
}

export function applicationCompletionLabel(app: Application | null | undefined, dob?: string): string {
  const minor =
    (dob ? (ageFromDateOfBirth(dob) ?? 99) < 18 : false) ||
    app?.guardian_status === 'pending' ||
    app?.guardian_status === 'completed' ||
    app?.status === 'pending_guardian'
  const required = minor ? 2 : 1
  const primaryDone = Boolean(
    app && isAppComplete(app) && (app.status === 'submitted' || app.status === 'pending_guardian'),
  )
  const guardianDone = app?.guardian_status === 'completed'
  const done = Math.min(required, (primaryDone ? 1 : 0) + (minor && guardianDone ? 1 : 0))
  return `${done} of ${required}`
}

function readCoApplicants(app: Application): CoApplicant[] {
  const raw = app.data?.co_applicants
  if (typeof raw !== 'string' || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw) as CoApplicant[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function PersonApplicationPanel({
  application,
  onAddApplicant,
}: {
  application: Application
  onAddApplicant?: (next: Application) => void
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('Co-signer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const extras = readCoApplicants(application)
  const rows = [
    {
      type: 'Applicant',
      name: application.talent_name,
      email: application.talent_email,
      status: application.status,
    },
    ...extras,
  ]

  return (
    <Card hover={false} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.t3 }}>APPLICATIONS</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Applications completed{' '}
            <strong>{applicationCompletionLabel(application, String(application.data?.dob || ''))}</strong>
          </div>
        </div>
        <Btn variant="secondary" onClick={() => setOpen(true)}>
          + Add
        </Btn>
      </div>
      <Table
        headers={['Type', 'Name', 'Email', 'Status']}
        rows={rows.map((row) => [row.type, row.name, row.email, row.status])}
      />
      {open && (
        <ModalShell title="Add Applicant" onClose={() => setOpen(false)} width={420}>
          <Field label="Applicant type">
            <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
              <option>Co-signer</option>
              <option>Parent / guardian</option>
              <option>Applicant</option>
            </select>
          </Field>
          <Field label="Full name">
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn
              onClick={() => {
                if (!name.trim() || !email.trim()) return
                const next: CoApplicant[] = [...extras, { type, name: name.trim(), email: email.trim(), status: 'Added' }]
                onAddApplicant?.({
                  ...application,
                  data: { ...application.data, co_applicants: JSON.stringify(next) },
                })
                setOpen(false)
                setName('')
                setEmail('')
              }}
            >
              Save
            </Btn>
          </div>
        </ModalShell>
      )}
    </Card>
  )
}
