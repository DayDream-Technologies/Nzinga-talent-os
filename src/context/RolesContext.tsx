import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { RoleDefinition } from '@/types'
import { SYSTEM_ROLE_DEFINITIONS, getRoleCatalog, setRoleCatalog } from '@/constants/roles'
import { fetchRoleCatalog } from '@/services/roles.service'

interface RolesContextValue {
  roles: RoleDefinition[]
  loading: boolean
  reload: () => Promise<void>
}

const RolesContext = createContext<RolesContextValue | null>(null)

export function RolesProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<RoleDefinition[]>(() => getRoleCatalog())
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const { roles: next } = await fetchRoleCatalog()
    setRoles(next.length ? next : SYSTEM_ROLE_DEFINITIONS)
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const value = useMemo(() => ({ roles, loading, reload }), [roles, loading, reload])
  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>
}

export function useRoles() {
  const ctx = useContext(RolesContext)
  if (!ctx) {
    return {
      roles: getRoleCatalog(),
      loading: false,
      reload: async () => {},
    }
  }
  return ctx
}
