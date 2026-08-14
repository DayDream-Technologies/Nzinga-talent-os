import { useMemo } from 'react'
import { useAppData } from '@/context/AppDataContext'
import { useAgencyData } from '@/context/AgencyDataContext'
import { buildTalentDirectory } from '@/lib/talent-account'

export function useTalentDirectory() {
  const { talents } = useAppData()
  const { talent, prospects } = useAgencyData()
  return useMemo(
    () => buildTalentDirectory({ pipeline: talents, roster: talent, prospects }),
    [talents, talent, prospects],
  )
}
