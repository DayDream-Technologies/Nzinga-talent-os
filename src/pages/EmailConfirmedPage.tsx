import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PLATFORM_BRAND } from '@/constants/company-branding'
import { PlatformBrandHeader } from '@/components/branding'
import { verifyEmailLink } from '@/services/auth.service'

const CONFIRM_TYPES = new Set(['signup', 'invite', 'email', 'email_change'])

export function EmailConfirmedPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tokenHash = params.get('token_hash') || ''
  const linkType = params.get('type') || 'signup'
  const needsConfirm = Boolean(tokenHash) && CONFIRM_TYPES.has(linkType)
  const [confirmed, setConfirmed] = useState(!needsConfirm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function confirmEmail() {
    setError('')
    setLoading(true)
    const { error: linkError } = await verifyEmailLink(tokenHash, linkType)
    setLoading(false)
    if (linkError) {
      setError('This confirmation link is invalid or has already been used. Request a new email and open it on this device.')
      return
    }
    const url = new URL(window.location.href)
    url.searchParams.delete('token_hash')
    url.searchParams.delete('type')
    window.history.replaceState(window.history.state, '', url.pathname + url.search)
    setConfirmed(true)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f0ea, #ede8e0 40%, #e8e2f5)',
        fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'rgba(22,163,74,0.06)',
          top: -140,
          right: -100,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'rgba(37,99,235,0.05)',
          bottom: -100,
          left: -80,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
        }}
      >
        <PlatformBrandHeader style={{ marginBottom: 32 }} onHomeClick={() => navigate('/')} />

        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: '#fff',
            borderRadius: 12,
            padding: '24px 18px 28px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(22,163,74,0.12)',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              margin: '0 auto 18px',
            }}
            aria-hidden
          >
            {confirmed ? '✓' : '✉'}
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#111827',
              marginBottom: 8,
            }}
          >
            {confirmed ? 'Email confirmed' : 'Confirm your email'}
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.55, marginBottom: 28 }}>
            {confirmed
              ? 'Thank you. Your email is confirmed. Sign in to continue your talent application or access your Nzinga Management Agency account.'
              : 'Continue to confirm this email address. The link is not used until you click the button below.'}
          </p>
          {error && (
            <p style={{ fontSize: 13, color: '#dc2626', lineHeight: 1.5, marginBottom: 16 }}>{error}</p>
          )}
          {confirmed ? (
          <button
            type="button"
            onClick={() => navigate('/tmx')}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
            }}
          >
            Continue to login →
          </button>
          ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => void confirmEmail()}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
            }}
          >
            {loading ? 'Confirming…' : 'Confirm email'}
          </button>
          )}
        </div>
      </div>

      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '16px 0',
          textAlign: 'center',
          fontSize: 12,
          color: '#9ca3af',
        }}
      >
        &copy; {new Date().getFullYear()} {PLATFORM_BRAND.footer}
      </footer>
    </div>
  )
}
