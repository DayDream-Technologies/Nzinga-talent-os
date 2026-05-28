import { Workspace } from '@/components/dashboard/Dashboard'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function WorkspacePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!user) return null
  return <Workspace currentUser={user} onNav={(v: string) => navigate(`/${v}`)} />
}
