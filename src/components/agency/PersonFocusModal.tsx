import { useState } from 'react'
import { Btn, Field, ModalShell, inputStyle } from '@/components/agency/AgencyUI'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { isPlaidConnected, isScreeningConnected } from '@/lib/integrations'
import {
  readTalentPortalPrefs,
  writeTalentPortalPrefs,
  type TalentNotificationChannel,
} from '@/lib/talent-settings'
import { T } from '@/lib/tokens'

export type PersonFocus =
  | 'portal-access'
  | 'notifications'
  | 'payment-settings'
  | 'stage-status'
  | 'assigned-team'
  | 'screening'

const TITLES: Record<PersonFocus, string> = {
  'portal-access': 'Portal access',
  notifications: 'Notifications',
  'payment-settings': 'Payment settings',
  'stage-status': 'Stage',
  'assigned-team': 'Assigned team',
  screening: 'Screening',
}

function readable(value?: string | null): string {
  if (!value) return '—'
  return value.replace(/_/g, ' ')
}

export function PersonFocusModal({
  focus,
  displayName,
  email,
  phone,
  accessCode,
  applicationStatus,
  prospectStage,
  pipelineStage,
  assignedAgent,
  screeningStatus,
  screeningUpdatedAt,
  bankReady,
  taxFormsReady,
  hasRoster,
  onClose,
  onSaveContact,
  onSavePayment,
}: {
  focus: PersonFocus
  displayName: string
  email?: string
  phone?: string
  accessCode?: string
  applicationStatus?: string
  prospectStage?: string
  pipelineStage?: string
  assignedAgent?: string
  screeningStatus?: string
  screeningUpdatedAt?: string | null
  bankReady?: boolean
  taxFormsReady?: boolean
  hasRoster?: boolean
  onClose: () => void
  onSaveContact: (email: string, phone: string) => void
  onSavePayment: (bankReady: boolean, taxFormsReady: boolean) => void
}) {
  const [nextEmail, setNextEmail] = useState(email || '')
  const [nextPhone, setNextPhone] = useState(phone || '')
  const [bank, setBank] = useState(Boolean(bankReady))
  const [tax, setTax] = useState(Boolean(taxFormsReady))
  const [channel, setChannel] = useState<TalentNotificationChannel>(
    () => readTalentPortalPrefs(email || '').notifications,
  )

  const title = `${TITLES[focus]} · ${displayName}`

  return (
    <ModalShell title={title} onClose={onClose} width={480}>
      <p style={{ fontSize: 13, color: T.t3, marginTop: 0 }}>
        These settings belong to {displayName}, not your staff account.
      </p>
      {focus === 'portal-access' && (
        <>
          <Field label="Email">
            <input value={nextEmail} onChange={(e) => setNextEmail(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Phone">
            <input value={nextPhone} onChange={(e) => setNextPhone(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Application access code">
            <input value={accessCode || '—'} readOnly style={inputStyle} />
          </Field>
          <p style={{ fontSize: 12, color: T.t3 }}>Application status: {readable(applicationStatus)}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
            <Btn onClick={() => onSaveContact(nextEmail.trim(), nextPhone.trim())}>Save</Btn>
          </div>
        </>
      )}
      {focus === 'notifications' && (
        <>
          <p style={{ fontSize: 13, color: T.t2 }}>
            {email ? `Portal alerts for ${email}.` : 'Add an email on portal access before notification preferences can be saved.'}
          </p>
          {(
            [
              ['both', 'Email and portal'],
              ['email', 'Email only'],
              ['portal', 'Portal only'],
            ] as const
          ).map(([id, label]) => (
            <label key={id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginBottom: 8 }}>
              <input
                type="radio"
                name="person-notifications"
                checked={channel === id}
                disabled={!email}
                onChange={() => {
                  setChannel(id)
                  if (email) writeTalentPortalPrefs(email, { ...readTalentPortalPrefs(email), notifications: id })
                }}
              />
              {label}
            </label>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={onClose}>Done</Btn>
          </div>
        </>
      )}
      {focus === 'payment-settings' && (
        <>
          {!isPlaidConnected() && <IntegrationNotice id="plaid" compact />}
          {hasRoster ? (
            <>
              <label style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 8 }}>
                <input type="checkbox" checked={bank} onChange={(e) => setBank(e.target.checked)} />
                Bank details on file
              </label>
              <label style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 12 }}>
                <input type="checkbox" checked={tax} onChange={(e) => setTax(e.target.checked)} />
                Tax forms on file
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                <Btn onClick={() => onSavePayment(bank, tax)}>Save</Btn>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: T.t2 }}>
              Direct deposit is available after {displayName} is on the roster. Application banking documents stay on the application tab.
            </p>
          )}
        </>
      )}
      {focus === 'stage-status' && (
        <>
          <p style={{ fontSize: 13 }}>Prospect stage: {readable(prospectStage)}</p>
          <p style={{ fontSize: 13 }}>Pipeline: {pipelineStage || '—'}</p>
          <p style={{ fontSize: 13 }}>Application: {readable(applicationStatus)}</p>
        </>
      )}
      {focus === 'assigned-team' && (
        <p style={{ fontSize: 13 }}>Assigned agent: {assignedAgent || 'Unassigned'}</p>
      )}
      {focus === 'screening' && (
        <>
          {!isScreeningConnected() && <IntegrationNotice id="screening" compact />}
          <p style={{ fontSize: 13 }}>Status: {readable(screeningStatus || 'not_started')}</p>
          <p style={{ fontSize: 13, color: T.t3 }}>
            Updated: {screeningUpdatedAt ? new Date(screeningUpdatedAt).toLocaleString() : '—'}
          </p>
          <Btn disabled={!isScreeningConnected()}>Initiate screening</Btn>
        </>
      )}
    </ModalShell>
  )
}
