import { useLocation, useParams } from 'react-router-dom'
import { AgencyModule } from '@/components/agency/AgencyModules'

export function AgencyModulePage() {
  const { moduleId: paramId } = useParams<{ moduleId: string }>()
  const location = useLocation()
  const fromPath = location.pathname.replace(/^\//, '').split('?')[0]
  const moduleId = paramId || fromPath
  return <AgencyModule moduleId={moduleId} />
}
