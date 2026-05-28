import { Tasks } from '@/components/dashboard/Tasks'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'

export function TasksPage() {
  const { user } = useAuth()
  const { tasks, setTasks, talents } = useAppData()
  if (!user) return null
  return <Tasks tasks={tasks} setTasks={setTasks} talents={talents} currentUser={user} />
}
