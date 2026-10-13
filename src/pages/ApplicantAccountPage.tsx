import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AccountProfileTemplate } from '@/components/agency/AccountProfileTemplate'
import { Btn, Card, Panel } from '@/components/agency/AgencyUI'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { isAppComplete } from '@/constants/app-sections'
import { hasPermission } from '@/constants/roles'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { T } from '@/lib/tokens'
import type { Application } from '@/types/application'

function statusMeta(app: Application): { label: string; color: string } {
  if (app.status === 'archived') return { label: 'Archived', color: '#6b7280' }
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
  const { applications, talents, archiveApplications, restoreApplications } = useAppData()
  const { prospects, talent } = useAgencyData()
  const { user } = useAuth()
  const canArchive = Boolean(user && hasPermission(user.role, 'admin_access'))
  const [confirmArchive, setConfirmArchive] = useState(false)
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
  const archived = application.status === 'archived'

  return (
    <>
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
      extraActions={
        canArchive ? (
          <Btn variant={archived ? 'secondary' : 'danger'} onClick={() => setConfirmArchive(true)}>
            {archived ? 'Restore application' : 'Archive application'}
          </Btn>
        ) : null
      }
    />
    <ConfirmDialog
      open={confirmArchive}
      title={archived ? 'Restore application?' : 'Archive application?'}
      message={
        archived
          ? 'Restore this application to the status it had before archive? It returns to the active list.'
          : 'Archive this application? It leaves the active list, and the applicant can no longer edit it. You can restore it from the Archived filter. The talent record stays in its current pipeline stage.'
      }
      confirmLabel={archived ? 'Restore' : 'Archive'}
      danger={!archived}
      onCancel={() => setConfirmArchive(false)}
      onConfirm={() => {
        setConfirmArchive(false)
        const action = archived ? restoreApplications : archiveApplications
        void action([application.id]).catch(() => {})
      }}
    />
    </>
  )
}
