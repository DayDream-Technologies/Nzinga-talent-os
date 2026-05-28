export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'
export type TaskStatus = 'open' | 'done' | 'cancelled'

export interface Task {
  id: string
  title: string
  assigned_to: string
  related_talent: string
  due: string
  priority: TaskPriority
  status: TaskStatus
  created_by: string
  created_at: string
  notes: string
}
