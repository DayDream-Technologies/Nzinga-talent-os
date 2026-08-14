import { Navigate, useLocation, useParams } from 'react-router-dom'
import { AgencyModule } from '@/components/agency/AgencyModules'
import { useAuth } from '@/hooks/useAuth'
import { canAccessAgencyPath } from '@/constants/agency-nav'

export function AgencyModulePage() {
  const { user } = useAuth()
  const { moduleId: paramId } = useParams<{ moduleId: string }>()
  const location = useLocation()
  const fromPath = location.pathname.replace(/^\//, '').split('?')[0]
  const moduleId = paramId || fromPath

  if (!user) return <Navigate to="/tmx" replace />
  if (!canAccessAgencyPath(user.role, moduleId)) {
    return <Navigate to="/workspace" replace />
  }

  return <AgencyModule moduleId={moduleId} />
}
