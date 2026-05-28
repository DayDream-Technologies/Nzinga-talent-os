import { ProspectPortal } from '@/components/application/ProspectPortal'
import { useAppData } from '@/context/AppDataContext'
import { useNavigate } from 'react-router-dom'

export function ProspectPortalPage() {
  const { applications, saveApp } = useAppData()
  const navigate = useNavigate()
  return (
    <ProspectPortal
      applications={applications}
      onSaveApp={saveApp}
      onBack={() => navigate('/')}
    />
  )
}
