import { useAppData } from '@/context/AppDataContext'

export function useTasks() {
  const { tasks, setTasks } = useAppData()
  return { tasks, setTasks }
}
