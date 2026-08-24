import { useState } from 'react'
import type { Role } from '@/types'
import { ROLE_LABELS } from '@/constants/roles'
import { inviteUser, type InvitePayload } from '@/services/invite.service'
import { useAuth } from '@/hooks/useAuth'
import { T } from '@/lib/tokens'
import { useUnsavedClose } from '@/components/ui/ConfirmDialog'

interface InviteUserModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function InviteUserModal({ onClose, onSuccess }: InviteUserModalProps) {
  const { companyCode } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', role: 'scout' as Role, title: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const dirty = Boolean(form.name || form.email || form.title)
  const { requestClose, dialog } = useUnsavedClose(dirty && !success, onClose)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name || !form.email || !form.title) {
      setError('All fields are required.')
      return
    }

    setLoading(true)
    const payload: InvitePayload = {
      ...form,
      company_code: companyCode || 'NZG',
    }

    const { error: err } = await inviteUser(payload)
    setLoading(false)

    if (err) {
      setError(err)
    } else {
      setSuccess(`${form.name} has been invited as ${ROLE_LABELS[form.role]}.`)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    }
  }

  const roles = Object.entries(ROLE_LABELS) as [Role, string][]

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }}
        onClick={requestClose}
      >
        <div
          style={{
            background: T.cardBg,
            borderRadius: 12,
            padding: '28px 32px',
            width: 420,
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={requestClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              color: T.t3,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.t1, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>
            Invite Team Member
          </h2>
          <p style={{ fontSize: 12, color: T.t3, marginBottom: 20 }}>
            They'll receive an email to set up their account.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.t3, marginBottom: 3 }}>
                Full Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Taylor Swift"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  fontSize: 13,
                  color: T.t1,
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.t3, marginBottom: 3 }}>
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@company.co"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  fontSize: 13,
                  color: T.t1,
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.t3, marginBottom: 3 }}>
                Role *
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  fontSize: 13,
                  color: T.t1,
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              >
                {roles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.t3, marginBottom: 3 }}>
                Job Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Talent Scout"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  fontSize: 13,
                  color: T.t1,
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {error && <p style={{ color: T.red, fontSize: 12, marginBottom: 12 }}>{error}</p>}
            {success && <p style={{ color: T.green, fontSize: 12, marginBottom: 12 }}>{success}</p>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={requestClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: `1px solid ${T.inputBorder}`,
                  background: T.cardBg,
                  fontSize: 13,
                  color: T.t2,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: T.purple,
                  fontSize: 13,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {loading ? 'Inviting…' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {dialog}
    </>
  )
}
