import { Dashboard } from '@/components/dashboard/Dashboard'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user } = useAuth()
  const { talents, tasks, history, applications, setSelectedTalent } = useAppData()
  const navigate = useNavigate()
  if (!user) return null
  return (
    <Dashboard
      talents={talents}
      tasks={tasks}
      history={history}
      currentUser={user}
      onSelectTalent={setSelectedTalent}
      onNav={(v: string) => navigate(`/${v}`)}
      applications={applications}
    />
  )
}
