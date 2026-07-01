import { Workspace } from '@/components/dashboard/Dashboard'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function WorkspacePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  function nav(path: string) {
    if (path.includes('?')) {
      const [pathname, search] = path.split('?')
      navigate({ pathname: `/${pathname}`, search: `?${search}` })
    } else {
      navigate(`/${path}`)
    }
  }

  return <Workspace currentUser={user} onNav={nav} />
}
