import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PLATFORM_BRAND } from '@/constants/company-branding'
import { TMXLogo } from '@/components/branding'
import { hasEmailConfirmationInUrl } from '@/lib/auth-redirect'
import { useInView } from '@/hooks/useInView'

const STAGES = [
  'New / Lead',
  'More Information Required',
  'Client Packet Review',
  'Success Manager Validation',
  'Contract Pending',
  'Director Review',
  'Active Client',
]

function Reveal({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className={`reveal ${inView ? 'is-visible' : ''} ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!hasEmailConfirmationInUrl()) return
    const { search, hash } = window.location
    navigate({ pathname: '/auth/confirmed', search, hash }, { replace: true })
  }, [navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--mh-bg)',
        color: 'var(--mh-ink)',
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        ['--mh-bg' as string]: '#0c1520',
        ['--mh-ink' as string]: '#e8eef4',
        ['--mh-muted' as string]: '#8fa3b5',
        ['--mh-accent' as string]: '#3d9fd4',
        ['--mh-accent-deep' as string]: '#1d6fa4',
        ['--mh-surface' as string]: 'rgba(255,255,255,0.04)',
        ['--mh-line' as string]: 'rgba(255,255,255,0.10)',
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap"
      />
      <style>{`
        @keyframes mh-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mh-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(12px, -10px, 0) scale(1.04); }
        }
        @keyframes mh-line-in {
          from { opacity: 0; transform: scaleX(0.4); }
          to { opacity: 1; transform: scaleX(1); }
        }
        .mh-hero-item { animation: mh-fade-up 0.7s ease both; }
        .mh-hero-item:nth-child(1) { animation-delay: 0.05s; }
        .mh-hero-item:nth-child(2) { animation-delay: 0.18s; }
        .mh-hero-item:nth-child(3) { animation-delay: 0.3s; }
        .mh-hero-item:nth-child(4) { animation-delay: 0.42s; }
        .mh-orb { animation: mh-drift 14s ease-in-out infinite; }
        .mh-stage-rail { animation: mh-line-in 1s 0.5s ease both; transform-origin: left center; }
        .mh-login:hover { background: #4aafdf; }
        .mh-login:focus-visible { outline: 2px solid #3d9fd4; outline-offset: 3px; }
        .mh-ghost:hover { color: #e8eef4; }
      `}</style>

      {/* Hero */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Atmospheric plane */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(61,159,212,0.22), transparent 55%),' +
              'radial-gradient(ellipse 50% 40% at 15% 80%, rgba(29,111,164,0.18), transparent 50%),' +
              'linear-gradient(165deg, #0c1520 0%, #122033 45%, #0a121c 100%)',
          }}
        />
        <div
          className="mh-orb"
          aria-hidden
          style={{
            position: 'absolute',
            width: '55vmax',
            height: '55vmax',
            right: '-12%',
            top: '-18%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(61,159,212,0.14), transparent 68%)',
            pointerEvents: 'none',
          }}
        />
        {/* Product visual: pipeline silhouette */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '8vh',
            pointerEvents: 'none',
            opacity: 0.35,
          }}
        >
          <div className="mh-stage-rail" style={{ display: 'flex', gap: 10, alignItems: 'flex-end', width: 'min(920px, 92%)' }}>
            {STAGES.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${48 + i * 10}px`,
                  borderRadius: '6px 6px 0 0',
                  background: `linear-gradient(180deg, rgba(61,159,212,${0.15 + i * 0.06}), rgba(255,255,255,0.03))`,
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderBottom: 'none',
                }}
              />
            ))}
          </div>
        </div>

        <header
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px clamp(20px, 4vw, 48px)',
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
            <TMXLogo size="sm" theme="dark" />
          </button>
          <button
            type="button"
            className="mh-login mh-cta"
            onClick={() => navigate('/tmx')}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--mh-accent)',
              color: '#061018',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Login
          </button>
        </header>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 clamp(20px, 5vw, 72px) 12vh',
            maxWidth: 720,
          }}
        >
          <p
            className="mh-hero-item"
            style={{
              fontFamily: "'Syne', 'Outfit', sans-serif",
              fontSize: 'clamp(40px, 8vw, 72px)',
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              marginBottom: 20,
            }}
          >
            {PLATFORM_BRAND.name}
          </p>
          <h1
            className="mh-hero-item"
            style={{
              fontSize: 'clamp(22px, 3.4vw, 32px)',
              fontWeight: 500,
              lineHeight: 1.25,
              marginBottom: 14,
              maxWidth: 520,
            }}
          >
            Run your talent pipeline from first contact to signed onboarding.
          </h1>
          <p
            className="mh-hero-item"
            style={{
              fontSize: 16,
              lineHeight: 1.55,
              color: 'var(--mh-muted)',
              marginBottom: 28,
              maxWidth: 440,
            }}
          >
            One operating system for scouts, leads, ops, and directors — with role-based access at every stage.
          </p>
          <div className="mh-hero-item" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <button
              type="button"
              className="mh-login mh-cta"
              onClick={() => navigate('/tmx')}
              style={{
                padding: '14px 28px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--mh-accent)',
                color: '#061018',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Login
            </button>
            <button
              type="button"
              className="mh-ghost mh-link-underline"
              onClick={() => navigate('/tmx')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--mh-muted)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '8px 4px',
              }}
            >
              Talent Application Portal →
            </button>
            <button
              type="button"
              className="mh-ghost mh-link-underline"
              onClick={() => navigate('/talent/login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--mh-muted)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '8px 4px',
              }}
            >
              Talent login →
            </button>
          </div>
        </div>
      </section>

      {/* Pipeline section */}
      <section
        style={{
          padding: '72px clamp(20px, 5vw, 72px)',
          borderTop: '1px solid var(--mh-line)',
          background: 'rgba(0,0,0,0.18)',
        }}
      >
        <Reveal>
          <h2
            style={{
              fontFamily: "'Syne', 'Outfit', sans-serif",
              fontSize: 'clamp(24px, 3vw, 34px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 10,
            }}
          >
            A clear path from prospect to roster
          </h2>
          <p style={{ color: 'var(--mh-muted)', fontSize: 15, lineHeight: 1.55, maxWidth: 520, marginBottom: 36 }}>
            Seven sequential stages keep every candidate moving with the right owners and checkpoints.
          </p>
        </Reveal>
        <ol
          style={{
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
            counterReset: 'stage',
          }}
        >
          {STAGES.map((label, i) => (
            <Reveal key={label} className={`stagger-${Math.min(i + 1, 8)}`}>
              <li
                className="mh-stage-card"
                style={{
                  padding: '16px 14px',
                  background: 'var(--mh-surface)',
                  border: '1px solid var(--mh-line)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  listStyle: 'none',
                }}
              >
                <span style={{ display: 'block', color: 'var(--mh-accent)', fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: '0.06em' }}>
                  STAGE {String(i + 1).padStart(2, '0')}
                </span>
                {label}
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Roles section */}
      <section style={{ padding: '72px clamp(20px, 5vw, 72px)' }}>
        <Reveal>
          <h2
            style={{
              fontFamily: "'Syne', 'Outfit', sans-serif",
              fontSize: 'clamp(24px, 3vw, 34px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 10,
            }}
          >
            Built for every seat in the process
          </h2>
          <p style={{ color: 'var(--mh-muted)', fontSize: 15, lineHeight: 1.55, maxWidth: 520, marginBottom: 36 }}>
            Role-based views and actions so scouts, team leads, specialists, and directors each see what they need — nothing more.
          </p>
        </Reveal>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {[
            { title: 'Scouts & leads', body: 'Score talent, advance stages, and keep holding entries moving.' },
            { title: 'Ops & audit', body: 'Process documents, verify compliance, and close the loop.' },
            { title: 'Directors & success', body: 'Executive review, onboarding handoff, and full pipeline visibility.' },
          ].map((item, i) => (
            <Reveal key={item.title} className={`stagger-${i + 1}`}>
              <div
                className="mh-role-card"
                style={{
                  padding: '22px 20px',
                  borderTop: '2px solid var(--mh-accent-deep)',
                  borderRadius: '0 0 8px 8px',
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--mh-muted)', lineHeight: 1.5 }}>{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <footer
        style={{
          padding: '28px clamp(20px, 5vw, 72px)',
          borderTop: '1px solid var(--mh-line)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'center',
          fontSize: 12,
          color: 'var(--mh-muted)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>
            © {new Date().getFullYear()} {PLATFORM_BRAND.footer}
          </span>
          <button
            type="button"
            className="mh-ghost mh-link-underline"
            onClick={() => navigate('/tmx')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--mh-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Staff login →
          </button>
        </div>
        <span style={{ fontSize: 11, color: 'var(--mh-muted)', opacity: 0.7 }}>
          Designed & developed by{' '}
          <a
            href="https://www.daydreamtechnologies.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="mh-link-underline"
            style={{ color: 'var(--mh-accent)', textDecoration: 'none' }}
          >
            DayDream Technologies
          </a>
        </span>
      </footer>
    </div>
  )
}
