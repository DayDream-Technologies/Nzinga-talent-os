import { useAppData } from '@/context/AppDataContext'
import { ROLE_STAGE_ACCESS } from '@/constants/roles'
import type { Role, Talent } from '@/types'

export function useTalents() {
  const { talents, updateTalent, handleNewTalent } = useAppData()
  return { talents, updateTalent, handleNewTalent }
}

export function useVisibleTalents(role: Role): Talent[] {
  const { talents } = useAppData()
  const accessible = ROLE_STAGE_ACCESS[role] || []
  if (role === 'director') return talents
  return talents.filter((t) => accessible.includes(t.stage))
}
