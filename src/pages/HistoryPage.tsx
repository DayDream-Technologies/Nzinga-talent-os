import { HistoryMod } from '@/components/dashboard/History'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'

export function HistoryPage() {
  const { user } = useAuth()
  const { history, setHistory, talents } = useAppData()
  if (!user) return null
  return (
    <HistoryMod history={history} setHistory={setHistory} talents={talents} currentUser={user} />
  )
}
