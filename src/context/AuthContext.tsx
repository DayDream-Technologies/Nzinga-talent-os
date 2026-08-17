import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import {
  validateCompanyCode,
  validateCompanyCodeFromDB,
  loginWithCredentials,
  restoreSession,
  logout as authLogout,
} from '@/services/auth.service'
import { clearLocalAuthSession, supabaseConfigured, onAuthStateChange } from '@/lib/supabase'
import {
  IDLE_MS,
  STORAGE_COMPANY_CODE,
  STORAGE_LAST_PATH,
  isIdleExpired,
  readStorage,
  removeStorage,
  touchActivity,
  writeStorage,
} from '@/lib/session-storage'
import { IdleReauthModal } from '@/components/auth/IdleReauthModal'

interface AuthContextValue {
  user: User | null
  companyCode: string
  isRestoringSession: boolean
  needsReauth: boolean
  setCompanyCode: (code: string) => void
  validateCode: (code: string) => boolean
  validateCodeAsync: (code: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<User | null>
  switchUser: (user: User) => void
  logout: () => Promise<void>
  clearNeedsReauth: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [companyCode, setCompanyCodeState] = useState(() => readStorage(STORAGE_COMPANY_CODE) || '')
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const [needsReauth, setNeedsReauth] = useState(false)
  const userRef = useRef<User | null>(null)
  userRef.current = user

  const setCompanyCode = useCallback((code: string) => {
    const normalized = code.trim().toUpperCase()
    setCompanyCodeState(normalized)
    if (normalized) writeStorage(STORAGE_COMPANY_CODE, normalized)
    else removeStorage(STORAGE_COMPANY_CODE)
  }, [])

  useEffect(() => {
    let settled = false
    const finish = (u: User | null) => {
      if (settled) return
      settled = true
      if (u) {
        setUser(u)
        const code = (u.company_code || readStorage(STORAGE_COMPANY_CODE) || '').toUpperCase()
        if (code) {
          setCompanyCodeState(code)
          writeStorage(STORAGE_COMPANY_CODE, code)
        }
        if (isIdleExpired()) {
          setNeedsReauth(true)
        } else {
          touchActivity()
        }
      }
      setIsRestoringSession(false)
    }

    if (!supabaseConfigured) {
      // Demo: restore last demo user if present in sessionStorage
      try {
        const demo = sessionStorage.getItem('nto_demo_user_id')
        if (demo) {
          void import('@/constants/seed-data').then(({ USERS }) => {
            const u = USERS.find((x) => x.id === demo) ?? null
            finish(u)
          })
          return
        }
      } catch {
        /* ignore */
      }
      finish(null)
      return
    }

    const timeout = setTimeout(() => finish(null), 4000)

    restoreSession()
      .then((u) => {
        clearTimeout(timeout)
        finish(u)
      })
      .catch(async () => {
        await clearLocalAuthSession()
        clearTimeout(timeout)
        finish(null)
      })

    const { data } = onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') return
      if (event === 'TOKEN_REFRESHED' && !session) {
        void clearLocalAuthSession()
        setUser(null)
        return
      }
      if (!session && !needsReauth) {
        setUser(null)
      }
    })
    return () => {
      clearTimeout(timeout)
      data.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist last path while authenticated
  useEffect(() => {
    if (!user || typeof window === 'undefined') return
    const path = window.location.pathname + window.location.search
    if (path.startsWith('/tmx') || path === '/login' || path === '/') return
    writeStorage(STORAGE_LAST_PATH, path)
  })

  // Idle activity tracking
  useEffect(() => {
    if (!user || needsReauth) return

    const onActivity = () => touchActivity()
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const
    for (const ev of events) window.addEventListener(ev, onActivity, { passive: true })
    touchActivity()

    const interval = window.setInterval(() => {
      if (!userRef.current) return
      if (isIdleExpired(IDLE_MS)) setNeedsReauth(true)
    }, 15_000)

    return () => {
      for (const ev of events) window.removeEventListener(ev, onActivity)
      window.clearInterval(interval)
    }
  }, [user, needsReauth])

  const validateCode = useCallback((code: string) => validateCompanyCode(code), [])
  const validateCodeAsync = useCallback((code: string) => validateCompanyCodeFromDB(code), [])

  const login = useCallback(async (email: string, password: string) => {
    const u = await loginWithCredentials(email, password, companyCode)
    if (u) {
      setUser(u)
      const code = (u.company_code || companyCode || '').toUpperCase()
      if (code) {
        setCompanyCodeState(code)
        writeStorage(STORAGE_COMPANY_CODE, code)
      }
      touchActivity()
      setNeedsReauth(false)
      if (!supabaseConfigured) {
        try {
          sessionStorage.setItem('nto_demo_user_id', u.id)
        } catch {
          /* ignore */
        }
      }
    }
    return u
  }, [companyCode])

  const switchUser = useCallback((u: User) => {
    setUser(u)
    touchActivity()
    setNeedsReauth(false)
    if (!supabaseConfigured) {
      try {
        sessionStorage.setItem('nto_demo_user_id', u.id)
      } catch {
        /* ignore */
      }
    }
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
    setUser(null)
    setCompanyCodeState('')
    setNeedsReauth(false)
    removeStorage(STORAGE_COMPANY_CODE)
    removeStorage(STORAGE_LAST_PATH)
    try {
      sessionStorage.removeItem('nto_demo_user_id')
    } catch {
      /* ignore */
    }
  }, [])

  const clearNeedsReauth = useCallback(() => {
    setNeedsReauth(false)
    touchActivity()
  }, [])

  const value = useMemo(
    () => ({
      user,
      companyCode,
      isRestoringSession,
      needsReauth,
      setCompanyCode,
      validateCode,
      validateCodeAsync,
      login,
      switchUser,
      logout,
      clearNeedsReauth,
    }),
    [
      user,
      companyCode,
      isRestoringSession,
      needsReauth,
      setCompanyCode,
      validateCode,
      validateCodeAsync,
      login,
      switchUser,
      logout,
      clearNeedsReauth,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      {needsReauth && user && (
        <IdleReauthModal
          email={user.email}
          companyCode={companyCode || user.company_code || ''}
          onSuccess={clearNeedsReauth}
          onSignOut={() => {
            void logout()
          }}
        />
      )}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
