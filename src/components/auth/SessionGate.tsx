import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { readStorage, STORAGE_LAST_PATH, writeStorage } from '@/lib/session-storage'

/** Wraps protected routes: wait for session restore; restore last path after login settle. */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { user, isRestoringSession, companyCode, setCompanyCode } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (isRestoringSession || !user) return
    const path = location.pathname + location.search
    if (!path.startsWith('/tmx') && path !== '/login' && path !== '/') {
      writeStorage(STORAGE_LAST_PATH, path)
    }
  }, [location.pathname, location.search, user, isRestoringSession])

  useEffect(() => {
    if (isRestoringSession || !user) return
    if (!companyCode && user.company_code) {
      setCompanyCode(user.company_code)
    }
    const last = readStorage(STORAGE_LAST_PATH)
    const onAuthLanding =
      location.pathname === '/tmx' ||
      location.pathname === '/login' ||
      location.pathname === '/'
    if (last && onAuthLanding && last.startsWith('/') && !last.startsWith('/tmx') && last !== '/login') {
      navigate(last, { replace: true })
    }
  }, [isRestoringSession, user, companyCode, setCompanyCode, location.pathname, navigate])

  if (isRestoringSession) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: '#6b7280',
          fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        }}
      >
        Restoring session…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/tmx" replace />
  }

  return <>{children}</>
}
