import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { COMPANY_CODES } from '@/constants/roles'
import { PLATFORM_BRAND, canApplyWithCompanyCode, getCompanyBrand } from '@/constants/company-branding'
import { PlatformBrandHeader } from '@/components/branding'

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
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(124,58,237,0.06)', top: -140, right: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'rgba(37,99,235,0.05)', bottom: -100, left: -80, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <PlatformBrandHeader style={{ marginBottom: 32 }} onHomeClick={() => navigate('/')} />

        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 12, padding: '32px 36px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
          {step === 'code' && (
            <>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 6 }}>Welcome</h2>
              <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
                Enter your company code to continue to staff login or the talent application.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Company Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError('') }}
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
                  }}
                >
                  Continue &rarr;
                </button>
              </form>
            </>
          )}

          {step === 'choice' && (
            <>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 6 }}>
                How would you like to continue?
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 8, lineHeight: 1.5 }}>
                Company code <strong style={{ color: '#111827' }}>{activeCode}</strong>
                {brand ? <> · {brand.displayName}</> : null}
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 24 }}>
                Choose staff access or apply as talent for this company.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
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
                  Staff login &rarr;
                </button>

                {showApply ? (
                  <button
                    type="button"
                    onClick={() => navigate('/portal')}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      background: '#f7f8fa',
                      color: '#111827',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Apply as talent &rarr;
                  </button>
                ) : (
                  <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5, margin: '4px 0 0' }}>
                    Talent applications are not available for this company code yet.
                  </p>
                )}
              </div>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleChangeCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textDecoration: 'underline',
                  }}
                >
                  Use a different company code
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <footer style={{ position: 'relative', zIndex: 1, padding: '16px 0', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
        &copy; {new Date().getFullYear()} {PLATFORM_BRAND.footer}
      </footer>
    </div>
  )
}
