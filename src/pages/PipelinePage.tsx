import { Pipeline } from '@/components/pipeline/Pipeline'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'

export function PipelinePage() {
  const { user } = useAuth()
  const { talents, setSelectedTalent } = useAppData()
  if (!user) return null
  return (
    <Pipeline talents={talents} onSelectTalent={setSelectedTalent} userRole={user.role} />
  )
}
