import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProspectPortal } from '@/components/application/ProspectPortal'
import { canApplyWithCompanyCode } from '@/constants/company-branding'
import { useAuth } from '@/hooks/useAuth'
import { saveApplication } from '@/services/application.service'
import type { Application, ApplicationsMap } from '@/types'

export function ProspectPortalPage() {
  const navigate = useNavigate()
  const { companyCode } = useAuth()
  const [applications, setApplications] = useState<ApplicationsMap>({})

  const allowed = canApplyWithCompanyCode(companyCode)

  useEffect(() => {
    if (!allowed) {
      navigate('/tmx', { replace: true })
    }
  }, [allowed, navigate])

  const saveApp = useCallback(async (app: Application) => {
    const saved = await saveApplication(app)
    setApplications((prev) => ({ ...prev, [saved.id]: saved }))
    return saved
  }, [])

  if (!allowed) return null

  return (
    <ProspectPortal
      applications={applications}
      companyCode={companyCode.trim().toUpperCase()}
      onSaveApp={saveApp}
      onBack={() => navigate('/tmx')}
    />
  )
}
