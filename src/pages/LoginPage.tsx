import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginScreen } from '@/components/auth/AuthScreens'
import { useAuth } from '@/hooks/useAuth'
import { GOOGLE_SIGN_IN_ERROR_KEY, signInWithGoogle } from '@/services/auth.service'

export function LoginPage() {
  const navigate = useNavigate()
  const { companyCode, setCompanyCode, login } = useAuth()
  const [googleError, setGoogleError] = useState('')

  useEffect(() => {
    if (!companyCode) navigate('/tmx', { replace: true })
  }, [companyCode, navigate])

  useEffect(() => {
    try {
      const message = sessionStorage.getItem(GOOGLE_SIGN_IN_ERROR_KEY)
      if (message) {
        setGoogleError(message)
        sessionStorage.removeItem(GOOGLE_SIGN_IN_ERROR_KEY)
      }
    } catch {
      /* ignore */
    }
  }, [])

  if (!companyCode) return null

  return (
    <LoginScreen
      companyCode={companyCode}
      onSignIn={(email: string, password: string) => login(email, password)}
      onLoginSuccess={() => navigate('/workspace')}
      onBack={() => navigate('/tmx')}
      onChangeCode={() => {
        setCompanyCode('')
        navigate('/tmx')
      }}
      onHome={() => navigate('/')}
      googleError={googleError}
      onGoogle={() => {
        void signInWithGoogle(companyCode).catch((err: Error) => setGoogleError(err.message))
      }}
    />
  )
}
