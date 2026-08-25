import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { PLATFORM_BRAND } from '@/constants/company-branding'
import { AgencyDataProvider } from '@/context/AgencyDataContext'
import { useTalentAuth } from '@/context/TalentAuthContext'
import { TMXMark } from '@/components/branding'
import { useTalentPortal } from '@/hooks/useTalentPortal'
import {
  DEFAULT_TALENT_PORTAL_PREFS,
  readTalentPortalPrefs,
  writeTalentPortalPrefs,
  type TalentPortalPrefs,
  type TalentPortalTheme,
} from '@/lib/talent-settings'

export const portalMuted = 'var(--tp-muted)'

export function portalThemeVars(theme: TalentPortalTheme): CSSProperties {
  if (theme === 'light') {
    return {
      '--tp-bg': '#f0f2f5',
      '--tp-fg': '#111827',
      '--tp-muted': 'rgba(17,24,39,0.58)',
      '--tp-card': '#ffffff',
      '--tp-border': '#e5e7eb',
      '--tp-input': '#ffffff',
      '--tp-inset': '#f8fafc',
      '--tp-nav-idle': 'rgba(17,24,39,0.65)',
      '--tp-header-border': '#e5e7eb',
      '--tp-danger': '#b91c1c',
    } as CSSProperties
  }
  return {
    '--tp-bg': '#0c1520',
    '--tp-fg': '#e8eef4',
    '--tp-muted': 'rgba(232,238,244,0.65)',
    '--tp-card': 'rgba(255,255,255,0.04)',
    '--tp-border': 'rgba(255,255,255,0.1)',
    '--tp-input': 'rgba(255,255,255,0.04)',
    '--tp-inset': 'rgba(0,0,0,0.25)',
    '--tp-nav-idle': 'rgba(232,238,244,0.7)',
    '--tp-header-border': 'rgba(255,255,255,0.08)',
    '--tp-danger': '#fca5a5',
  } as CSSProperties
}

export const portalPage: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--tp-bg)',
  color: 'var(--tp-fg)',
  fontFamily: "'Outfit', 'Segoe UI', sans-serif",
}

export const portalCard: CSSProperties = {
  background: 'var(--tp-card)',
  border: '1px solid var(--tp-border)',
  borderRadius: 12,
  padding: '20px 22px',
}

export const portalGhost: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--tp-border)',
  borderRadius: 6,
  color: 'var(--tp-fg)',
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export const portalPrimary: CSSProperties = {
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

export const portalDanger: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--tp-danger)',
  borderRadius: 6,
  color: 'var(--tp-danger)',
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export const portalInput: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--tp-border)',
  background: 'var(--tp-input)',
  color: 'var(--tp-fg)',
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
  { to: '/talent/settings', label: 'Settings' },
]

type PrefsContextValue = {
  prefs: TalentPortalPrefs
  setPrefs: (next: TalentPortalPrefs) => void
}

const TalentPortalPrefsContext = createContext<PrefsContextValue | null>(null)

export function useTalentPortalPrefs(): PrefsContextValue {
  return (
    useContext(TalentPortalPrefsContext) ?? {
      prefs: DEFAULT_TALENT_PORTAL_PREFS,
      setPrefs: () => {},
    }
  )
}

export function TalentPortalPrefsProvider({ email, children }: { email: string; children: ReactNode }) {
  const [prefs, setPrefsState] = useState<TalentPortalPrefs>(() => readTalentPortalPrefs(email))

  useEffect(() => {
    setPrefsState(readTalentPortalPrefs(email))
  }, [email])

  function setPrefs(next: TalentPortalPrefs) {
    setPrefsState(next)
    writeTalentPortalPrefs(email, next)
  }

  return <TalentPortalPrefsContext.Provider value={{ prefs, setPrefs }}>{children}</TalentPortalPrefsContext.Provider>
}

function TalentPortalGate({ children }: { children: ReactNode }) {
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

function ThemedShell() {
  const { handleLogout, displayName } = useTalentPortal()
  const { prefs } = useTalentPortalPrefs()

  return (
    <div style={{ ...portalPage, ...portalThemeVars(prefs.theme) }} data-talent-theme={prefs.theme}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 24px',
          borderBottom: '1px solid var(--tp-header-border)',
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
                color: isActive ? '#fff' : 'var(--tp-nav-idle)',
                background: isActive ? 'rgba(22,163,74,0.28)' : 'transparent',
                border: isActive ? '1px solid rgba(22,163,74,0.45)' : '1px solid transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--tp-muted)' }}>{displayName}</span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            style={{
              background: 'none',
              border: '1px solid var(--tp-border)',
              borderRadius: 8,
              color: 'var(--tp-fg)',
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

function ShellInner() {
  const { profile } = useTalentPortal()
  return (
    <TalentPortalPrefsProvider email={profile?.email || ''}>
      <ThemedShell />
    </TalentPortalPrefsProvider>
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
