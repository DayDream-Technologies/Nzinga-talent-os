import { useSearchParams } from 'react-router-dom'
import { Pipeline } from '@/components/pipeline/Pipeline'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'
import type { TalentStage } from '@/types'

export function PipelinePage() {
  const { user } = useAuth()
  const { talents, setSelectedTalent } = useAppData()
  const [searchParams] = useSearchParams()
  const stageParam = searchParams.get('stage') as TalentStage | null
  if (!user) return null
  return (
    <Pipeline
      talents={talents}
      onSelectTalent={setSelectedTalent}
      userRole={user.role}
      focusStage={stageParam || undefined}
      currentUserId={user.id}
    />
  )
}
