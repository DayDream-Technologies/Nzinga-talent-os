import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types'

export function RoleGuard({ allowedRoles }: { allowedRoles: Role[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
