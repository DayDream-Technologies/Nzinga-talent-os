import { useSearchParams } from 'react-router-dom'
import { HistoryMod } from '@/components/dashboard/History'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'

export function HistoryPage() {
  const { user } = useAuth()
  const { history, setHistory, talents } = useAppData()
  const [searchParams] = useSearchParams()
  const filterParam = searchParams.get('filter')
  const initialFilter = filterParam === 'flagged' ? 'flagged' : undefined
  if (!user) return null
  return (
    <HistoryMod
      history={history}
      setHistory={setHistory}
      talents={talents}
      currentUser={user}
      initialFilter={initialFilter}
    />
  )
}
