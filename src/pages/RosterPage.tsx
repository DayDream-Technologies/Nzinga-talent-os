import { Roster } from '@/components/pipeline/Pipeline'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'

export function RosterPage() {
  const { user } = useAuth()
  const { talents, setSelectedTalent } = useAppData()
  if (!user) return null
  return <Roster talents={talents} onSelectTalent={setSelectedTalent} userRole={user.role} />
}
