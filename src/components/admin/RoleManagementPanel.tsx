import { useCallback, useEffect, useState } from 'react'
import type { Role, User } from '@/types'
import { ROLE_LABELS, ROLE_STAGE_ACCESS } from '@/constants/roles'
import { STAGE_LABELS } from '@/constants/stages'
import { listUsers, updateUserRole } from '@/services/admin.service'
import { useAuth } from '@/hooks/useAuth'
import { T } from '@/lib/tokens'
import { Av, Btn, TH, TD } from '@/components/ui-compat'

export function RoleManagementPanel() {
  const { companyCode, user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [pending, setPending] = useState<Record<string, Role>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { users: rows, error: err } = await listUsers(companyCode || 'NZG')
    setUsers(rows)
    if (err) setError(err)
    setLoading(false)
  }, [companyCode])

  useEffect(() => {
    void load()
  }, [load])

  async function saveRole(userId: string) {
    const role = pending[userId]
    if (!role) return
    setSavingId(userId)
    setError('')
    setSuccess('')
    const { error: err } = await updateUserRole(userId, role)
    setSavingId(null)
    if (err) {
      setError(err)
    } else {
      setSuccess('Role updated successfully.')
      setPending((p) => {
        const next = { ...p }
        delete next[userId]
        return next
      })
      void load()
    }
  }

  const roles = Object.entries(ROLE_LABELS) as [Role, string][]

  return (
    <div style={{ padding: '14px 18px', flex: 1, overflowY: 'auto' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, marginBottom: 4, fontFamily: 'Georgia, serif' }}>
        Role Management
      </div>
      <div style={{ fontSize: 12, color: T.t3, marginBottom: 16 }}>
        Reassign roles and review stage access per role
      </div>

      {error && (
        <div style={{ background: T.redL, color: T.red, padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: T.greenL, color: T.green, padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
          {success}
        </div>
      )}

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 10 }}>
          Permission Matrix (read-only)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <TH>Role</TH>
              <TH>Accessible Stages</TH>
            </tr>
          </thead>
          <tbody>
            {roles.map(([role, label]) => (
              <tr key={role}>
                <TD>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                </TD>
                <TD muted>
                  {ROLE_STAGE_ACCESS[role].map((s) => STAGE_LABELS[s]).join(', ')}
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading ? (
        <div style={{ color: T.t3 }}>Loading…</div>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#fff',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr>
              <TH>User</TH>
              <TH>Current Role</TH>
              <TH>New Role</TH>
              <TH>Action</TH>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Av user={u} size={26} />
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                  </div>
                </TD>
                <TD>
                  <span style={{ color: u.color, fontWeight: 600 }}>{ROLE_LABELS[u.role]}</span>
                </TD>
                <TD>
                  <select
                    value={pending[u.id] ?? u.role}
                    onChange={(e) =>
                      setPending((p) => ({ ...p, [u.id]: e.target.value as Role }))
                    }
                    disabled={u.id === currentUser?.id}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: `1px solid ${T.inputBorder}`,
                      fontSize: 12,
                      fontFamily: 'inherit',
                    }}
                  >
                    {roles.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </TD>
                <TD>
                  <Btn
                    sm
                    disabled={
                      savingId === u.id ||
                      u.id === currentUser?.id ||
                      (pending[u.id] ?? u.role) === u.role
                    }
                    onClick={() => void saveRole(u.id)}
                  >
                    {savingId === u.id ? 'Saving…' : 'Save'}
                  </Btn>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
