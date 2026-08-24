import { useState, type FormEvent } from 'react'
import { loginWithCredentials } from '@/services/auth.service'
import { T } from '@/lib/tokens'

interface IdleReauthModalProps {
  email: string
  companyCode: string
  onSuccess: () => void
  onSignOut: () => void
}

export function IdleReauthModal({ email, companyCode, onSuccess, onSignOut }: IdleReauthModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await loginWithCredentials(email, password, companyCode || undefined)
      if (!user) {
        setError('Incorrect password. Please try again.')
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-reauth-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(15, 23, 42, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      }}
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{
          width: '100%',
          maxWidth: 400,
          background: T.cardBg,
          borderRadius: 12,
          padding: '28px 24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
      >
        <h2 id="idle-reauth-title" style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: T.t1, fontFamily: "'Syne', sans-serif" }}>
          Session paused
        </h2>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: T.t3, lineHeight: 1.5 }}>
          You were inactive for more than 5 minutes. Your work has been kept. Re-enter your password to continue.
        </p>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, color: T.t3, marginBottom: 4 }}>Email</label>
          <input
            value={email}
            readOnly
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${T.cardBorder}`,
              background: T.mutedBg,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: T.t3, marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${error ? T.red : T.inputBorder}`,
              background: T.inputBg,
              color: T.t1,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          />
        </div>
        {error && (
          <div style={{ marginBottom: 12, fontSize: 12, color: T.red, fontWeight: 600 }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 8,
            border: 'none',
            background: T.blue,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1,
            marginBottom: 8,
          }}
        >
          {loading ? 'Verifying…' : 'Continue'}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: `1px solid ${T.cardBorder}`,
            background: T.cardBg,
            color: T.t3,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
