import { PLATFORM_BRAND } from '@/constants/company-branding'
import { TMXLogo, TMXMark } from '@/components/branding'
import { getUnrecognizedSubdomain } from '@/lib/subdomain'

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
  ['--auth-danger' as string]: '#f87171',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-block',
  padding: '13px 28px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--auth-accent)',
  color: '#061018',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textDecoration: 'none',
}

/**
 * Full-page error shown when the hostname contains a subdomain that
 * is not mapped to any company code (e.g. `bogus.talentmanagerx.com`).
 */
export function InvalidSubdomainPage() {
  const badSub = getUnrecognizedSubdomain() ?? 'unknown'
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const baseDomain = hostname.split('.').slice(-2).join('.')

  return (
    <div style={pageShell}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap"
      />

      {/* Background orbs — matches auth pages */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 50% at 75% 15%, rgba(248,113,113,0.12), transparent 55%),' +
            'radial-gradient(ellipse 45% 40% at 10% 85%, rgba(29,111,164,0.16), transparent 50%),' +
            'linear-gradient(165deg, #0c1520 0%, #122033 45%, #0a121c 100%)',
        }}
      />

      {/* Header */}
      <header
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          padding: '16px clamp(16px, 4vw, 40px)',
          background: 'rgba(12,21,32,0.65)',
          borderBottom: '1px solid var(--auth-line)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <TMXMark size="sm" />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--auth-ink)', letterSpacing: '0.02em' }}>
            {PLATFORM_BRAND.name}
          </span>
        </div>
      </header>

      {/* Content */}
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
          className="animate-scale-in"
          style={{
            width: '100%',
            maxWidth: 460,
            background: 'var(--auth-surface)',
            border: '1px solid var(--auth-line)',
            borderRadius: 14,
            padding: '36px 40px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(12px)',
            textAlign: 'center',
          }}
        >
          {/* Error icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(248,113,113,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--auth-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2
            style={{
              fontFamily: "'Syne', 'Outfit', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--auth-ink)',
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}
          >
            Organization Not Found
          </h2>

          <p style={{ fontSize: 14, color: 'var(--auth-muted)', lineHeight: 1.6, marginBottom: 8 }}>
            The subdomain{' '}
            <strong style={{ color: 'var(--auth-danger)', fontWeight: 600 }}>{badSub}</strong>{' '}
            is not associated with any organization on this platform.
          </p>

          <p
            style={{
              fontSize: 13,
              color: 'var(--auth-muted)',
              opacity: 0.8,
              lineHeight: 1.5,
              marginBottom: 28,
            }}
          >
            Check the URL for typos, or visit the main site to enter your company code manually.
          </p>

          <a href={`https://${baseDomain}/tmx`} style={primaryBtn}>
            Go to {baseDomain} →
          </a>
        </div>
      </div>

      {/* Footer */}
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
        <div>© {new Date().getFullYear()} {PLATFORM_BRAND.footer}</div>
        <div style={{ marginTop: 4, fontSize: 11, opacity: 0.7 }}>
          Designed & developed by{' '}
          <a
            href="https://www.daydreamtechnologies.net/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--auth-accent)', textDecoration: 'none' }}
          >
            DayDream Technologies
          </a>
        </div>
      </footer>
    </div>
  )
}
