import { useSearchParams } from 'react-router-dom'
import { Pipeline } from '@/components/pipeline/Pipeline'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'
import { ROLE_LABELS, STAGE_LABELS } from '@/constants'
import type { Talent, TalentStage } from '@/types'

export function PipelinePage() {
  const { user } = useAuth()
  const { talents, setSelectedTalent, updateTalent } = useAppData()
  const [searchParams] = useSearchParams()
  const stageParam = searchParams.get('stage') as TalentStage | null
  if (!user) return null
  const currentUser = user

  function handleMoveTalent(talent: Talent, toStage: TalentStage) {
    const updated: Talent = {
      ...talent,
      stage: toStage,
      audit_log: [
        ...(talent.audit_log || []),
        {
          user: currentUser.name,
          role: ROLE_LABELS[currentUser.role] || currentUser.role,
          action: `Moved to ${STAGE_LABELS[toStage]} via Kanban`,
          stage: toStage,
          ts: new Date().toISOString(),
        },
      ],
    }
    void updateTalent(updated)
  }

  return (
    <Pipeline
      talents={talents}
      onSelectTalent={setSelectedTalent}
      onMoveTalent={handleMoveTalent}
      userRole={currentUser.role}
      focusStage={stageParam || undefined}
      currentUser={currentUser}
    />
  )
}
