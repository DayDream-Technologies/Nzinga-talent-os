import { useCallback, useEffect, useState } from 'react'
import type { User } from '@/types'
import { roleLabel } from '@/constants/roles'
import { listUsers, setUserActive } from '@/services/admin.service'
import { useAuth } from '@/hooks/useAuth'
import { T } from '@/lib/tokens'
import { Av, Btn, TH, TD } from '@/components/ui-compat'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface AllUsersPanelProps {
  onManageRoles: () => void
  onInvite: () => void
}

export function AllUsersPanel({ onManageRoles, onInvite }: AllUsersPanelProps) {
  const { companyCode } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [pendingDeactivate, setPendingDeactivate] = useState<(User & { active?: boolean }) | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { users: rows, error: err } = await listUsers(companyCode || 'NZG')
    setUsers(rows)
    if (err) setError(err)
    setLoading(false)
  }, [companyCode])

  useEffect(() => {
    void load()
  }, [load])

  async function toggleActive(user: User & { active?: boolean }) {
    setActionId(user.id)
    const isActive = user.active !== false
    const { error: err } = await setUserActive(user.id, !isActive)
    setActionId(null)
    if (err) {
      setError(err)
    } else {
      void load()
    }
  }

  return (
    <div style={{ padding: '14px 18px', flex: 1, overflowY: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, fontFamily: "'Syne', sans-serif" }}>
            All Users
          </div>
          <div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>
            Team members in {companyCode || 'NZG'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn sm onClick={onManageRoles}>
            Role Management
          </Btn>
          <Btn sm variant="primary" onClick={onInvite}>
            + Invite
          </Btn>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: T.redL,
            border: `1px solid ${T.red}44`,
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 12,
            color: T.red,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: T.t3, fontSize: 13 }}>Loading users…</div>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: T.cardBg,
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <thead>
            <tr>
              <TH>User</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Title</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const active = (u as User & { active?: boolean }).active !== false
              return (
                <tr key={u.id}>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Av user={u} size={28} />
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </TD>
                  <TD muted>{u.email}</TD>
                  <TD>
                    <span style={{ color: u.color, fontWeight: 600, fontSize: 11 }}>
                      {roleLabel(u.role)}
                    </span>
                  </TD>
                  <TD muted>{u.title}</TD>
                  <TD>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: active ? T.green : T.red,
                        background: active ? T.greenL : T.redL,
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </TD>
                  <TD>
                    <Btn
                      sm
                      variant={active ? 'ghost' : 'success'}
                      disabled={actionId === u.id}
                      onClick={() => {
                        if (active) setPendingDeactivate(u as User & { active?: boolean })
                        else void toggleActive(u as User & { active?: boolean })
                      }}
                    >
                      {actionId === u.id ? '…' : active ? 'Deactivate' : 'Reactivate'}
                    </Btn>
                  </TD>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Deactivate this user?"
        message={`${pendingDeactivate?.name || 'This user'} will lose access until they are reactivated.`}
        confirmLabel="Deactivate"
        danger
        onCancel={() => setPendingDeactivate(null)}
        onConfirm={() => {
          const user = pendingDeactivate
          setPendingDeactivate(null)
          if (user) void toggleActive(user)
        }}
      />
    </div>
  )
}
