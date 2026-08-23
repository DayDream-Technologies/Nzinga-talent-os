import { useNavigate } from 'react-router-dom'
import { PLATFORM_BRAND } from '@/constants/company-branding'
import { PlatformBrandHeader } from '@/components/branding'

export function EmailConfirmedPage() {
  const navigate = useNavigate()

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
            padding: '36px 36px 32px',
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
            ✓
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
            Email confirmed
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.55, marginBottom: 28 }}>
            Thank you. Your email is confirmed. Sign in to continue your talent application or access your Nzinga Management Agency account.
          </p>
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
