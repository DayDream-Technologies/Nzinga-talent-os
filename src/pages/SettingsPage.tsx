// @ts-nocheck
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { getRcConnectionStatus, getRcAuthUrl, disconnectRc } from '@/lib/phone'
import type { RcConnectionStatus } from '@/lib/ringcentral-types'
import { updatePassword } from '@/services/auth.service'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { readStorage, STORAGE_THEME, writeStorage } from '@/lib/session-storage'
import { T } from '@/lib/tokens'

const RC_ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Authorization was cancelled or incomplete.',
  invalid_state: 'Invalid OAuth state — please try connecting again.',
  token_exchange: 'RingCentral token exchange failed. Check your app credentials.',
  store_tokens: 'Connected to RingCentral but failed to save tokens. Contact support.',
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  if (theme === 'dark') {
    root.style.setProperty('--color-page-bg', '#0f172a')
    root.style.setProperty('--color-card-bg', '#1e293b')
    root.style.setProperty('--color-t1', '#f8fafc')
    root.style.setProperty('--color-t2', '#e2e8f0')
    root.style.setProperty('--color-t3', '#94a3b8')
  } else {
    root.style.setProperty('--color-page-bg', '#f0f2f5')
    root.style.setProperty('--color-card-bg', '#ffffff')
    root.style.setProperty('--color-t1', '#111827')
    root.style.setProperty('--color-t2', '#374151')
    root.style.setProperty('--color-t3', '#6b7280')
  }
}

export function SettingsPage() {
  const { user } = useAuthContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [rcStatus, setRcStatus] = useState<RcConnectionStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const [displayName, setDisplayName] = useState(user?.name || '')
  const [displayTitle, setDisplayTitle] = useState(user?.title || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (readStorage(STORAGE_THEME) === 'dark' ? 'dark' : 'light'))
  const [mfaMsg, setMfaMsg] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaQr, setMfaQr] = useState('')
  const [mfaCode, setMfaCode] = useState('')

  useEffect(() => {
    applyTheme(theme)
    writeStorage(STORAGE_THEME, theme)
  }, [theme])

  useEffect(() => {
    const rc = searchParams.get('rc')
    const reason = searchParams.get('reason')

    if (rc === 'connected') {
      setMessage('RingCentral connected successfully!')
      setMessageType('success')
      setSearchParams({}, { replace: true })
    } else if (rc === 'error') {
      setMessage(RC_ERROR_MESSAGES[reason || ''] || 'RingCentral connection failed. Please try again.')
      setMessageType('error')
      setSearchParams({}, { replace: true })
    }

    loadStatus()
  }, [])

  async function loadStatus() {
    setLoading(true)
    const status = await getRcConnectionStatus()
    setRcStatus(status)
    setLoading(false)
  }

  async function handleConnect() {
    setActionLoading(true)
    setMessage('')
    const url = await getRcAuthUrl()
    setActionLoading(false)
    if (url) {
      window.location.href = url
    } else {
      setMessage('RingCentral is not configured on this environment.')
      setMessageType('error')
    }
  }

  async function handleDisconnect() {
    setActionLoading(true)
    setMessage('')
    const ok = await disconnectRc()
    setActionLoading(false)
    if (ok) {
      setRcStatus({ connected: false })
      setMessage('RingCentral disconnected.')
      setMessageType('success')
    } else {
      setMessage('Failed to disconnect.')
      setMessageType('error')
    }
  }

  async function handleChangePassword() {
    setPwMsg('')
    if (newPassword.length < 8) {
      setPwMsg('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg('Passwords do not match.')
      return
    }
    const result = await updatePassword(newPassword)
    if (!supabaseConfigured) {
      setPwMsg('Demo mode: password change simulated for this session.')
      setNewPassword('')
      setConfirmPassword('')
      return
    }
    if (result?.error) setPwMsg(result.error)
    else {
      setPwMsg('Password updated.')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function startMfaEnroll() {
    setMfaMsg('')
    if (!supabaseConfigured || !supabase) {
      setMfaMsg('Two-person verification / TOTP MFA: enable in Supabase Auth (Authentication → Providers → MFA). Coming soon in demo mode.')
      return
    }
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Nzinga Talent OS' })
      if (error) {
        setMfaMsg(error.message)
        return
      }
      setMfaFactorId(data.id)
      setMfaQr(data.totp?.qr_code || data.totp?.uri || '')
      setMfaMsg('Scan the QR with your authenticator app, then enter the code below.')
    } catch (e) {
      setMfaMsg(e?.message || 'MFA enrollment failed. Ensure MFA is enabled in Supabase Auth.')
    }
  }

  async function verifyMfa() {
    if (!supabaseConfigured || !supabase || !mfaFactorId) return
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
    if (cErr) {
      setMfaMsg(cErr.message)
      return
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: mfaCode,
    })
    setMfaMsg(error ? error.message : 'Two-factor authentication enabled.')
  }

  const card = {
    background: 'var(--color-card-bg, #fff)',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  }

  return (
    <div style={{ padding: 28, maxWidth: 720, overflow: 'auto', height: '100%' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>Settings</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Profile, security, display, and integrations.</p>

      {message && (
        <div style={{
          background: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${messageType === 'success' ? '#86efac' : '#fca5a5'}`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 13,
          color: messageType === 'success' ? '#15803d' : '#dc2626',
        }}>
          {message}
        </div>
      )}

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, marginBottom: 12 }}>Profile</div>
        <label style={{ display: 'block', fontSize: 11, color: T.t3, marginBottom: 4 }}>Display name</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 10, fontFamily: 'inherit' }} />
        <label style={{ display: 'block', fontSize: 11, color: T.t3, marginBottom: 4 }}>Title</label>
        <input value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 10, fontFamily: 'inherit' }} />
        <div style={{ fontSize: 12, color: T.t3 }}>Email: <strong style={{ color: T.t1 }}>{user?.email}</strong></div>
        <div style={{ fontSize: 11, color: T.t4, marginTop: 8 }}>Name/title updates apply to this session display. Persist to staff profile when DB profile update is available.</div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, marginBottom: 12 }}>Change password</div>
        <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 8, fontFamily: 'inherit' }} />
        <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 10, fontFamily: 'inherit' }} />
        <button type="button" onClick={() => void handleChangePassword()} style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Update password</button>
        {pwMsg && <div style={{ marginTop: 8, fontSize: 12, color: T.t3 }}>{pwMsg}</div>}
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, marginBottom: 12 }}>Display</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              style={{
                padding: '8px 14px',
                borderRadius: 7,
                border: `1px solid ${theme === t ? T.blue : '#e5e7eb'}`,
                background: theme === t ? '#eff6ff' : '#fff',
                color: theme === t ? T.blue : T.t2,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, marginBottom: 8 }}>Two-person verification / 2FA</div>
        <p style={{ fontSize: 12, color: T.t3, marginBottom: 12, lineHeight: 1.5 }}>
          Enroll a TOTP authenticator for your staff login. Requires MFA enabled in Supabase Auth.
        </p>
        <button type="button" onClick={() => void startMfaEnroll()} style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
          Enable 2FA
        </button>
        {mfaQr && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: T.t3, marginBottom: 6 }}>Authenticator setup</div>
            <div style={{ fontSize: 11, wordBreak: 'break-all', color: T.t2, marginBottom: 8 }}>{mfaQr}</div>
            <input value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="6-digit code" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginRight: 8, fontFamily: 'inherit' }} />
            <button type="button" onClick={() => void verifyMfa()} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Verify</button>
          </div>
        )}
        {mfaMsg && <div style={{ fontSize: 12, color: T.t3 }}>{mfaMsg}</div>}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>
            RC
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>RingCentral</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Click-to-call, SMS, and call recording</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {loading ? (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>Loading…</span>
            ) : rcStatus.connected ? (
              <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                ✓ Connected
              </span>
            ) : (
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                Not Connected
              </span>
            )}
          </div>
        </div>

        {!loading && !rcStatus.connected && (
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
            Connect your RingCentral extension to enable click-to-call and SMS from talent records.
          </div>
        )}

        {!loading && rcStatus.connected && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <span style={{ color: '#6b7280' }}>Phone Number: </span>
                <span style={{ fontWeight: 600, color: '#111' }}>{rcStatus.phone_number || '—'}</span>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Extension: </span>
                <span style={{ fontWeight: 600, color: '#111' }}>{rcStatus.extension_id || '—'}</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {!rcStatus.connected || rcStatus.expired ? (
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {actionLoading ? '…' : rcStatus.expired ? 'Reconnect' : 'Connect RingCentral'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {actionLoading ? '…' : 'Disconnect'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
