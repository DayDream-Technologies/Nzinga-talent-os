import { Navigate, useNavigate } from 'react-router-dom'
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

  return {
    loading,
    session,
    profile: session?.profile as ProspectProfile | undefined,
    talent: session?.talent as Talent | undefined,
    ...records,
    ...agency,
    handleLogout,
  }
}

export function TalentPortalGate({ children }: { children: React.ReactNode }) {
  const { loading, session } = useTalentAuth()
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0c1520',
          color: 'rgba(232,238,244,0.65)',
        }}
      >
        Loading your talent portal…
      </div>
    )
  }
  if (!session) return <Navigate to="/talent/login" replace />
  return <>{children}</>
}
