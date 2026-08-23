import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PLATFORM_BRAND } from '@/constants/company-branding'
import { TMXLogo, TMXMark } from '@/components/branding'
import { updatePassword } from '@/services/auth.service'
import { supabase, supabaseConfigured, onAuthStateChange } from '@/lib/supabase'

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
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [recoveryReady, setRecoveryReady] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setChecking(false)
      setError('Password reset is not available in demo mode.')
      return
    }

    let resolved = false

    const { data } = onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolved = true
        setRecoveryReady(true)
        setChecking(false)
      }
    })

    // Supabase auto-detects the recovery token from the URL hash on page load.
    // Give it a moment to fire the PASSWORD_RECOVERY event.
    const timeout = setTimeout(() => {
      if (!resolved) {
        // Check if there's already a session (token already consumed on a previous render)
        supabase!.auth.getSession().then(({ data: sessionData }) => {
          if (sessionData.session) {
            setRecoveryReady(true)
          } else {
            setError('This password reset link is invalid or has expired. Please request a new one.')
          }
          setChecking(false)
        })
      }
    }, 3000)

    return () => {
      clearTimeout(timeout)
      data.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!password.trim()) {
      setError('Please enter a new password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateErr } = await updatePassword(password)
    setLoading(false)

    if (updateErr) {
      setError(updateErr)
      return
    }

    setSuccess(true)
  }

  return (
    <div style={pageShell}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap"
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 50% at 75% 15%, rgba(61,159,212,0.20), transparent 55%),' +
            'radial-gradient(ellipse 45% 40% at 10% 85%, rgba(29,111,164,0.16), transparent 50%),' +
            'linear-gradient(165deg, #0c1520 0%, #122033 45%, #0a121c 100%)',
        }}
      />
      <div
        className="mh-orb"
        aria-hidden
        style={{
          position: 'absolute',
          width: '50vmax',
          height: '50vmax',
          right: '-15%',
          top: '-20%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(61,159,212,0.12), transparent 68%)',
          pointerEvents: 'none',
        }}
      />

      <header
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px clamp(16px, 4vw, 40px)',
          background: 'rgba(12,21,32,0.65)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label={`${PLATFORM_BRAND.name} — go to home`}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            font: 'inherit',
          }}
        >
          <TMXMark size="sm" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#e8eef4', letterSpacing: '0.02em' }}>
            {PLATFORM_BRAND.name}
          </span>
        </button>
        <button
          type="button"
          className="mh-link-underline"
          onClick={() => navigate('/tmx')}
          style={{
            background: 'none',
            border: 'none',
            color: '#8fa3b5',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Back to login
        </button>
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
        <button
          type="button"
          className="animate-fade-in-up"
          onClick={() => navigate('/')}
          aria-label={`${PLATFORM_BRAND.name} — go to home`}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginBottom: 28,
            font: 'inherit',
          }}
        >
          <TMXLogo size="md" theme="dark" />
        </button>

        <div
          className="animate-scale-in"
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14,
            padding: '32px 36px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {checking && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 14, color: '#8fa3b5' }}>Verifying reset link…</div>
            </div>
          )}

          {!checking && !recoveryReady && !success && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(248,113,113,0.15)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  margin: '0 auto 16px',
                }}
                aria-hidden
              >
                ✕
              </div>
              <h2
                style={{
                  fontFamily: "'Syne', 'Outfit', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#e8eef4',
                  marginBottom: 8,
                }}
              >
                Link expired
              </h2>
              <p style={{ fontSize: 13, color: '#8fa3b5', lineHeight: 1.6, marginBottom: 20 }}>
                {error || 'This password reset link is invalid or has expired.'}
              </p>
              <button
                type="button"
                className="mh-cta"
                onClick={() => navigate('/tmx')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#3d9fd4',
                  color: '#061018',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Go to login →
              </button>
            </div>
          )}

          {!checking && recoveryReady && !success && (
            <>
              <h2
                style={{
                  fontFamily: "'Syne', 'Outfit', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#e8eef4',
                  textAlign: 'center',
                  marginBottom: 6,
                  letterSpacing: '-0.02em',
                }}
              >
                Reset your password
              </h2>
              <p style={{ fontSize: 13, color: '#8fa3b5', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
                Choose a strong, unique password that you do not use for other accounts.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#8fa3b5', marginBottom: 6 }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoFocus
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3d9fd4'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,159,212,0.18)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#8fa3b5', marginBottom: 6 }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3d9fd4'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,159,212,0.18)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {error && (
                  <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>{error}</p>
                )}

                <button
                  type="submit"
                  className="mh-cta"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#3d9fd4',
                    color: '#061018',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}

          {success && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(74,222,128,0.15)',
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  margin: '0 auto 16px',
                }}
                aria-hidden
              >
                ✓
              </div>
              <h2
                style={{
                  fontFamily: "'Syne', 'Outfit', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#e8eef4',
                  marginBottom: 8,
                }}
              >
                Password updated
              </h2>
              <p style={{ fontSize: 13, color: '#8fa3b5', lineHeight: 1.6, marginBottom: 20 }}>
                Your password has been changed. You can now sign in with your new password. If you did not make this change, contact your supervisor or manager.
              </p>
              <button
                type="button"
                className="mh-cta"
                onClick={() => navigate('/tmx')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#3d9fd4',
                  color: '#061018',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Continue to login →
              </button>
            </div>
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
          color: '#8fa3b5',
        }}
      >
        <div>© {new Date().getFullYear()} {PLATFORM_BRAND.footer}</div>
        <div style={{ marginTop: 4, fontSize: 11, opacity: 0.7 }}>
          Designed & developed by{' '}
          <a
            href="https://www.daydreamtechnologies.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="mh-link-underline"
            style={{ color: '#3d9fd4', textDecoration: 'none' }}
          >
            DayDream Technologies
          </a>
        </div>
      </footer>
    </div>
  )
}
