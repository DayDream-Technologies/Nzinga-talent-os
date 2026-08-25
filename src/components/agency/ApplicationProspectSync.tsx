import { useEffect, useRef } from 'react'
import { useAppData } from '@/context/AppDataContext'
import { useAgencyData } from '@/context/AgencyDataContext'
import { SOP_STATUS } from '@/constants/sop-status'
import type { ProspectStage } from '@/types/agency'

/** Keep Agency prospects in sync when applications are sent / started / submitted. */
export function ApplicationProspectSync() {
  const { applications } = useAppData()
  const { upsertProspectFromApplication } = useAgencyData()
  const seen = useRef<Set<string>>(new Set())

  useEffect(() => {
    for (const app of Object.values(applications || {})) {
      const email = (app.talent_email || '').trim()
      if (!email) continue
      let stage: ProspectStage | null = null
      let sopSubStatus: string | null = null
      if (app.status === 'sent') stage = 'application_sent'
      else if (app.status === 'in_progress' || app.status === 'draft') stage = 'application_started'
      else if (app.status === 'pending_guardian') stage = 'application_pending'
      else if (app.status === 'submitted') {
        stage = 'application_completed'
        sopSubStatus = SOP_STATUS.underVetting
      }
      if (!stage) continue
      const key = `${app.id}:${stage}:${sopSubStatus || ''}`
      if (seen.current.has(key)) continue
      seen.current.add(key)
      upsertProspectFromApplication({
        email,
        name: app.talent_name || email,
        stage,
        applicationId: app.id,
        organization: app.company_code,
        sopSubStatus,
      })
    }
  }, [applications, upsertProspectFromApplication])

  return null
}
