import { useNavigate } from 'react-router-dom'
import { CompanyCodeScreen } from '@/components/auth/AuthScreens'
import { useAuth } from '@/hooks/useAuth'

export function CompanyCodePage() {
  const navigate = useNavigate()
  const { setCompanyCode } = useAuth()
  return (
    <CompanyCodeScreen
      onCode={(c: string) => {
        setCompanyCode(c)
        navigate('/login')
      }}
      onProspectPortal={() => navigate('/portal')}
    />
  )
}
