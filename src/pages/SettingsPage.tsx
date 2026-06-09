// @ts-nocheck
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { getRcConnectionStatus, getRcAuthUrl, disconnectRc } from '@/lib/phone'
import type { RcConnectionStatus } from '@/lib/ringcentral-types'

const RC_ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Authorization was cancelled or incomplete.',
  invalid_state: 'Invalid OAuth state — please try connecting again.',
  token_exchange: 'RingCentral token exchange failed. Check your app credentials.',
  store_tokens: 'Connected to RingCentral but failed to save tokens. Contact support.',
}

export function SettingsPage() {
  const { user } = useAuthContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [rcStatus, setRcStatus] = useState<RcConnectionStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

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

  return (
    <div style={{ padding: 24, maxWidth: 680 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, fontFamily: 'Georgia, serif' }}>Settings</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Manage your account integrations and preferences.</p>

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

      {/* RingCentral Integration */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 }}>
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
            {rcStatus.expired && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                ⚠ Token expired — click Reconnect below
              </div>
            )}
            {!rcStatus.phone_number && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                ⚠ No phone number detected — reconnect or check your RC extension
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {!rcStatus.connected || rcStatus.expired ? (
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {actionLoading ? '⟳ …' : rcStatus.expired ? '🔄 Reconnect' : '🔗 Connect RingCentral'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {actionLoading ? '⟳ …' : '✕ Disconnect'}
            </button>
          )}
        </div>
      </div>

      {/* Account info */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 8 }}>Account</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          <div style={{ marginBottom: 4 }}>
            <span>Logged in as: </span>
            <strong style={{ color: '#111' }}>{user?.name || 'Unknown'}</strong>
          </div>
          <div>
            <span>Email: </span>
            <strong style={{ color: '#111' }}>{user?.email || '—'}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
