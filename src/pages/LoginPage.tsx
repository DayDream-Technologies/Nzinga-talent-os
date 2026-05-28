import { useNavigate } from 'react-router-dom'
import { LoginScreen } from '@/components/auth/AuthScreens'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { companyCode, switchUser } = useAuth()
  return (
    <LoginScreen
      companyCode={companyCode}
      onLogin={(u: import('@/types').User) => {
        switchUser(u)
        navigate('/dashboard')
      }}
      onBack={() => navigate('/')}
    />
  )
}
