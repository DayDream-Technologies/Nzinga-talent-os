import type { Task } from '@/types'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { demoStore } from './demo-store'

export async function fetchTasks(): Promise<Task[]> {
  if (!supabaseConfigured || !supabase) {
    return demoStore.getTasks()
  }
  const { data, error } = await supabase.from('tasks').select('*')
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    demoStore.setTasks(tasks)
    return
  }
  const { error } = await supabase.from('tasks').upsert(tasks)
  if (error) throw error
}
