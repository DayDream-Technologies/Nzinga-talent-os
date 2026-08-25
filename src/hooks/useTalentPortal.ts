import { useNavigate } from 'react-router-dom'
import { useTalentAuth } from '@/context/TalentAuthContext'
import { useAgencyData } from '@/context/AgencyDataContext'
import { matchTalentRecords } from '@/lib/talent-portal'
import type { ProspectProfile, Talent } from '@/types'
import type { AgencyProspect, AgencyTalent } from '@/types/agency'

export function useTalentPortal() {
  const navigate = useNavigate()
  const { session, loading, logout } = useTalentAuth()
  const agency = useAgencyData()

  const records = session
    ? matchTalentRecords({
        profile: session.profile,
        talent: session.talent,
        prospects: agency.prospects,
        roster: agency.talent,
      })
    : { prospect: null as AgencyProspect | null, rosterTalent: null as AgencyTalent | null, displayName: '' }

  async function handleLogout() {
    await logout()
    navigate('/talent/login', { replace: true })
  }

  const { talent: roster, ...agencyRest } = agency

  return {
    loading,
    session,
    profile: session?.profile as ProspectProfile | undefined,
    talent: session?.talent as Talent | undefined,
    roster,
    ...records,
    ...agencyRest,
    handleLogout,
  }
}
