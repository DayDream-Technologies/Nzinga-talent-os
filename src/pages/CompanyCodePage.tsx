import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { COMPANY_CODES } from '@/constants/roles'

export function CompanyCodePage() {
  const navigate = useNavigate()
  const { setCompanyCode } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter a company code.')
      return
    }
    if (COMPANY_CODES[trimmed]) {
      setCompanyCode(trimmed)
      navigate('/login')
    } else {
      setError('Invalid company code. Please try again.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f0ea, #ede8e0 40%, #e8e2f5)',
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(124,58,237,0.06)', top: -140, right: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'rgba(37,99,235,0.05)', bottom: -100, left: -80, pointerEvents: 'none' }} />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ margin: '0 auto 16px', width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#fff' }}>N</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 800, color: '#111827', margin: 0 }}>Nzinga</h1>
          <p style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>Talent Operating System</p>
        </div>

        {/* Card */}
        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 12, padding: '32px 36px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 6 }}>Welcome</h2>
          <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
            Enter your company code to access the talent management platform.
          </p>

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Company Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e) }}
              placeholder="e.g. NZG"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#f7f8fa',
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textAlign: 'center',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
            />
            {error && (
              <p style={{ color: '#dc2626', fontSize: 12, textAlign: 'center', marginTop: 8 }}>{error}</p>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                marginTop: 16,
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
                transition: 'opacity 0.15s',
              }}
            >
              Continue &rarr;
            </button>
          </form>

          {/* Prospect portal link */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Are you a talent applicant?</p>
            <button
              type="button"
              onClick={() => navigate('/portal')}
              style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Talent Application Portal &rarr;
            </button>
          </div>
        </div>

        {/* Platform Info Section */}
        <div style={{ marginTop: 40, width: '100%', maxWidth: 680, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <InfoCard
            title="7-Stage Pipeline"
            description="Structured workflow from holding entry through signed onboarding with clear ownership at each stage."
          />
          <InfoCard
            title="Role-Based Access"
            description="Six specialized roles — scouts, leads, ops, directors — each sees only the stages they manage."
          />
          <InfoCard
            title="Talent Scoring"
            description="Jordan Score framework evaluates prospects across 5 pillars with minimum thresholds to advance."
          />
        </div>
      </div>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '16px 0', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
        &copy; {new Date().getFullYear()} Nzinga Talent OS &mdash; Streamlined Talent Management
      </footer>
    </div>
  )
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ borderRadius: 10, border: '1px solid rgba(229,231,235,0.6)', background: 'rgba(255,255,255,0.7)', padding: 16, backdropFilter: 'blur(4px)' }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{title}</h3>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: '#6b7280', margin: 0 }}>{description}</p>
    </div>
  )
}
