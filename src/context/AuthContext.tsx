import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { validateCompanyCode, loginWithCredentials, logout as authLogout } from '@/services/auth.service'

interface AuthContextValue {
  user: User | null
  companyCode: string
  setCompanyCode: (code: string) => void
  validateCode: (code: string) => boolean
  login: (email: string, password: string) => Promise<User | null>
  switchUser: (user: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [companyCode, setCompanyCode] = useState('')

  const validateCode = useCallback((code: string) => validateCompanyCode(code), [])

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
      setCompanyCode,
      validateCode,
      login,
      switchUser,
      logout,
    }),
    [user, companyCode, validateCode, login, switchUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
