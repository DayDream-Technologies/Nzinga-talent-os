import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { PLATFORM_BRAND } from '@/constants/company-branding'
import { AgencyDataProvider } from '@/context/AgencyDataContext'
import { useTalentAuth } from '@/context/TalentAuthContext'
import { TMXMark } from '@/components/branding'
import { useTalentPortal } from '@/hooks/useTalentPortal'

export const portalPage: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#0c1520',
  color: '#e8eef4',
  fontFamily: "'Outfit', 'Segoe UI', sans-serif",
}

export const portalCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '20px 22px',
}

export const portalGhost: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 6,
  color: '#e8eef4',
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export const portalPrimary: React.CSSProperties = {
  background: '#16a34a',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  padding: '10px 14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export const portalInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
  color: '#e8eef4',
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const NAV = [
  { to: '/talent/home', label: 'Dashboard' },
  { to: '/talent/activity', label: 'Career activity' },
  { to: '/talent/money', label: 'Money' },
  { to: '/talent/files', label: 'Files & media' },
  { to: '/talent/messages', label: 'Messages' },
]

function TalentPortalGate({ children }: { children: React.ReactNode }) {
  const { loading, session } = useTalentAuth()
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0c1520',
          color: 'rgba(232,238,244,0.65)',
        }}
      >
        Loading your talent portal…
      </div>
    )
  }
  if (!session) return <Navigate to="/talent/login" replace />
  return <>{children}</>
}

function ShellInner() {
  const { handleLogout, displayName } = useTalentPortal()

  return (
    <div style={portalPage}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexWrap: 'wrap',
        }}
      >
        <Link to="/talent/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <TMXMark size="sm" />
          <span style={{ fontSize: 15, fontWeight: 700 }}>{PLATFORM_BRAND.name}</span>
        </Link>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} aria-label="Talent portal">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                padding: '7px 12px',
                borderRadius: 8,
                color: isActive ? '#fff' : 'rgba(232,238,244,0.7)',
                background: isActive ? 'rgba(22,163,74,0.28)' : 'transparent',
                border: isActive ? '1px solid rgba(22,163,74,0.45)' : '1px solid transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(232,238,244,0.55)' }}>{displayName}</span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: 'rgba(232,238,244,0.85)',
              fontSize: 13,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '28px 24px 64px' }}>
        <Outlet />
      </main>
    </div>
  )
}

export function TalentAppLayout() {
  return (
    <AgencyDataProvider>
      <TalentPortalGate>
        <ShellInner />
      </TalentPortalGate>
    </AgencyDataProvider>
  )
}
