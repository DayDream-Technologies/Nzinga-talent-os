import { useCallback, useEffect, useState } from 'react'
import type { CompanyCodeRow, SystemSetting } from '@/services/admin.service'
import {
  addCompanyCode,
  getSystemSettings,
  listCompanyCodes,
  toggleCompanyCode,
  updateSystemSetting,
} from '@/services/admin.service'
import { T } from '@/lib/tokens'
import { Btn, TH, TD } from '@/components/ui-compat'
import { ConfirmDialog, useUnsavedNavigation } from '@/components/ui/ConfirmDialog'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { LookupCatalogs } from '@/components/admin/LookupCatalogs'
import { isChaseConnected, isPlaidConnected, isStripeConnected } from '@/lib/integrations'

export function SystemSettingsPanel() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [codes, setCodes] = useState<CompanyCodeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<'codes' | 'general' | 'email' | 'financial' | 'catalogs'>('codes')
  const [newCode, setNewCode] = useState('')
  const [pendingDeactivateCode, setPendingDeactivateCode] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [settingsRes, codesRes] = await Promise.all([getSystemSettings(), listCompanyCodes()])
    setSettings(settingsRes.settings)
    setCodes(codesRes.codes)
    if (settingsRes.error) setError(settingsRes.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function saveSetting(key: string) {
    setError('')
    setSuccess('')
    let parsed: unknown = editValue
    try {
      parsed = JSON.parse(editValue)
    } catch {
      parsed = editValue.replace(/^"|"$/g, '')
    }
    const { error: err } = await updateSystemSetting(key, parsed)
    if (err) {
      setError(err)
    } else {
      setSuccess(`Updated ${key}`)
      setEditingKey(null)
      void load()
    }
  }

  async function handleToggleCode(code: string, active: boolean) {
    const { error: err } = await toggleCompanyCode(code, active)
    if (err) setError(err)
    else void load()
  }

  async function handleAddCode() {
    if (!newCode.trim()) return
    const { error: err } = await addCompanyCode(newCode.trim())
    if (err) setError(err)
    else {
      setNewCode('')
      setSuccess(`Added company code ${newCode.toUpperCase()}`)
      void load()
    }
  }

  function displayValue(value: unknown) {
    if (typeof value === 'string') return value
    return JSON.stringify(value)
  }

  const dirty = editingKey !== null || newCode.trim().length > 0
  const unsavedDialog = useUnsavedNavigation(dirty)

  return (
    <div style={{ padding: '14px 18px', flex: 1, overflowY: 'auto' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>
        System Settings
      </div>
      <div style={{ fontSize: 12, color: T.t3, marginBottom: 16 }}>
        Manage global agency configurations, company codes, and application defaults
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {([
          ['codes', 'Company Codes'],
          ['general', 'General'],
          ['email', 'Email & Notifications'],
          ['financial', 'Financial Defaults'],
          ['catalogs', 'Agency Catalogs'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: `1px solid ${tab === id ? T.blue : T.cardBorder}`,
              background: tab === id ? T.blue : T.cardBg,
              color: tab === id ? '#fff' : T.t1,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
            }}
          >
            {label}
          </button>
        ))}
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

      {loading ? (
        <div style={{ color: T.t3 }}>Loading settings…</div>
      ) : (
        <>
          {tab === 'codes' && (
          <div
            style={{
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: 8,
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '9px 12px', borderBottom: '2px solid ' + T.blue, background: T.mutedBg, fontWeight: 700, fontSize: 12 }}>
              Company Codes
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Code</TH>
                  <TH>Status</TH>
                  <TH>Action</TH>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.code}>
                    <TD>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{c.code}</span>
                    </TD>
                    <TD>
                      <span style={{ color: c.active ? T.green : T.red, fontWeight: 600, fontSize: 11 }}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </TD>
                    <TD>
                      <Btn
                        sm
                        onClick={() => {
                          if (c.active) setPendingDeactivateCode(c.code)
                          else void handleToggleCode(c.code, true)
                        }}
                      >
                        {c.active ? 'Deactivate' : 'Activate'}
                      </Btn>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: 12, display: 'flex', gap: 8, borderTop: '1px solid #f0f0f0' }}>
              <input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="New code"
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: `1px solid ${T.inputBorder}`,
                  fontSize: 12,
                  width: 120,
                  fontFamily: 'monospace',
                }}
              />
              <Btn sm onClick={() => void handleAddCode()}>
                Add Code
              </Btn>
            </div>
          </div>
          )}

          {tab === 'catalogs' && <LookupCatalogs />}

          {tab === 'financial' && (
            <>
              {!isStripeConnected() && <IntegrationNotice id="stripe" />}
              {!isPlaidConnected() && <IntegrationNotice id="plaid" />}
              {!isChaseConnected() && <IntegrationNotice id="chase" />}
            </>
          )}

          {tab !== 'codes' && tab !== 'catalogs' && (
          <div
            style={{
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '9px 12px', borderBottom: '2px solid ' + T.purple, background: T.mutedBg, fontWeight: 700, fontSize: 12 }}>
              Application Settings
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Key</TH>
                  <TH>Value</TH>
                  <TH>Updated</TH>
                  <TH>Action</TH>
                </tr>
              </thead>
              <tbody>
                {settings.map((s) => (
                  <tr key={s.key}>
                    <TD>
                      <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.key}</span>
                    </TD>
                    <TD>
                      {editingKey === s.key ? (
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: `1px solid ${T.inputBorder}`,
                            fontSize: 12,
                          }}
                        />
                      ) : (
                        <TD muted>{displayValue(s.value)}</TD>
                      )}
                    </TD>
                    <TD muted>{s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '—'}</TD>
                    <TD>
                      {editingKey === s.key ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn sm onClick={() => void saveSetting(s.key)}>
                            Save
                          </Btn>
                          <Btn sm variant="ghost" onClick={() => setEditingKey(null)}>
                            Cancel
                          </Btn>
                        </div>
                      ) : (
                        <Btn
                          sm
                          variant="ghost"
                          onClick={() => {
                            setEditingKey(s.key)
                            setEditValue(displayValue(s.value))
                          }}
                        >
                          Edit
                        </Btn>
                      )}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </>
      )}
      {unsavedDialog}
      <ConfirmDialog
        open={!!pendingDeactivateCode}
        title="Deactivate company code?"
        message={`Deactivate ${pendingDeactivateCode || ''}? Users with this code will not be able to sign in until it is activated again.`}
        confirmLabel="Deactivate"
        danger
        onCancel={() => setPendingDeactivateCode(null)}
        onConfirm={() => {
          const code = pendingDeactivateCode
          setPendingDeactivateCode(null)
          if (code) void handleToggleCode(code, false)
        }}
      />
    </div>
  )
}
