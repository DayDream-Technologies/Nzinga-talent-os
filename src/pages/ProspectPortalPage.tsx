import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProspectPortal } from '@/components/application/ProspectPortal'
import { saveApplication } from '@/services/application.service'
import type { Application, ApplicationsMap } from '@/types'

export function ProspectPortalPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<ApplicationsMap>({})

  const saveApp = useCallback(async (app: Application) => {
    const saved = await saveApplication(app)
    setApplications((prev) => ({ ...prev, [saved.id]: saved }))
  }, [])

  return (
    <ProspectPortal
      applications={applications}
      onSaveApp={(app: Application) => {
        void saveApp(app)
      }}
      onBack={() => navigate('/')}
    />
  )
}
