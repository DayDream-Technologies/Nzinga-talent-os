import { useNavigate } from 'react-router-dom'
import { PLATFORM_BRAND } from '@/constants/company-branding'
import { TMXLogo } from '@/components/branding'

const STAGES = [
  'Holding Entry',
  'Scout Complete',
  'Team 1 Review',
  'Ops Processing',
  'Team 2 Audit',
  'Executive Review',
  'Signed Onboarding',
]

export function HomePage() {
  const navigate = useNavigate()

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
          <TMXLogo size="sm" theme="dark" />
          <button
            type="button"
            className="mh-login"
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
              transition: 'background 0.15s',
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
              className="mh-login"
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
                transition: 'background 0.15s',
              }}
            >
              Login
            </button>
            <button
              type="button"
              className="mh-ghost"
              onClick={() => navigate('/tmx')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--mh-muted)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
                padding: '8px 4px',
              }}
            >
              Talent Application Portal →
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
        <ol
          style={{
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
            counterReset: 'stage',
          }}
        >
          {STAGES.map((label) => (
            <li
              key={label}
              style={{
                padding: '16px 14px',
                background: 'var(--mh-surface)',
                border: '1px solid var(--mh-line)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.35,
              }}
            >
              <span style={{ display: 'block', color: 'var(--mh-accent)', fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: '0.06em' }}>
                STAGE
              </span>
              {label}
            </li>
          ))}
        </ol>
      </section>

      {/* Roles section */}
      <section style={{ padding: '72px clamp(20px, 5vw, 72px)' }}>
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
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: '22px 20px',
                borderTop: '2px solid var(--mh-accent-deep)',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--mh-muted)', lineHeight: 1.5 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          padding: '28px clamp(20px, 5vw, 72px)',
          borderTop: '1px solid var(--mh-line)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: 'var(--mh-muted)',
        }}
      >
        <span>
          © {new Date().getFullYear()} {PLATFORM_BRAND.footer}
        </span>
        <button
          type="button"
          className="mh-ghost"
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
      </footer>
    </div>
  )
}
