import { useAppData } from '@/context/AppDataContext'
import { isTalentVisibleToRole } from '@/constants/roles'
import type { Role, Talent } from '@/types'

export function useTalents() {
  const { talents, updateTalent, handleNewTalent } = useAppData()
  return { talents, updateTalent, handleNewTalent }
}

export function useVisibleTalents(role: Role, userId?: string): Talent[] {
  const { talents } = useAppData()
  return talents.filter((t) => isTalentVisibleToRole(t, role, userId))
}
