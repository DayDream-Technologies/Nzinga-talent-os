import { useCallback, useEffect, useState } from 'react'
import type { AuditEntry } from '@/services/admin.service'
import { queryAuditLog } from '@/services/admin.service'
import { USERS } from '@/constants'
import { T } from '@/lib/tokens'
import { Btn, TH, TD } from '@/components/ui-compat'

const EVENT_TYPES = [
  '',
  'role_change',
  'user_deactivated',
  'user_reactivated',
  'user_invited',
  'settings_change',
  'company_code_added',
  'company_code_toggled',
]

export function AuditLogPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventType, setEventType] = useState('')
  const [userId, setUserId] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 25

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { entries: rows, total: count, error: err } = await queryAuditLog({
      event_type: eventType || undefined,
      user_id: userId || undefined,
      limit,
      offset,
    })
    setEntries(rows)
    setTotal(count)
    if (err) setError(err)
    setLoading(false)
  }, [eventType, userId, offset])

  useEffect(() => {
    void load()
  }, [load])

  function formatDetails(details: Record<string, unknown>) {
    if (!details || Object.keys(details).length === 0) return '—'
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(' · ')
  }

  return (
    <div style={{ padding: '14px 18px', flex: 1, overflowY: 'auto' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, marginBottom: 4, fontFamily: 'Georgia, serif' }}>
        Global Audit Log
      </div>
      <div style={{ fontSize: 12, color: T.t3, marginBottom: 14 }}>
        System-wide activity across all users and entities
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select
          value={eventType}
          onChange={(e) => {
            setOffset(0)
            setEventType(e.target.value)
          }}
          style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.inputBorder}`, fontSize: 12 }}
        >
          <option value="">All event types</option>
          {EVENT_TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={userId}
          onChange={(e) => {
            setOffset(0)
            setUserId(e.target.value)
          }}
          style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.inputBorder}`, fontSize: 12 }}
        >
          <option value="">All users</option>
          {USERS.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <Btn sm onClick={() => void load()}>
          Refresh
        </Btn>
      </div>

      {error && (
        <div style={{ background: T.amberL, color: T.amber, padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: T.t3 }}>Loading audit log…</div>
      ) : entries.length === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 28,
            textAlign: 'center',
            color: T.t3,
            fontSize: 13,
          }}
        >
          No audit entries found
        </div>
      ) : (
        <>
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
                <TH>When</TH>
                <TH>User</TH>
                <TH>Action</TH>
                <TH>Entity</TH>
                <TH>Details</TH>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <TD muted>{new Date(e.created_at).toLocaleString()}</TD>
                  <TD>{e.users?.name ?? e.user_id ?? 'System'}</TD>
                  <TD>
                    <span style={{ fontWeight: 600, color: T.blue, fontSize: 11 }}>{e.action}</span>
                  </TD>
                  <TD muted>
                    {e.entity_type}
                    {e.entity_id ? ` / ${e.entity_id}` : ''}
                  </TD>
                  <TD muted>
                    <span style={{ maxWidth: 280, display: 'inline-block' }}>
                      {formatDetails(e.details ?? {})}
                    </span>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: T.t4 }}>
              Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn sm disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - limit))}>
                Previous
              </Btn>
              <Btn sm disabled={offset + limit >= total} onClick={() => setOffset((o) => o + limit)}>
                Next
              </Btn>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
