import { useSearchParams } from 'react-router-dom'
import { Reports } from '@/components/dashboard/History'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'

export function ReportsPage() {
  const { user } = useAuth()
  const { talents, applications } = useAppData()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') ?? undefined
  if (!user) return null
  return (
    <Reports
      talents={talents}
      userRole={user.role}
      applications={applications}
      initialTab={tabParam}
    />
  )
}
