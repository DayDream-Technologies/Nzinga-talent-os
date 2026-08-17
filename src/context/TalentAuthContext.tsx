import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ProspectProfile, Talent } from '@/types'
import {
  logout as authLogout,
  restoreApprovedTalentSession,
} from '@/services/auth.service'

interface TalentSessionState {
  profile: ProspectProfile
  talent: Talent
}

interface TalentAuthContextValue {
  session: TalentSessionState | null
  loading: boolean
  setSession: (session: TalentSessionState | null) => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const TalentAuthContext = createContext<TalentAuthContextValue | null>(null)

export function TalentAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TalentSessionState | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { profile, talent } = await restoreApprovedTalentSession()
      if (profile && talent) {
        setSession({ profile, talent })
      } else {
        setSession(null)
      }
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await authLogout()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, loading, setSession, logout, refresh }),
    [session, loading, logout, refresh],
  )

  return <TalentAuthContext.Provider value={value}>{children}</TalentAuthContext.Provider>
}

export function useTalentAuth() {
  const ctx = useContext(TalentAuthContext)
  if (!ctx) throw new Error('useTalentAuth must be used within TalentAuthProvider')
  return ctx
}
