import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { CreateProspectModal, type CreateProspectInput } from '@/components/agency/CreateProspectModal'
import { isAppComplete } from '@/constants/app-sections'
import { completedSectionsFromData, prefillApplicationData } from '@/lib/application-prefill'
import { sendGeneralEmail } from '@/lib/email'
import { BulkActionsMenu, RowActionsMenu, stubGroups } from '@/components/agency/RowActionsMenu'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Btn, Field, ModalShell, Panel, SelectAllCheckbox, Table, inputStyle } from '@/components/agency/AgencyUI'
import {
  PROSPECT_STAGE_LABELS,
  PROSPECT_TRACKING_STAGES,
  normalizeProspectStage,
} from '@/constants/prospect-stages'
import { catalogNames } from '@/lib/lookup-catalogs'
import { AGENCY_PROPERTY, formatAccountDisplay } from '@/lib/session-storage'
import { talentAccountPath } from '@/lib/talent-account'
import { resolvePipelineTalentId } from '@/lib/resolve-history-talent'
import { T } from '@/lib/tokens'
import type { AgencyProspect, ProspectStage } from '@/types/agency'
import type { Application } from '@/types'

const OFFICIAL_PROSPECT_STAGES = new Set([
  'application_completed',
  'screening_completed',
  'application_approved',
  'contact_published',
  'contract_completed',
])

function invitationFor(prospect: AgencyProspect, companyCode: string): Application {
  const talent = {
    id: prospect.id,
    name: prospect.name,
    email: prospect.email,
    phone: prospect.phone,
    first_name: prospect.firstName,
    last_name: prospect.lastName,
    dob: prospect.dateOfBirth,
    account_number: prospect.accountId,
  }
  const data = prefillApplicationData({ talent, prospect })
  const code =
    (prospect.name || 'APPL').toUpperCase().replace(/\s+/g, '').slice(0, 4) +
    Math.floor(1000 + Math.random() * 8999)
  return {
    id: `app_${prospect.id}_${Date.now()}`,
    talent_id: prospect.id,
    access_code: code,
    company_code: companyCode,
    talent_name: prospect.name,
    talent_email: prospect.email || '',
    status: 'sent',
    created_at: new Date().toISOString(),
    last_saved: new Date().toISOString(),
    completed_sections: completedSectionsFromData({ ...data, email: prospect.email || '' }),
    data: { ...data, email: prospect.email || '' },
  }
}
import { SendApplicationModal } from '@/components/application/ApplicationModals'

export function ProspectsCrmModule() {
  const {
    prospects,
    createProspect,
    updateProspect,
    deleteProspects,
    mergeProspects,
    setProspectStage,
    sendMessage,
  } = useAgencyData()
  const { handleSendApp, setHistory, talents, applications } = useAppData()
  const { user, companyCode } = useAuth()
  const navigate = useNavigate()

  const [stageFilter, setStageFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [sendAppFor, setSendAppFor] = useState<AgencyProspect | null>(null)
  const [emailFor, setEmailFor] = useState<AgencyProspect | null>(null)
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [survivorId, setSurvivorId] = useState('')
  const [stageBulk, setStageBulk] = useState<ProspectStage | null>(null)
  const [noteFor, setNoteFor] = useState<AgencyProspect | null>(null)
  const [noteText, setNoteText] = useState('')

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      const stage = normalizeProspectStage(p.stage)
      const linked = p.linkedApplicationId ? applications[p.linkedApplicationId] : undefined
      const complete = Boolean(linked && isAppComplete(linked) && linked.status === 'submitted')
      const official = OFFICIAL_PROSPECT_STAGES.has(stage) || complete
      if (!official && stageFilter !== 'lost') return false
      if (p.lost && stageFilter !== 'lost') return false
      if (stage === 'contract_completed' && stageFilter === 'all') return false
      if (stageFilter === 'all') return !p.lost
      if (stageFilter === 'lost') return !!p.lost
      return stage === stageFilter
    })
  }, [prospects, stageFilter, applications])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) filtered.forEach((p) => next.add(p.id))
      else filtered.forEach((p) => next.delete(p.id))
      return next
    })
  }

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id))
  const someSelected = filtered.some((p) => selected.has(p.id))

  const selectedList = useMemo(
    () => prospects.filter((p) => selected.has(p.id)),
    [prospects, selected],
  )

  const bulkGroups = stubGroups(
    [
      { label: 'History', actions: ['Add to History'] },
      { label: 'Issue', actions: ['Create Issue'] },
      { label: 'Charge', actions: ['Add Charge'] },
      { label: 'Reports', actions: ['Report Writer'] },
      { label: 'Communication', actions: ['Send Email', 'Phone Broadcast'] },
      {
        label: 'Manage Prospects',
        actions: ['Set to Lost', 'Change Stage', 'Merge Duplicates', 'Delete'],
      },
    ],
    {
      'Add to History': {
        id: 'Add to History',
        label: 'Add to History',
        onClick: () => {
          const first = selectedList[0]
          if (first) {
            setNoteFor(first)
            setNoteText(`Bulk note for ${selected.size} prospect(s)`)
          }
        },
      },
      'Send Email': {
        id: 'Send Email',
        label: 'Send Email',
        onClick: () => {
          const first = selectedList.find((p) => p.email)
          if (first) setEmailFor(first)
        },
      },
      'Set to Lost': {
        id: 'Set to Lost',
        label: 'Set to Lost',
        onClick: () => {
          for (const id of selected) updateProspect(id, { lost: true })
          setSelected(new Set())
        },
      },
      'Change Stage': {
        id: 'Change Stage',
        label: 'Change Stage',
        onClick: () => setStageBulk('new_prospect'),
      },
      'Merge Duplicates': {
        id: 'Merge Duplicates',
        label: 'Merge Duplicates',
        disabled: selected.size !== 2,
        onClick: () => {
          const ids = [...selected]
          setSurvivorId(ids[0])
          setMergeOpen(true)
        },
      },
      Delete: {
        id: 'Delete',
        label: 'Delete',
        danger: true,
        onClick: () => setDeleteIds([...selected]),
      },
    },
  )

  return (
    <Panel
      title="Prospects"
      actions={
        <>
          <BulkActionsMenu groups={bulkGroups} disabled={selected.size === 0} />
          <Btn onClick={() => setShowCreate(true)}>+ Add Prospect</Btn>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {selected.size > 0 && (
          <span style={{ fontSize: 12, color: T.t3 }}>{selected.size} selected</span>
        )}
      </div>

      <div
        style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 10,
          overflowX: 'auto',
          overflowY: 'visible',
          position: 'relative',
          zIndex: 1,
          padding: '0 4px',
        }}
      >
        <Table
          selectAll={
            <SelectAllCheckbox
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              disabled={filtered.length === 0}
              onChange={toggleAll}
            />
          }
          onRowClick={(i) => {
            const p = filtered[i]
            if (p?.accountId) navigate(talentAccountPath(p.accountId))
          }}
          rowSelected={filtered.map((p) => selected.has(p.id))}
          headers={[
            '',
            'First name',
            'Last name',
            'Property',
            'Street',
            'City',
            'State',
            'Postal',
            'Account #',
            'Agent',
            '',
          ]}
          rows={filtered.map((p) => [
            <input
              key={`c-${p.id}`}
              type="checkbox"
              checked={selected.has(p.id)}
              aria-label={`Select ${p.name}`}
              onClick={(e) => e.stopPropagation()}
              onChange={() => toggle(p.id)}
            />,
            p.firstName || p.name.split(' ')[0] || '—',
            p.lastName || p.name.split(' ').slice(1).join(' ') || '—',
            p.property || AGENCY_PROPERTY,
            p.street || '—',
            p.city || '—',
            p.state || '—',
            p.postal || '—',
            <span key={`a-${p.id}`} style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 650 }}>
              {formatAccountDisplay(p.accountId)}
            </span>,
            p.assignedAgentName || '—',
            <RowActionsMenu
              key={`m-${p.id}`}
              items={[
                {
                  id: 'email',
                  label: 'Send Email',
                  onClick: () => setEmailFor(p),
                },
                {
                  id: 'note',
                  label: 'Add Note',
                  onClick: () => {
                    setNoteFor(p)
                    setNoteText('')
                  },
                },
                {
                  id: 'call',
                  label: 'Add Call',
                  onClick: () => {
                    setNoteFor(p)
                    setNoteText('Call logged')
                  },
                },
                {
                  id: 'send-app',
                  label: 'Send Application',
                  onClick: () => setSendAppFor(p),
                },
                {
                  id: 'tracking',
                  label: 'Open on Tracking Board',
                  onClick: () => navigate('/prospect-tracking'),
                },
                {
                  id: 'invoices',
                  label: 'Show All Invoices',
                  stub: true,
                },
                {
                  id: 'delete',
                  label: 'Delete',
                  danger: true,
                  onClick: () => setDeleteIds([p.id]),
                },
              ]}
            />,
          ])}
        />
      </div>

      {showCreate && user && (
        <CreateProspectModal
          defaultOrganization={(companyCode || user.company_code || 'NZG').toUpperCase()}
          agent={{ id: user.id, name: user.name }}
          onClose={() => setShowCreate(false)}
          onCreate={(values: CreateProspectInput, action) => {
            const created = createProspect({ ...values, stage: 'application_sent' })
            const code = companyCode || user.company_code || 'NZG'
            const app = invitationFor(created, code.toUpperCase())
            handleSendApp(app, { accountNumber: created.accountId })
            updateProspect(created.id, { stage: 'application_sent', linkedApplicationId: app.id })
            const origin = typeof window !== 'undefined' ? window.location.origin : ''
            if (created.email) {
              void sendGeneralEmail({
                toEmail: created.email,
                toName: created.name,
                subject: 'Your Nzinga application',
                textBody: `Finish your application at ${origin}/portal with access code ${app.access_code}.`,
                htmlBody: `<p>Finish your application at <a href="${origin}/portal">${origin}/portal</a>.</p><p>Access code: <strong>${app.access_code}</strong></p>`,
              })
            }
            if (action !== 'new') setShowCreate(false)
          }}
        />
      )}

      {emailFor && (
        <InlineProspectEmail
          prospect={emailFor}
          onClose={() => setEmailFor(null)}
          onSent={(subject, body) => {
            setHistory((prev) => [
              {
                id: `h_${Date.now()}`,
                talent_id: resolvePipelineTalentId(talents, {
                  id: emailFor.id,
                  email: emailFor.email,
                  applicationId: emailFor.linkedApplicationId,
                  accountId: emailFor.accountId,
                }),
                account_number: emailFor.accountId || null,
                user_id: user?.id || null,
                type: 'email',
                text: `Email to ${emailFor.email}: ${subject}\n\n${body}`,
                ts: new Date().toISOString(),
                flagged: false,
                is_document: false,
                email_subject: subject,
                email_to: emailFor.email || '',
                staff_name: user?.name,
              },
              ...prev,
            ])
            sendMessage({
              channel: 'email',
              to: emailFor.email || '',
              subject,
              preview: body,
            })
          }}
        />
      )}

      {sendAppFor && (
        <SendApplicationModal
          talent={{
            id: sendAppFor.id,
            name: sendAppFor.name,
            email: sendAppFor.email,
            phone: sendAppFor.phone,
            first_name: sendAppFor.firstName,
            last_name: sendAppFor.lastName,
            dob: sendAppFor.dateOfBirth,
            city: sendAppFor.city,
            state: sendAppFor.state,
            account_number: sendAppFor.accountId,
          }}
          prospect={sendAppFor}
          companyCode={companyCode || 'NZG'}
          onClose={() => setSendAppFor(null)}
          onSend={(app: import('@/types').Application) => {
            handleSendApp(app, { accountNumber: sendAppFor.accountId })
            updateProspect(sendAppFor.id, {
              stage: 'application_sent',
              linkedApplicationId: app.id,
            })
          }}
        />
      )}

      {noteFor && (
        <ModalShell title="Add to History" onClose={() => setNoteFor(null)} width={400}>
          <Field label={noteFor.name}>
            <textarea
              style={{ ...inputStyle, minHeight: 100 }}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Btn variant="secondary" onClick={() => setNoteFor(null)}>
              Cancel
            </Btn>
            <Btn
              onClick={() => {
                if (!noteText.trim()) return
                setHistory((prev) => [
                  {
                    id: `h_${Date.now()}`,
                    talent_id: resolvePipelineTalentId(talents, {
                      id: noteFor.id,
                      email: noteFor.email,
                      applicationId: noteFor.linkedApplicationId,
                      accountId: noteFor.accountId,
                    }),
                    account_number: noteFor.accountId || null,
                    user_id: user?.id || null,
                    type: 'note',
                    text: noteText.trim(),
                    ts: new Date().toISOString(),
                    flagged: false,
                    is_document: false,
                  },
                  ...prev,
                ])
                updateProspect(noteFor.id, {
                  notes: `${noteFor.notes ? noteFor.notes + '\n' : ''}${noteText.trim()}`,
                })
                setNoteFor(null)
              }}
            >
              Save
            </Btn>
          </div>
        </ModalShell>
      )}

      {stageBulk && (
        <ModalShell title="Change Stage" onClose={() => setStageBulk(null)} width={380}>
          <Field label="New stage">
            <select
              style={inputStyle}
              value={stageBulk}
              onChange={(e) => setStageBulk(e.target.value as ProspectStage)}
            >
              {(PROSPECT_TRACKING_STAGES.filter((s) => catalogNames('Recruitment Stages').includes(PROSPECT_STAGE_LABELS[s])).length
                ? PROSPECT_TRACKING_STAGES.filter((s) => catalogNames('Recruitment Stages').includes(PROSPECT_STAGE_LABELS[s]))
                : PROSPECT_TRACKING_STAGES
              ).map((s) => (
                <option key={s} value={s}>
                  {PROSPECT_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Btn variant="secondary" onClick={() => setStageBulk(null)}>
              Cancel
            </Btn>
            <Btn
              onClick={() => {
                for (const id of selected) setProspectStage(id, stageBulk)
                setStageBulk(null)
                setSelected(new Set())
              }}
            >
              Apply
            </Btn>
          </div>
        </ModalShell>
      )}

      {mergeOpen && selectedList.length === 2 && (
        <ModalShell title="Merge Duplicates" onClose={() => setMergeOpen(false)} width={420}>
          <p style={{ fontSize: 13, color: T.t3, marginBottom: 12 }}>
            Choose the survivor account. Notes, contracts, and application links from the other
            record will move onto the survivor; the duplicate is removed.
          </p>
          {selectedList.map((p) => (
            <label
              key={p.id}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: '8px 0',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="survivor"
                checked={survivorId === p.id}
                onChange={() => setSurvivorId(p.id)}
              />
              <span>
                <strong>{p.name}</strong> · {formatAccountDisplay(p.accountId)} · {p.email}
              </span>
            </label>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <Btn variant="secondary" onClick={() => setMergeOpen(false)}>
              Cancel
            </Btn>
            <Btn
              onClick={() => {
                const other = selectedList.find((p) => p.id !== survivorId)
                if (survivorId && other) {
                  mergeProspects(survivorId, other.id)
                  setSelected(new Set())
                  setMergeOpen(false)
                }
              }}
            >
              Merge
            </Btn>
          </div>
        </ModalShell>
      )}

      <ConfirmDialog
        open={!!deleteIds}
        title="Delete permanently?"
        message={`Delete ${deleteIds?.length || 0} prospect(s)? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteIds(null)}
        onConfirm={() => {
          if (deleteIds) deleteProspects(deleteIds)
          setDeleteIds(null)
          setSelected(new Set())
        }}
      />
    </Panel>
  )
}

function InlineProspectEmail({
  prospect,
  onClose,
  onSent,
}: {
  prospect: AgencyProspect
  onClose: () => void
  onSent: (subject: string, body: string) => void
}) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  async function send(action: 'new' | 'finish') {
    if (!prospect.email) {
      setError('This prospect has no email.')
      return
    }
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are required.')
      return
    }
    const result = await sendGeneralEmail({
      toEmail: prospect.email,
      toName: prospect.name,
      subject: subject.trim(),
      textBody: body.trim(),
      htmlBody: `<p>${body.trim().replace(/\n/g, '<br/>')}</p>`,
    })
    if (result.status === 'failed') {
      setError(result.message)
      return
    }
    onSent(subject.trim(), body.trim())
    if (action === 'new') {
      setSubject('')
      setBody('')
      setError('')
      return
    }
    onClose()
  }

  return (
    <ModalShell title="Send Email" onClose={onClose} width={560}>
      <Field label="To">
        <input style={inputStyle} value={prospect.email || ''} readOnly />
      </Field>
      <Field label="Subject">
        <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Message">
        <textarea
          style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </Field>
      {error && <div style={{ color: T.red, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn variant="secondary" onClick={() => void send('new')}>
          Save and New
        </Btn>
        <Btn onClick={() => void send('finish')}>Save and Finish</Btn>
      </div>
    </ModalShell>
  )
}
