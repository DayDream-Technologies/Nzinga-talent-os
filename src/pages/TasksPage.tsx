import { useSearchParams } from 'react-router-dom'
import { Tasks } from '@/components/dashboard/Tasks'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'

export function TasksPage() {
  const { user } = useAuth()
  const { tasks, setTasks, talents } = useAppData()
  const [searchParams] = useSearchParams()
  const filterParam = searchParams.get('filter')
  const initialFilter = filterParam === 'all_open' ? 'all' : undefined
  if (!user) return null
  return (
    <Tasks
      tasks={tasks}
      setTasks={setTasks}
      talents={talents}
      currentUser={user}
      initialFilter={initialFilter}
    />
  )
}
