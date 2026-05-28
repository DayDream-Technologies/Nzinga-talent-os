import { Reports } from '@/components/dashboard/History'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'

export function ReportsPage() {
  const { user } = useAuth()
  const { talents } = useAppData()
  if (!user) return null
  return <Reports talents={talents} userRole={user.role} />
}
