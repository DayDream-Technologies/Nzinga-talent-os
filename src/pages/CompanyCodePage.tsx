import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { COMPANY_CODES } from '@/constants/roles'
import { PLATFORM_BRAND, canApplyWithCompanyCode, getCompanyBrand } from '@/constants/company-branding'
import { TMXLogo, TMXMark } from '@/components/branding'

const pageShell: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--auth-bg)',
  color: 'var(--auth-ink)',
  fontFamily: "'Outfit', 'Segoe UI', sans-serif",
  position: 'relative',
  overflow: 'hidden',
  ['--auth-bg' as string]: '#0c1520',
  ['--auth-ink' as string]: '#e8eef4',
  ['--auth-muted' as string]: '#8fa3b5',
  ['--auth-accent' as string]: '#3d9fd4',
  ['--auth-surface' as string]: 'rgba(255,255,255,0.06)',
  ['--auth-line' as string]: 'rgba(255,255,255,0.12)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 8,
  border: '1px solid var(--auth-line)',
  background: 'rgba(255,255,255,0.04)',
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  textAlign: 'center',
  color: 'var(--auth-ink)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--auth-accent)',
  color: '#061018',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const secondaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: 8,
  border: '1px solid var(--auth-line)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--auth-ink)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export function CompanyCodePage() {
  const navigate = useNavigate()
  const { setCompanyCode, companyCode } = useAuth()
  const [code, setCode] = useState(companyCode || '')
  const [error, setError] = useState('')
  const [step, setStep] = useState<'code' | 'choice'>(companyCode ? 'choice' : 'code')

  const activeCode = (companyCode || code).trim().toUpperCase()
  const brand = activeCode ? getCompanyBrand(activeCode) : null
  const showApply = canApplyWithCompanyCode(activeCode)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter a company code.')
      return
    }
    if (COMPANY_CODES[trimmed]) {
      setCompanyCode(trimmed)
      setCode(trimmed)
      setError('')
      setStep('choice')
    } else {
      setError('Invalid company code. Please try again.')
    }
  }

  function handleChangeCode() {
    setCompanyCode('')
    setCode('')
    setError('')
    setStep('code')
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
          borderBottom: '1px solid var(--auth-line)',
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
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--auth-ink)', letterSpacing: '0.02em' }}>
            {PLATFORM_BRAND.name}
          </span>
        </button>
        <button
          type="button"
          className="mh-link-underline"
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--auth-muted)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Home
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
          key={step}
          className="animate-scale-in"
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'var(--auth-surface)',
            border: '1px solid var(--auth-line)',
            borderRadius: 14,
            padding: '32px 36px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {step === 'code' && (
            <>
              <h2
                style={{
                  fontFamily: "'Syne', 'Outfit', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--auth-ink)',
                  textAlign: 'center',
                  marginBottom: 6,
                  letterSpacing: '-0.02em',
                }}
              >
                Welcome
              </h2>
              <p style={{ fontSize: 13, color: 'var(--auth-muted)', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
                Enter your company code to continue to staff login or the talent application.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--auth-muted)', marginBottom: 6 }}>
                  Company Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value)
                    setError('')
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--auth-accent)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,159,212,0.18)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--auth-line)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  placeholder="e.g. NZG"
                  autoFocus
                  style={inputStyle}
                />
                {error && (
                  <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center', marginTop: 8 }}>{error}</p>
                )}
                <button type="submit" className="mh-cta" style={{ ...primaryBtn, marginTop: 16 }}>
                  Continue →
                </button>
              </form>
            </>
          )}

          {step === 'choice' && (
            <>
              <h2
                style={{
                  fontFamily: "'Syne', 'Outfit', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--auth-ink)',
                  textAlign: 'center',
                  marginBottom: 6,
                  letterSpacing: '-0.02em',
                }}
              >
                How would you like to continue?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--auth-muted)', textAlign: 'center', marginBottom: 8, lineHeight: 1.5 }}>
                Company code <strong style={{ color: 'var(--auth-ink)' }}>{activeCode}</strong>
                {brand ? <> · {brand.displayName}</> : null}
              </p>
              <p style={{ fontSize: 12, color: 'var(--auth-muted)', opacity: 0.8, textAlign: 'center', marginBottom: 24 }}>
                Choose staff access or apply as talent for this company.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button type="button" className="mh-cta" onClick={() => navigate('/login')} style={primaryBtn}>
                  Staff login →
                </button>

                {showApply ? (
                  <button type="button" className="hover-lift" onClick={() => navigate('/portal')} style={secondaryBtn}>
                    Apply as talent →
                  </button>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--auth-muted)', textAlign: 'center', lineHeight: 1.5, margin: '4px 0 0' }}>
                    Talent applications are not available for this company code yet.
                  </p>
                )}
              </div>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  type="button"
                  className="mh-link-underline"
                  onClick={handleChangeCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--auth-muted)',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Use a different company code
                </button>
              </div>
            </>
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
          color: 'var(--auth-muted)',
        }}
      >
        <div>
          © {new Date().getFullYear()} {PLATFORM_BRAND.footer}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, opacity: 0.7 }}>
          Designed & developed by{' '}
          <a
            href="https://www.daydreamtechnologies.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="mh-link-underline"
            style={{ color: 'var(--auth-accent)', textDecoration: 'none' }}
          >
            DayDream Technologies
          </a>
        </div>
      </footer>
    </div>
  )
}
