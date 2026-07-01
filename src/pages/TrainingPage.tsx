import { TrainingPanel } from '@/components/admin/TrainingPanel'
import { useAuth } from '@/hooks/useAuth'

export function TrainingPage() {
  const { user } = useAuth()
  if (!user) return null
  return <TrainingPanel role={user.role} />
}
