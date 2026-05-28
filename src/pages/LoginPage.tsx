import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginScreen } from '@/components/auth/AuthScreens'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { companyCode, setCompanyCode, login } = useAuth()

  useEffect(() => {
    if (!companyCode) navigate('/', { replace: true })
  }, [companyCode, navigate])

  if (!companyCode) return null

  return (
    <LoginScreen
      companyCode={companyCode}
      onSignIn={(email, password) => login(email, password)}
      onLoginSuccess={() => navigate('/dashboard')}
      onBack={() => {
        setCompanyCode('')
        navigate('/')
      }}
    />
  )
}
