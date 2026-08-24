import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AccountProfileTemplate } from '@/components/agency/AccountProfileTemplate'
import { Btn, Card, Panel, Table } from '@/components/agency/AgencyUI'
import { useAppData } from '@/context/AppDataContext'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAuth } from '@/hooks/useAuth'
import { useTalentDirectory } from '@/hooks/useTalentDirectory'
import { T } from '@/lib/tokens'
import { DocViewer } from '@/components/ui/DocViewer'
import { getProspectProfileByEmail, sendPasswordResetEmail } from '@/services/auth.service'
import { downloadUploadedDoc } from '@/lib/representation-agreement'
import type { UploadedDoc } from '@/types'
import type { ProspectContract } from '@/types/agency'

function ContractFilesSection({
  contracts,
  canUpload,
  onView,
  onDownload,
  onUpload,
}: {
  contracts: ProspectContract[]
  canUpload: boolean
  onView: (c: ProspectContract) => void
  onDownload: (c: ProspectContract) => void
  onUpload?: (file: File) => void
}) {
  const current = contracts.filter((c) => c.status === 'current')
  const past = contracts.filter((c) => c.status === 'past')

  function renderGroup(title: string, rows: ProspectContract[]) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 6 }}>{title}</div>
        {rows.length === 0 ? (
          <div style={{ fontSize: 12, color: T.t3, padding: '6px 0' }}>None on file.</div>
        ) : (
          <Table
            headers={['Title', 'Original start', 'End', 'File', '']}
            rows={rows.map((c) => [
              <span key={`t-${c.id}`}>
                <div style={{ fontWeight: 600 }}>{c.title}</div>
                {c.representationType && (
                  <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>
                    {c.representationType}
                    {c.termLengthYears ? ` · ${c.termLengthYears}y` : ''}
                  </div>
                )}
              </span>,
              new Date(`${c.startDate}T12:00:00`).toLocaleDateString(),
              c.endDate?.trim()
                ? new Date(`${c.endDate}T12:00:00`).toLocaleDateString()
                : 'Open-ended',
              <span key={`f-${c.id}`} style={{ fontSize: 11, color: T.t3 }}>
                {c.document.name}
              </span>,
              <div key={`a-${c.id}`} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Btn variant="secondary" onClick={() => onView(c)}>
                  View
                </Btn>
                <Btn variant="ghost" onClick={() => onDownload(c)}>
                  Download
                </Btn>
              </div>,
            ])}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      {renderGroup('Current contracts', current)}
      {renderGroup('Past contracts', past)}
      {canUpload && onUpload && (
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 4,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            color: T.blue,
          }}
        >
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
              e.target.value = ''
            }}
          />
          + Upload contract document
        </label>
      )}
    </div>
  )
}

export function TalentAccountPage() {
  const { accountId: rawId } = useParams<{ accountId: string }>()
  const accountId = rawId ? decodeURIComponent(rawId) : ''
  const directory = useTalentDirectory()
  const entry = directory.byAccountId.get(accountId)
  const { talents, applications } = useAppData()
  const { prospects, talent, addProspectContract } = useAgencyData()
  const { user } = useAuth()
  const [resetState, setResetState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [resetMessage, setResetMessage] = useState('')
  const [viewDoc, setViewDoc] = useState<UploadedDoc | null>(null)

  const pipeline = talents.find((t) => t.account_number === accountId || t.id === entry?.pipelineId)
  const prospect = prospects.find((p) => p.accountId === accountId)
  const rosterTalent = talent.find((item) => item.accountId === accountId)
  const talentEmail = (prospect?.email || entry?.email || pipeline?.email || '').trim()
  const application = Object.values(applications).find(
    (app) =>
      app.id === prospect?.linkedApplicationId ||
      (pipeline && (app.talent_id === pipeline.id || app.id === pipeline.application_id)) ||
      (talentEmail && app.talent_email?.toLowerCase() === talentEmail.toLowerCase()),
  )

  useEffect(() => {
    setResetState('idle')
    setResetMessage('')
    if (!talentEmail) return
    void getProspectProfileByEmail(talentEmail)
  }, [talentEmail, accountId])

  async function handleSendPasswordReset() {
    if (!talentEmail) {
      setResetState('error')
      setResetMessage('No email on file for this talent.')
      return
    }
    setResetState('loading')
    setResetMessage('')
    const { error, demo } = await sendPasswordResetEmail(talentEmail)
    if (error) {
      setResetState('error')
      setResetMessage(error)
      return
    }
    setResetState('sent')
    setResetMessage(
      demo
        ? `Demo mode: password reset simulated for ${talentEmail}.`
        : `A password reset message was sent to ${talentEmail}.`,
    )
  }

  if (!entry) {
    return (
      <Panel title="Talent account" subtitle="This account was not found in the current organization.">
        <Card>
          <div style={{ color: T.t3, fontSize: 13 }}>
            No talent, prospect, or roster record uses account ID {accountId || '—'}.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link to="/prospects" style={{ color: T.blue, fontWeight: 600 }}>
              Back to Prospects
            </Link>
          </div>
        </Card>
      </Panel>
    )
  }

  return (
    <>
      <AccountProfileTemplate
        kind="client"
        displayName={entry.name}
        statusLabel={entry.statusLabel}
        statusColor={T.blue}
        accountId={entry.accountId}
        email={talentEmail}
        phone={entry.phone || prospect?.phone}
        application={application}
        prospect={prospect}
        rosterTalent={rosterTalent}
        pipelineTalent={pipeline}
        backTo={{ label: 'Back to Prospects', to: '/prospects' }}
        extraActions={
          (prospect || talentEmail) && (
            <Btn
              variant="secondary"
              disabled={resetState === 'loading' || !talentEmail}
              onClick={() => void handleSendPasswordReset()}
            >
              {resetState === 'loading' ? 'Sending…' : 'Send password reset email'}
            </Btn>
          )
        }
        extraBody={
          <>
            {resetMessage && (
              <div style={{ margin: '8px 0 12px', fontSize: 12, color: resetState === 'error' ? T.red : T.green }}>
                {resetMessage}
              </div>
            )}
            <Card hover={false} style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, marginBottom: 8 }}>CONTRACTS</div>
              <ContractFilesSection
                contracts={prospect?.contracts || []}
                canUpload={Boolean(user && prospect)}
                onView={(c) => setViewDoc(c.document)}
                onDownload={(c) => downloadUploadedDoc(c.document)}
                onUpload={
                  prospect
                    ? (file) => {
                        const reader = new FileReader()
                        reader.onload = () => {
                          const today = new Date().toISOString().slice(0, 10)
                          addProspectContract(prospect.id, {
                            title: file.name.replace(/\.[^.]+$/, '') || 'Uploaded contract',
                            status: 'current',
                            startDate: today,
                            endDate: null,
                            representationType: prospect.representationType,
                            termLengthYears: prospect.termLengthYears,
                            document: {
                              name: file.name,
                              data: reader.result as string,
                              type: file.type || 'application/octet-stream',
                            },
                          })
                        }
                        reader.readAsDataURL(file)
                      }
                    : undefined
                }
              />
            </Card>
          </>
        }
        onUploadContract={
          prospect
            ? (file) => {
                const reader = new FileReader()
                reader.onload = () => {
                  const today = new Date().toISOString().slice(0, 10)
                  addProspectContract(prospect.id, {
                    title: file.name.replace(/\.[^.]+$/, '') || 'Uploaded contract',
                    status: 'current',
                    startDate: today,
                    endDate: null,
                    representationType: prospect.representationType,
                    termLengthYears: prospect.termLengthYears,
                    document: {
                      name: file.name,
                      data: reader.result as string,
                      type: file.type || 'application/octet-stream',
                    },
                  })
                }
                reader.readAsDataURL(file)
              }
            : undefined
        }
      />
      <DocViewer doc={viewDoc} onClose={() => setViewDoc(null)} />
    </>
  )
}
