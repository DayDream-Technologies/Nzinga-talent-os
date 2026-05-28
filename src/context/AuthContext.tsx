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
    if (!supabaseConfigured) {
      setIsRestoringSession(false)
      return
    }

    let settled = false
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        setIsRestoringSession(false)
      }
    }, 3000)

    restoreSession().then((u) => {
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        if (u) setUser(u)
        setIsRestoringSession(false)
      }
    }).catch(() => {
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        setIsRestoringSession(false)
      }
    })

    const { data } = onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
      }
    })
    return () => {
      clearTimeout(timeout)
      data.subscription.unsubscribe()
    }
  }, [])

  const validateCode = useCallback((code: string) => validateCompanyCode(code), [])
  const validateCodeAsync = useCallback((code: string) => validateCompanyCodeFromDB(code), [])

  const login = useCallback(async (email: string, password: string) => {
    const u = await loginWithCredentials(email, password, companyCode)
    if (u) setUser(u)
    return u
  }, [companyCode])

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
