// @ts-nocheck
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { getRcConnectionStatus, getRcAuthUrl, disconnectRc } from '@/lib/phone'
import type { RcConnectionStatus } from '@/lib/ringcentral-types'
import { sendPasswordResetEmail } from '@/services/auth.service'
import { saveUserSettings } from '@/services/user-settings.service'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { applyTheme, normalizeUserUiSettings } from '@/lib/user-settings'
import { useSidebarPreference } from '@/hooks/useSidebarPreference'
import { ConfirmDialog, useUnsavedNavigation } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { PageContent } from '@/components/layout/PageContent'
import { T } from '@/lib/tokens'

const RC_ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Authorization was cancelled or incomplete.',
  invalid_state: 'Invalid OAuth state — please try connecting again.',
  token_exchange: 'RingCentral token exchange failed. Check your app credentials.',
  store_tokens: 'Connected to RingCentral but failed to save tokens. Contact support.',
}

export function SettingsPage() {
  const { user, switchUser } = useAuthContext()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [rcStatus, setRcStatus] = useState<RcConnectionStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const savedUi = normalizeUserUiSettings(user?.settings)
  const [displayName, setDisplayName] = useState(user?.name || '')
  const [displayTitle, setDisplayTitle] = useState(user?.title || '')
  const [profileMsg, setProfileMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwSending, setPwSending] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(savedUi.theme)
  const { sidebarVisible, setSidebarVisible } = useSidebarPreference()
  const [mfaMsg, setMfaMsg] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaQr, setMfaQr] = useState('')
  const [mfaCode, setMfaCode] = useState('')

  useEffect(() => {
    if (!user) return
    setDisplayName(user.name || '')
    setDisplayTitle(user.title || '')
    setTheme(normalizeUserUiSettings(user.settings).theme)
  }, [user?.id, user?.name, user?.title, user?.settings?.theme])

  useEffect(() => {
    applyTheme(theme)
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

  async function handleSendPasswordReset() {
    setPwMsg('')
    const email = user?.email?.trim()
    if (!email) {
      setPwMsg('No email is on file for this account.')
      return
    }
    setPwSending(true)
    const { error, demo } = await sendPasswordResetEmail(email)
    setPwSending(false)
    if (error) {
      setPwMsg(error)
      return
    }
    setPwMsg(
      demo
        ? `Demo mode: password reset simulated for ${email}.`
        : `We sent a password reset message to ${email}. Check your inbox and follow the Reset Password button. If you did not request this, you can ignore the email.`,
    )
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
    if (error) {
      setMfaMsg(error.message)
      return
    }
    setMfaMsg('Two-factor authentication enabled.')
    setMfaQr('')
    setMfaCode('')
    setMfaFactorId('')
  }

  const settingsDirty =
    displayName !== (user?.name || '') ||
    displayTitle !== (user?.title || '') ||
    theme !== savedUi.theme ||
    sidebarVisible !== savedUi.sidebar_visible

  function requestSaveSettings() {
    if (!user || saving) return
    if (!displayName.trim()) {
      setProfileMsg('Enter a display name.')
      return
    }
    setConfirmSave(true)
  }

  async function persistSettings() {
    if (!user) return
    const name = displayName.trim()
    const title = displayTitle.trim()
    if (!name) {
      setProfileMsg('Enter a display name.')
      return
    }
    setSaving(true)
    setProfileMsg('')
    const { user: saved, error } = await saveUserSettings(user, {
      name,
      title,
      settings: { theme, sidebar_visible: sidebarVisible },
    })
    setSaving(false)
    if (error) {
      showToast(error, 'error')
      setProfileMsg(error)
      return
    }
    switchUser(saved)
    setDisplayName(saved.name)
    setDisplayTitle(saved.title)
    setProfileMsg(
      supabaseConfigured
        ? 'Settings saved to your account. They will apply on other devices when you sign in.'
        : 'Settings saved on this device for this account.',
    )
    showToast('Settings saved.', 'success')
  }

  const dirty = settingsDirty || Boolean(mfaQr)
  const unsavedDialog = useUnsavedNavigation(dirty)

  const card = {
    background: T.cardBg,
    border: `1px solid ${T.cardBorder}`,
    borderRadius: 10,
    padding: 20,
  }

  const field = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${T.inputBorder}`,
    background: T.inputBg,
    color: T.t1,
    fontFamily: 'inherit',
    marginBottom: 10,
  }

  function chipStyle(active: boolean) {
    return {
      padding: '8px 14px' as const,
      borderRadius: 7,
      border: `1px solid ${active ? T.blue : T.cardBorder}`,
      background: active ? T.blueL : T.cardBg,
      color: active ? T.blue : T.t2,
      fontWeight: 600,
      cursor: 'pointer' as const,
      fontFamily: 'inherit',
    }
  }

  return (
    <PageContent>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>Settings</h1>
      <p style={{ fontSize: 13, color: T.t3, marginBottom: 24 }}>Profile, security, display, and integrations.</p>

      {message && (
        <div style={{
          background: messageType === 'success' ? T.greenL : T.redL,
          border: `1px solid ${messageType === 'success' ? T.green : T.red}44`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 13,
          color: messageType === 'success' ? T.green : T.red,
        }}>
          {message}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          gap: 16,
        }}
      >
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, marginBottom: 12 }}>Profile</div>
        <label style={{ display: 'block', fontSize: 11, color: T.t3, marginBottom: 4 }}>Display name</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={field} />
        <label style={{ display: 'block', fontSize: 11, color: T.t3, marginBottom: 4 }}>Title</label>
        <input value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)} style={field} />
        <div style={{ fontSize: 12, color: T.t3 }}>Email: <strong style={{ color: T.t1 }}>{user?.email}</strong></div>
        <button
          type="button"
          onClick={requestSaveSettings}
          disabled={!user || !settingsDirty || saving}
          style={{
            background: T.blue,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginTop: 12,
            opacity: !user || !settingsDirty || saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {profileMsg && <div style={{ marginTop: 8, fontSize: 12, color: T.t3 }}>{profileMsg}</div>}
        <div style={{ fontSize: 11, color: T.t4, marginTop: 8 }}>
          Saves name, title, theme, and sidebar to your account so they follow you across sessions and devices.
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, marginBottom: 8 }}>Password</div>
        <p style={{ fontSize: 12, color: T.t3, marginBottom: 12, lineHeight: 1.5 }}>
          To change your password, we email a Reset Password link to <strong style={{ color: T.t1 }}>{user?.email || 'your account email'}</strong>. Use that message to set a new password.
        </p>
        <button
          type="button"
          onClick={() => void handleSendPasswordReset()}
          disabled={pwSending || !user?.email}
          style={{
            background: T.blue,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 14px',
            fontWeight: 600,
            cursor: pwSending || !user?.email ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            opacity: pwSending || !user?.email ? 0.7 : 1,
          }}
        >
          {pwSending ? 'Sending…' : 'Send password reset email'}
        </button>
        {pwMsg && <div style={{ marginTop: 8, fontSize: 12, color: T.t3, lineHeight: 1.5 }}>{pwMsg}</div>}
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, marginBottom: 12 }}>Display</div>
        <div style={{ fontSize: 12, color: T.t3, marginBottom: 8 }}>Theme</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              style={{ ...chipStyle(theme === t), textTransform: 'capitalize' }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: T.t3, marginBottom: 8 }}>Navigation sidebar</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSidebarVisible(true)}
            style={chipStyle(sidebarVisible)}
          >
            Show sidebar
          </button>
          <button
            type="button"
            onClick={() => setSidebarVisible(false)}
            style={chipStyle(!sidebarVisible)}
          >
            Hide sidebar
          </button>
        </div>
        <p style={{ fontSize: 11, color: T.t4, marginTop: 10, lineHeight: 1.45, marginBottom: 0 }}>
          Preview applies immediately. Confirm with Save settings to keep theme and sidebar on your account. Full Menu (☰) stays available either way.
        </p>
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
            <input value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="6-digit code" style={{ ...field, width: 'auto', marginRight: 8, marginBottom: 0 }} />
            <button type="button" onClick={() => void verifyMfa()} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Verify</button>
          </div>
        )}
        {mfaMsg && <div style={{ fontSize: 12, color: T.t3 }}>{mfaMsg}</div>}
      </div>

      <div style={{ ...card, gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>
            RC
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.t1 }}>RingCentral</div>
            <div style={{ fontSize: 12, color: T.t3 }}>Click-to-call, SMS, and call recording</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {loading ? (
              <span style={{ fontSize: 12, color: T.t4 }}>Loading…</span>
            ) : rcStatus.connected ? (
              <span style={{ background: T.greenL, color: T.green, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                ✓ Connected
              </span>
            ) : (
              <span style={{ background: T.amberL, color: T.amber, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                Not Connected
              </span>
            )}
          </div>
        </div>

        {!loading && !rcStatus.connected && (
          <div style={{ fontSize: 11, color: T.t3, marginBottom: 12, lineHeight: 1.5 }}>
            Connect your RingCentral extension to enable click-to-call and SMS from talent records.
          </div>
        )}

        {!loading && rcStatus.connected && (
          <div style={{ background: T.mutedBg, borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <span style={{ color: T.t3 }}>Phone Number: </span>
                <span style={{ fontWeight: 600, color: T.t1 }}>{rcStatus.phone_number || '—'}</span>
              </div>
              <div>
                <span style={{ color: T.t3 }}>Extension: </span>
                <span style={{ fontWeight: 600, color: T.t1 }}>{rcStatus.extension_id || '—'}</span>
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
              onClick={() => setConfirmDisconnect(true)}
              disabled={actionLoading}
              style={{ background: T.cardBg, color: T.red, border: `1px solid ${T.red}`, borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {actionLoading ? '…' : 'Disconnect'}
            </button>
          )}
        </div>
      </div>
      </div>
      {unsavedDialog}
      <ConfirmDialog
        open={confirmSave}
        title="Save settings?"
        message="This saves your name, title, theme, and sidebar preference to your account. They will apply on this device and when you sign in elsewhere."
        confirmLabel="Save settings"
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => {
          setConfirmSave(false)
          void persistSettings()
        }}
      />
      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect RingCentral?"
        message="You will need to reconnect to place or receive calls from this workspace."
        confirmLabel="Disconnect"
        danger
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={() => {
          setConfirmDisconnect(false)
          void handleDisconnect()
        }}
      />
    </PageContent>
  )
}
