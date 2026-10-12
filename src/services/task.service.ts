import type { Task } from '@/types'
import { requireSupabase } from '@/lib/supabase'

export async function fetchTasks(): Promise<Task[]> {
  const db = requireSupabase()
  const { data, error } = await db.from('tasks').select('*')
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const db = requireSupabase()
  const { error } = await db.from('tasks').upsert(tasks)
  if (error) throw error
}
