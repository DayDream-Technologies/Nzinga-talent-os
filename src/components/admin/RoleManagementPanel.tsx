import { useEffect, useMemo, useState } from 'react'
import type { Role, RoleDefinition, RolePermission, TalentStage, User } from '@/types'
import { ROLE_PERMISSIONS, ROLE_PERMISSION_LABELS } from '@/types/user'
import { STAGES, STAGE_LABELS } from '@/constants/stages'
import { roleLabel, slugFromRoleName } from '@/constants/roles'
import { ROLE_MODULE_PATH_OPTIONS } from '@/constants/agency-module-paths'
import { listUsers, updateUserRole } from '@/services/admin.service'
import { createRoleDef, deleteRoleDef, updateRoleDef } from '@/services/roles.service'
import { useAuth } from '@/hooks/useAuth'
import { useRoles } from '@/context/RolesContext'
import { T } from '@/lib/tokens'
import { Av, Btn, TH, TD } from '@/components/ui-compat'

const EDITABLE_PERMISSIONS = ROLE_PERMISSIONS.filter((p) => p !== 'admin_access')

function emptyDraft(copy?: RoleDefinition): {
  name: string
  description: string
  copyFrom: string
  stage_access: TalentStage[]
  module_paths: string[]
  permissions: RolePermission[]
  action_stage: TalentStage
} {
  return {
    name: copy ? `${copy.name} copy` : '',
    description: copy?.description || '',
    copyFrom: copy?.slug || '',
    stage_access: copy ? [...copy.stage_access] : [],
    module_paths: copy ? [...copy.module_paths] : [],
    permissions: copy ? copy.permissions.filter((p) => p !== 'admin_access') : [],
    action_stage: copy?.action_stage || 'holding_entry',
  }
}

function toggleList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

export function RoleManagementPanel() {
  const { companyCode, user: currentUser } = useAuth()
  const { roles, reload } = useRoles()
  const [users, setUsers] = useState<User[]>([])
  const [pending, setPending] = useState<Record<string, Role>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [draft, setDraft] = useState(emptyDraft())
  const [savingDef, setSavingDef] = useState(false)

  async function loadUsers() {
    setLoading(true)
    const { users: rows, error: err } = await listUsers(companyCode || 'NZG')
    setUsers(rows)
    if (err) setError(err)
    setLoading(false)
  }

  useEffect(() => {
    void loadUsers()
  }, [companyCode])

  const assignedCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const u of users) counts[u.role] = (counts[u.role] || 0) + 1
    return counts
  }, [users])

  async function saveUserRole(userId: string) {
    const role = pending[userId]
    if (!role) return
    setSavingId(userId)
    setError('')
    setSuccess('')
    const { error: err } = await updateUserRole(userId, role)
    setSavingId(null)
    if (err) setError(err)
    else {
      setSuccess('Role updated successfully.')
      setPending((p) => {
        const next = { ...p }
        delete next[userId]
        return next
      })
      void loadUsers()
    }
  }

  function startCreate(copy?: RoleDefinition) {
    setEditingSlug(null)
    setDraft(emptyDraft(copy))
    setShowCreate(true)
  }

  function startEdit(role: RoleDefinition) {
    setEditingSlug(role.slug)
    setDraft({
      name: role.name,
      description: role.description,
      copyFrom: '',
      stage_access: [...role.stage_access],
      module_paths: [...role.module_paths],
      permissions: [...role.permissions],
      action_stage: role.action_stage,
    })
    setShowCreate(true)
  }

  async function saveDefinition() {
    if (!draft.name.trim()) {
      setError('Role name is required.')
      return
    }
    setSavingDef(true)
    setError('')
    setSuccess('')
    if (editingSlug) {
      const { error: err } = await updateRoleDef(editingSlug, draft)
      if (err) setError(err)
      else {
        setSuccess('Role saved.')
        setShowCreate(false)
        await reload()
      }
    } else {
      const { error: err } = await createRoleDef({
        ...draft,
        slug: slugFromRoleName(draft.name),
      })
      if (err) setError(err)
      else {
        setSuccess('Role created.')
        setShowCreate(false)
        await reload()
      }
    }
    setSavingDef(false)
  }

  async function removeRole(role: RoleDefinition) {
    if (role.is_system) return
    if ((assignedCounts[role.slug] || 0) > 0) {
      setError('Cannot delete a role that is still assigned to users.')
      return
    }
    setError('')
    const { error: err } = await deleteRoleDef(role.slug)
    if (err) setError(err)
    else {
      setSuccess('Role deleted.')
      await reload()
    }
  }

  const editingRole = editingSlug ? roles.find((r) => r.slug === editingSlug) : null

  return (
    <div style={{ padding: '14px 18px', flex: 1, overflowY: 'auto' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>
        Role Management
      </div>
      <div style={{ fontSize: 12, color: T.t3, marginBottom: 16 }}>
        Create roles, set stage and module access, and assign staff
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
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 8,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>Roles</div>
          <Btn sm onClick={() => startCreate()}>
            Create role
          </Btn>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <TH>Role</TH>
              <TH>Stages</TH>
              <TH>Capabilities</TH>
              <TH>Users</TH>
              <TH>Action</TH>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.slug}>
                <TD>
                  <div style={{ fontWeight: 600 }}>{role.name}</div>
                  <div style={{ color: T.t4, fontSize: 10 }}>{role.slug}{role.is_system ? ' · system' : ''}</div>
                </TD>
                <TD muted>{role.stage_access.map((s) => STAGE_LABELS[s] || s).join(', ') || '—'}</TD>
                <TD muted>{role.permissions.length ? role.permissions.join(', ') : '—'}</TD>
                <TD>{assignedCounts[role.slug] || 0}</TD>
                <TD>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Btn sm onClick={() => startEdit(role)}>
                      Edit
                    </Btn>
                    <Btn sm onClick={() => startCreate(role)}>
                      Copy
                    </Btn>
                    {!role.is_system && (
                      <Btn sm variant="danger" onClick={() => void removeRole(role)}>
                        Delete
                      </Btn>
                    )}
                  </div>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div
          style={{
            background: T.cardBg,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: 8,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 10 }}>
            {editingSlug ? `Edit ${editingRole?.name || editingSlug}` : 'Create role'}
          </div>
          {!editingSlug && (
            <label style={{ display: 'block', fontSize: 11, marginBottom: 10, color: T.t2 }}>
              Copy from
              <select
                value={draft.copyFrom}
                onChange={(e) => {
                  const copy = roles.find((r) => r.slug === e.target.value)
                  setDraft(emptyDraft(copy))
                }}
                style={{ display: 'block', marginTop: 4, padding: '6px 8px', borderRadius: 6, border: `1px solid ${T.inputBorder}`, width: '100%' }}
              >
                <option value="">Start blank</option>
                {roles.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label style={{ display: 'block', fontSize: 11, marginBottom: 10, color: T.t2 }}>
            Name
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              style={{ display: 'block', marginTop: 4, padding: '6px 8px', borderRadius: 6, border: `1px solid ${T.inputBorder}`, width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ display: 'block', fontSize: 11, marginBottom: 10, color: T.t2 }}>
            Description
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={3}
              style={{ display: 'block', marginTop: 4, padding: '6px 8px', borderRadius: 6, border: `1px solid ${T.inputBorder}`, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </label>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Pipeline stages</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {STAGES.map((stage) => (
              <label key={stage} style={{ fontSize: 11, display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={draft.stage_access.includes(stage)}
                  onChange={() => setDraft((d) => ({ ...d, stage_access: toggleList(d.stage_access, stage) }))}
                />
                {STAGE_LABELS[stage]}
              </label>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Capabilities</div>
          <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            {EDITABLE_PERMISSIONS.map((perm) => (
              <label key={perm} style={{ fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={draft.permissions.includes(perm)}
                  onChange={() => setDraft((d) => ({ ...d, permissions: toggleList(d.permissions, perm) }))}
                />
                {ROLE_PERMISSION_LABELS[perm]}
              </label>
            ))}
            {editingRole?.permissions.includes('admin_access') && (
              <div style={{ fontSize: 11, color: T.t4 }}>Admin access is locked on the Director system role.</div>
            )}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Modules</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
            {ROLE_MODULE_PATH_OPTIONS.map((path) => (
              <label key={path} style={{ fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={draft.module_paths.includes(path)}
                  onChange={() => setDraft((d) => ({ ...d, module_paths: toggleList(d.module_paths, path) }))}
                />
                {path}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" sm disabled={savingDef} onClick={() => void saveDefinition()}>
              {savingDef ? 'Saving…' : editingSlug ? 'Save role' : 'Create role'}
            </Btn>
            <Btn sm variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Btn>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: T.t3 }}>Loading…</div>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: T.cardBg,
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
                  <span style={{ color: u.color, fontWeight: 600 }}>{roleLabel(u.role)}</span>
                </TD>
                <TD>
                  <select
                    value={pending[u.id] ?? u.role}
                    onChange={(e) => setPending((p) => ({ ...p, [u.id]: e.target.value }))}
                    disabled={u.id === currentUser?.id}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: `1px solid ${T.inputBorder}`,
                      fontSize: 12,
                      fontFamily: 'inherit',
                    }}
                  >
                    {roles.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.name}
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
                    onClick={() => void saveUserRole(u.id)}
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
