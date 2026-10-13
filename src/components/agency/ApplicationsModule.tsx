import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { BulkActionsMenu, RowActionsMenu, stubGroups, type ActionItem } from '@/components/agency/RowActionsMenu'
import { Badge, Btn, Panel, SelectAllCheckbox, Table, inputStyle } from '@/components/agency/AgencyUI'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getVisibleSections, isAppComplete, validateSection } from '@/constants/app-sections'
import { hasPermission } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { isApplicationReadyToImport } from '@/lib/application-prefill'
import { AGENCY_PROPERTY, formatAccountDisplay } from '@/lib/session-storage'
import { talentAccountPath } from '@/lib/talent-account'
import { T } from '@/lib/tokens'
import type { Application } from '@/types'

type StatusFilter = 'all' | 'pending' | 'pending_parent' | 'submitted_complete' | 'submitted_incomplete' | 'archived'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'In Progress' },
  { value: 'pending_parent', label: 'Pending Parent Approval' },
  { value: 'submitted_complete', label: 'Ready to Import' },
  { value: 'submitted_incomplete', label: 'Incomplete' },
  { value: 'archived', label: 'Archived' },
]

function splitName(app: Application): { first: string; last: string } {
  const data = app.data || {}
  const first = String(data.legal_first || '').trim()
  const last = String(data.legal_last || '').trim()
  if (first || last) return { first: first || '—', last: last || '—' }
  const parts = (app.talent_name || '').trim().split(/\s+/).filter(Boolean)
  return { first: parts[0] || '—', last: parts.slice(1).join(' ') || '—' }
}

function isPendingParent(app: Application): boolean {
  return app.status === 'pending_guardian' || app.guardian_status === 'pending'
}

function isReadyToImport(app: Application): boolean {
  return isApplicationReadyToImport(app)
}

function matchesFilter(app: Application, filter: StatusFilter): boolean {
  if (filter === 'archived') return app.status === 'archived'
  if (app.status === 'archived') return false
  if (filter === 'pending') return app.status === 'sent' || app.status === 'in_progress'
  if (filter === 'pending_parent') return isPendingParent(app)
  if (filter === 'submitted_complete') return isReadyToImport(app)
  if (filter === 'submitted_incomplete') return app.status === 'submitted' && !isAppComplete(app)
  return true
}

function statusMeta(app: Application): { label: string; color: string } {
  if (app.status === 'archived') return { label: 'Archived', color: '#6b7280' }
  if (isPendingParent(app)) return { label: 'Pending Parent Approval', color: T.amber }
  if (app.status === 'sent') return { label: 'Sent', color: T.amber }
  if (app.status === 'in_progress') return { label: 'In Progress', color: T.blue }
  if (app.status === 'submitted') {
    return isAppComplete(app)
      ? { label: 'Complete', color: T.green }
      : { label: 'Incomplete', color: T.red }
  }
  return { label: 'Draft', color: T.t3 }
}

function appProgress(app: Application): { pct: number; missing: number; complete: boolean } {
  const data = app.data || {}
  const visible = getVisibleSections(data)
  const complete = isAppComplete(app)
  const missing = visible.reduce((sum, section) => sum + validateSection(section.id, data).length, 0)
  const done = visible.filter(
    (section) =>
      (app.completed_sections || []).includes(section.id) &&
      validateSection(section.id, data).length === 0,
  ).length
  return { pct: Math.round((done / Math.max(visible.length, 1)) * 100), missing, complete }
}

function ProgressCell({ pct, complete }: { pct: number; complete: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 88 }}>
      <div style={{ width: 64, height: 6, background: T.mutedBg, borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: complete ? T.green : T.blue,
            borderRadius: 99,
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: T.t3, fontWeight: 600 }}>{pct}%</span>
    </div>
  )
}

export function ApplicationsModule() {
  const { applications, talents, importAppToPipeline, archiveApplications, restoreApplications } = useAppData()
  const { prospects } = useAgencyData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const canArchive = Boolean(user && hasPermission(user.role, 'admin_access'))

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importingId, setImportingId] = useState<string | null>(null)
  const [bulkImporting, setBulkImporting] = useState(false)
  const [pending, setPending] = useState<{ mode: 'archive' | 'restore'; ids: string[] } | null>(null)

  const apps = useMemo(
    () =>
      Object.values(applications).sort((a, b) => {
        const aTs = Date.parse(a.last_saved || a.created_at || '') || 0
        const bTs = Date.parse(b.last_saved || b.created_at || '') || 0
        return bTs - aTs
      }),
    [applications],
  )

  const filtered = useMemo(
    () => apps.filter((app) => matchesFilter(app, statusFilter)),
    [apps, statusFilter],
  )

  function accountFor(app: Application): string | undefined {
    const talent = talents.find((t) => t.id === app.talent_id || t.application_id === app.id)
    if (talent?.account_number) return talent.account_number
    const email = (app.talent_email || '').toLowerCase()
    const prospect = prospects.find(
      (p) => p.linkedApplicationId === app.id || (email && p.email?.toLowerCase() === email),
    )
    return prospect?.accountId
  }

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
      if (checked) filtered.forEach((app) => next.add(app.id))
      else filtered.forEach((app) => next.delete(app.id))
      return next
    })
  }

  const allSelected = filtered.length > 0 && filtered.every((app) => selected.has(app.id))
  const someSelected = filtered.some((app) => selected.has(app.id))
  const selectedList = useMemo(() => apps.filter((app) => selected.has(app.id)), [apps, selected])
  const readySelected = selectedList.filter(isReadyToImport)

  const archiveAction = statusFilter === 'archived' ? 'Restore Selected' : 'Archive Selected'
  const bulkGroups = stubGroups(
    [
      { label: 'Review', actions: ['Review Selected'] },
      { label: 'Pipeline', actions: ['Import to Pipeline'] },
      { label: 'Communication', actions: ['Send Email'] },
      ...(canArchive ? [{ label: 'Status', actions: [archiveAction] }] : []),
    ],
    {
      'Review Selected': {
        id: 'Review Selected',
        label: 'Review Selected',
        onClick: () => {
          const first = selectedList[0]
          if (first) navigate(`/applications/${first.id}`)
        },
      },
      'Import to Pipeline': {
        id: 'Import to Pipeline',
        label: bulkImporting
          ? 'Reviewing…'
          : readySelected.length
            ? `Review application (${readySelected.length})`
            : 'Review application',
        disabled: readySelected.length === 0 || bulkImporting,
        onClick: async () => {
          if (bulkImporting) return
          setBulkImporting(true)
          let last = null
          try {
            for (const app of readySelected) {
              last = await importAppToPipeline(app)
            }
            setSelected(new Set())
            if (last?.account_number) navigate(talentAccountPath(last.account_number))
            else if (last) navigate('/pipeline')
          } finally {
            setBulkImporting(false)
          }
        },
      },
      'Send Email': {
        id: 'Send Email',
        label: 'Send Email',
        onClick: () => navigate('/send-email'),
      },
      'Archive Selected': {
        id: 'Archive Selected',
        label: 'Archive Selected',
        danger: true,
        disabled: selectedList.every((app) => app.status === 'archived'),
        onClick: () =>
          setPending({
            mode: 'archive',
            ids: selectedList.filter((app) => app.status !== 'archived').map((app) => app.id),
          }),
      },
      'Restore Selected': {
        id: 'Restore Selected',
        label: 'Restore Selected',
        disabled: selectedList.every((app) => app.status !== 'archived'),
        onClick: () =>
          setPending({
            mode: 'restore',
            ids: selectedList.filter((app) => app.status === 'archived').map((app) => app.id),
          }),
      },
    },
  )

  function rowActions(app: Application): ActionItem[] {
    const items: ActionItem[] = [
      {
        id: 'review',
        label: 'Review',
        onClick: () => navigate(`/applications/${app.id}`),
      },
      {
        id: 'import',
        label: importingId === app.id ? 'Reviewing…' : 'Review application',
        disabled: !isReadyToImport(app) || Boolean(importingId),
        onClick: async () => {
          if (importingId) return
          setImportingId(app.id)
          try {
            const imported = await importAppToPipeline(app)
            if (imported?.account_number) navigate(talentAccountPath(imported.account_number))
            else if (imported) navigate('/pipeline')
          } finally {
            setImportingId(null)
          }
        },
      },
      {
        id: 'email',
        label: 'Send Email',
        onClick: () => navigate('/send-email'),
      },
      {
        id: 'tracking',
        label: 'Open on Tracking Board',
        onClick: () => navigate('/prospect-tracking'),
      },
    ]
    if (canArchive) {
      items.push(
        app.status === 'archived'
          ? {
              id: 'restore',
              label: 'Restore application',
              onClick: () => setPending({ mode: 'restore', ids: [app.id] }),
            }
          : {
              id: 'archive',
              label: 'Archive application',
              danger: true,
              onClick: () => setPending({ mode: 'archive', ids: [app.id] }),
            },
      )
    }
    return items
  }

  const pendingCount = pending?.ids.length ?? 0
  const pendingNoun = pendingCount === 1 ? 'application' : 'applications'

  return (
    <Panel
      title="Applications"
      subtitle="Pipeline-linked applications. Create and manage people on Prospects — new invites sync there automatically."
      actions={
        <>
          <BulkActionsMenu groups={bulkGroups} disabled={selected.size === 0} />
          <Btn variant="secondary" onClick={() => navigate('/prospects')}>
            Prospects
          </Btn>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          aria-label="Filter applications"
          style={{ ...inputStyle, width: 'auto', minWidth: 220 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
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
            const app = filtered[i]
            if (app) navigate(`/applications/${app.id}`)
          }}
          rowSelected={filtered.map((app) => selected.has(app.id))}
          headers={[
            '',
            'First name',
            'Last name',
            'Property',
            'City',
            'State',
            'Account #',
            'Status',
            'Progress',
            'Access code',
            'Missing',
            'Last activity',
            '',
          ]}
          rows={filtered.map((app) => {
            const { first, last } = splitName(app)
            const progress = appProgress(app)
            const status = statusMeta(app)
            const accountId = accountFor(app)
            const data = app.data || {}
            return [
              <input
                key={`c-${app.id}`}
                type="checkbox"
                checked={selected.has(app.id)}
                aria-label={`Select ${app.talent_name}`}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggle(app.id)}
              />,
              first,
              last,
              AGENCY_PROPERTY,
              String(data.city || '—'),
              String(data.state || '—'),
              <span key={`a-${app.id}`} style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 650 }}>
                {formatAccountDisplay(accountId)}
              </span>,
              <Badge key={`st-${app.id}`} color={status.color}>
                {status.label}
              </Badge>,
              <ProgressCell key={`p-${app.id}`} pct={progress.pct} complete={progress.complete} />,
              <span
                key={`code-${app.id}`}
                style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '0.04em' }}
              >
                {app.access_code}
              </span>,
              progress.missing > 0 ? (
                <span key={`m-${app.id}`} style={{ color: T.red, fontWeight: 600, fontSize: 11 }}>
                  {progress.missing} fields
                </span>
              ) : (
                <span key={`m-${app.id}`} style={{ color: T.green, fontWeight: 600, fontSize: 11 }}>
                  None
                </span>
              ),
              app.last_saved || app.created_at
                ? new Date(app.last_saved || app.created_at).toLocaleDateString()
                : '—',
              <RowActionsMenu
                key={`menu-${app.id}`}
                items={rowActions(app)}
              />,
            ]
          })}
        />
      </div>
      <ConfirmDialog
        open={!!pending}
        title={pending?.mode === 'restore' ? 'Restore application?' : 'Archive application?'}
        message={
          pending?.mode === 'restore'
            ? `Restore ${pendingCount} ${pendingNoun} to the status they had before archive? They return to the active list.`
            : `Archive ${pendingCount} ${pendingNoun}? They leave the active list, and the applicant can no longer edit them. You can restore them from the Archived filter. The talent record stays in its current pipeline stage.`
        }
        confirmLabel={pending?.mode === 'restore' ? 'Restore' : 'Archive'}
        danger={pending?.mode === 'archive'}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return
          const action = pending.mode === 'restore' ? restoreApplications : archiveApplications
          const ids = pending.ids
          setPending(null)
          void action(ids)
            .then(() => setSelected(new Set()))
            .catch(() => {})
        }}
      />
    </Panel>
  )
}
