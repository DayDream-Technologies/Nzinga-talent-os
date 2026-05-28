import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import {
  validateCompanyCode,
  validateCompanyCodeFromDB,
  loginWithCredentials,
  restoreSession,
  logout as authLogout,
} from '@/services/auth.service'
import { supabaseConfigured, onAuthStateChange } from '@/lib/supabase'

interface AuthContextValue {
  user: User | null
  companyCode: string
  isRestoringSession: boolean
  setCompanyCode: (code: string) => void
  validateCode: (code: string) => boolean
  validateCodeAsync: (code: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<User | null>
  switchUser: (user: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [companyCode, setCompanyCode] = useState('')
  const [isRestoringSession, setIsRestoringSession] = useState(supabaseConfigured)

  useEffect(() => {
    if (!supabaseConfigured) return
    restoreSession().then((u) => {
      if (u) setUser(u)
      setIsRestoringSession(false)
    }).catch(() => setIsRestoringSession(false))

    const { data } = onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
      }
    })
    return () => { data.subscription.unsubscribe() }
  }, [])

  const validateCode = useCallback((code: string) => validateCompanyCode(code), [])
  const validateCodeAsync = useCallback((code: string) => validateCompanyCodeFromDB(code), [])

  const login = useCallback(async (email: string, password: string) => {
    const u = await loginWithCredentials(email, password)
    if (u) setUser(u)
    return u
  }, [])

  const switchUser = useCallback((u: User) => setUser(u), [])

  const logout = useCallback(async () => {
    await authLogout()
    setUser(null)
    setCompanyCode('')
  }, [])

  const value = useMemo(
    () => ({
      user,
      companyCode,
      isRestoringSession,
      setCompanyCode,
      validateCode,
      validateCodeAsync,
      login,
      switchUser,
      logout,
    }),
    [user, companyCode, isRestoringSession, validateCode, validateCodeAsync, login, switchUser, logout],
  )

  if (isRestoringSession) {
    return (
      <AuthContext.Provider value={value}>
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#666', fontSize: 14 }}>Loading...</p>
        </div>
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
