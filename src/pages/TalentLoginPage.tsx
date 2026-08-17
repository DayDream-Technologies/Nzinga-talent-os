import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { PLATFORM_BRAND } from '@/constants/company-branding'
import { TMXLogo, TMXMark } from '@/components/branding'
import { useTalentAuth } from '@/context/TalentAuthContext'
import {
  friendlyAuthError,
  loginApprovedTalent,
  sendPasswordResetEmail,
  TALENT_LOGIN_DEMO_MESSAGE,
} from '@/services/auth.service'
import { supabaseConfigured } from '@/lib/supabase'

const pageShell: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#0c1520',
  color: '#e8eef4',
  fontFamily: "'Outfit', 'Segoe UI', sans-serif",
  position: 'relative',
  overflow: 'hidden',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
  fontSize: 14,
  color: '#e8eef4',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export function TalentLoginPage() {
  const navigate = useNavigate()
  const { session, loading: sessionLoading, setSession } = useTalentAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)

  const demoBlocked = !supabaseConfigured

  if (!sessionLoading && session) {
    return <Navigate to="/talent/home" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (demoBlocked) {
      setError(TALENT_LOGIN_DEMO_MESSAGE)
      return
    }
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const result = await loginApprovedTalent(email.trim(), password)
      if (result.error || !result.profile || !result.talent) {
        setError(result.error || 'Login failed.')
        return
      }
      setSession({ profile: result.profile, talent: result.talent })
      navigate('/talent/home', { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    setError('')
    setInfo('')
    if (demoBlocked) {
      setError(TALENT_LOGIN_DEMO_MESSAGE)
      return
    }
    if (!email.trim()) {
      setError('Enter your email above, then request a password reset.')
      return
    }
    setResetting(true)
    try {
      const { error: resetErr, demo } = await sendPasswordResetEmail(email.trim())
      if (resetErr) {
        setError(friendlyAuthError(resetErr))
        return
      }
      if (demo) {
        setError(TALENT_LOGIN_DEMO_MESSAGE)
        return
      }
      setInfo('Password reset email sent. Check your inbox.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div style={pageShell}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 197, 94, 0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(14, 165, 233, 0.08), transparent)',
          pointerEvents: 'none',
        }}
      />

      <header
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <TMXMark size="sm" />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.02em' }}>
            {PLATFORM_BRAND.name}
          </span>
        </Link>
        <Link to="/" style={{ color: 'rgba(232,238,244,0.65)', fontSize: 13, textDecoration: 'none' }}>
          Home
        </Link>
      </header>

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
        <div style={{ marginBottom: 28 }}>
          <TMXLogo size="md" theme="dark" />
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '32px 36px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          }}
        >
          <h1
            style={{
              fontFamily: "'Syne', 'Outfit', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 6,
              letterSpacing: '-0.02em',
            }}
          >
            Talent login
          </h1>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(232,238,244,0.65)',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            Use the same email and password as your application account. Available after director
            approval and signed onboarding.
          </p>

          {demoBlocked && (
            <div
              role="status"
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                fontSize: 13,
                lineHeight: 1.45,
                color: '#fcd34d',
              }}
            >
              {TALENT_LOGIN_DEMO_MESSAGE}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(232,238,244,0.65)', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              disabled={demoBlocked || loading}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...inputStyle, marginBottom: 14 }}
            />

            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(232,238,244,0.65)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={demoBlocked || loading}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, marginBottom: 16 }}
            />

            {error && (
              <p role="alert" style={{ fontSize: 13, color: '#fca5a5', marginBottom: 12, lineHeight: 1.45 }}>
                {error}
              </p>
            )}
            {info && (
              <p role="status" style={{ fontSize: 13, color: '#86efac', marginBottom: 12, lineHeight: 1.45 }}>
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={demoBlocked || loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                background: demoBlocked || loading ? 'rgba(255,255,255,0.12)' : '#16a34a',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: demoBlocked || loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              disabled={demoBlocked || resetting}
              onClick={() => void handleReset()}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(232,238,244,0.65)',
                fontSize: 12,
                cursor: demoBlocked || resetting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                textDecoration: 'underline',
              }}
            >
              {resetting ? 'Sending…' : 'Forgot password?'}
            </button>
          </div>

          <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(232,238,244,0.5)', textAlign: 'center', lineHeight: 1.5 }}>
            Still applying?{' '}
            <Link to="/portal" style={{ color: 'rgba(232,238,244,0.85)' }}>
              Open application portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
