import { Link, useParams } from 'react-router-dom'
import { AccountProfileTemplate } from '@/components/agency/AccountProfileTemplate'
import { Card, Panel } from '@/components/agency/AgencyUI'
import { isAppComplete } from '@/constants/app-sections'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { T } from '@/lib/tokens'
import type { Application } from '@/types/application'

function statusMeta(app: Application): { label: string; color: string } {
  if (app.status === 'pending_guardian' || app.guardian_status === 'pending') {
    return { label: 'Pending Parent Approval', color: T.amber }
  }
  if (app.status === 'sent') return { label: 'Sent', color: T.amber }
  if (app.status === 'in_progress') return { label: 'In Progress', color: T.blue }
  if (app.status === 'submitted') {
    return isAppComplete(app)
      ? { label: 'Complete', color: T.green }
      : { label: 'Incomplete', color: T.red }
  }
  return { label: 'Draft', color: T.t3 }
}

export function ApplicantAccountPage() {
  const { appId } = useParams<{ appId: string }>()
  const { applications, talents } = useAppData()
  const { prospects, talent } = useAgencyData()
  const application = (appId && applications[appId]) || Object.values(applications).find((app) => app.id === appId)

  if (!application) {
    return (
      <Panel title="Applicant account" subtitle="This application was not found.">
        <Card>
          <div style={{ color: T.t3, fontSize: 13 }}>No application uses id {appId || '—'}.</div>
          <div style={{ marginTop: 12 }}>
            <Link to="/applications" style={{ color: T.blue, fontWeight: 600 }}>
              Back to Applications
            </Link>
          </div>
        </Card>
      </Panel>
    )
  }

  const email = (application.talent_email || '').toLowerCase()
  const prospect = prospects.find(
    (p) => p.linkedApplicationId === application.id || (email && p.email?.toLowerCase() === email),
  )
  const pipelineTalent = talents.find(
    (t) => t.id === application.talent_id || t.application_id === application.id,
  )
  const rosterTalent = talent.find(
    (item) =>
      item.accountId === prospect?.accountId ||
      item.accountId === pipelineTalent?.account_number ||
      (email && item.email?.toLowerCase() === email),
  )
  const status = statusMeta(application)

  return (
    <AccountProfileTemplate
      kind="applicant"
      displayName={application.talent_name || 'Applicant'}
      statusLabel={status.label}
      statusColor={status.color}
      accountId={prospect?.accountId || pipelineTalent?.account_number || rosterTalent?.accountId}
      email={application.talent_email || prospect?.email}
      phone={String(application.data?.phone || prospect?.phone || '')}
      application={application}
      prospect={prospect}
      rosterTalent={rosterTalent}
      pipelineTalent={pipelineTalent}
      backTo={{ label: 'Back to Applications', to: '/applications' }}
    />
  )
}
