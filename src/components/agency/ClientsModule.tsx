import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { BulkActionsMenu, RowActionsMenu, stubGroups } from '@/components/agency/RowActionsMenu'
import { Badge, Btn, Field, ModalShell, Panel, Table, inputStyle } from '@/components/agency/AgencyUI'
import { AGENCY_PROPERTY, formatAccountDisplay } from '@/lib/session-storage'
import { T } from '@/lib/tokens'
import type { AgencyTalent, ClientLifecycleStatus } from '@/types/agency'

function normalizeStatus(s: string | undefined): ClientLifecycleStatus {
  if (s === 'future' || s === 'past' || s === 'current') return s
  if (s === 'offboarding') return 'past'
  if (s === 'prospect') return 'future'
  return 'current'
}

function AddClientModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (input: {
    firstName: string
    lastName: string
    email: string
    phone: string
    division: string
    status: ClientLifecycleStatus
    contractStart: string
    contractEnd: string
  }) => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [division, setDivision] = useState('Modeling')
  const [status, setStatus] = useState<ClientLifecycleStatus>('current')
  const [contractStart, setContractStart] = useState('')
  const [contractEnd, setContractEnd] = useState('')
  const [error, setError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.')
      return
    }
    onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      division,
      status,
      contractStart,
      contractEnd,
    })
  }

  return (
    <ModalShell title="Add Client" onClose={onClose} width={440}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="First name">
            <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <Field label="Email">
          <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Unit / Division">
          <input style={inputStyle} value={division} onChange={(e) => setDivision(e.target.value)} />
        </Field>
        <Field label="Status">
          <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as ClientLifecycleStatus)}>
            <option value="current">Current</option>
            <option value="future">Future</option>
            <option value="past">Past</option>
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Contract start">
            <input type="date" style={inputStyle} value={contractStart} onChange={(e) => setContractStart(e.target.value)} />
          </Field>
          <Field label="Contract end">
            <input type="date" style={inputStyle} value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} />
          </Field>
        </div>
        {error && <div style={{ color: T.red, fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit">Add client</Btn>
        </div>
      </form>
    </ModalShell>
  )
}

export function ClientsModule() {
  const { talent, createClient, prospects, sendMessage } = useAgencyData()
  const { setHistory } = useAppData()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<ClientLifecycleStatus>('current')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [noteTarget, setNoteTarget] = useState<AgencyTalent | null>(null)
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<'note' | 'call'>('note')

  const rows = useMemo(
    () => talent.filter((t) => normalizeStatus(String(t.status)) === statusFilter),
    [talent, statusFilter],
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addHistoryNote(t: AgencyTalent, text: string, type: 'note' | 'call') {
    setHistory((prev) => [
      {
        id: `h_${Date.now()}`,
        talent_id: t.id,
        user_id: null,
        type,
        text: `${type === 'call' ? 'Call' : 'Note'}: ${text}`,
        ts: new Date().toISOString(),
        flagged: false,
        is_document: false,
      },
      ...prev,
    ])
  }

  const bulkGroups = stubGroups(
    [
      {
        label: 'History / Note',
        actions: ['Add to History'],
      },
      {
        label: 'Service Manager',
        actions: ['Assign Service Manager', 'Schedule Visit'],
      },
      {
        label: 'Financial',
        actions: ['Add Charge', 'Create Invoice'],
      },
      {
        label: 'Communication',
        actions: ['Send Email', 'Phone Broadcast'],
      },
      {
        label: 'Reports',
        actions: ['Report Writer', 'Export Selected'],
      },
    ],
    {
      'Add to History': {
        id: 'Add to History',
        label: 'Add to History',
        onClick: () => {
          const first = rows.find((r) => selected.has(r.id))
          if (first) {
            setNoteTarget(first)
            setNoteType('note')
            setNoteText(`Bulk note for ${selected.size} client(s)`)
          }
        },
      },
      'Send Email': {
        id: 'Send Email',
        label: 'Send Email',
        onClick: () => navigate('/send-email'),
      },
    },
  )

  return (
    <Panel
      title="Clients"
      subtitle="Signed representation clients. Filter by current, future, or past status."
      actions={
        <>
          <BulkActionsMenu groups={bulkGroups} disabled={selected.size === 0} />
          <Btn onClick={() => setShowAdd(true)}>+ Add Client</Btn>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['current', 'future', 'past'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 12px',
              borderRadius: 7,
              border: `1px solid ${statusFilter === s ? T.blue : '#e5e7eb'}`,
              background: statusFilter === s ? '#eff6ff' : '#fff',
              color: statusFilter === s ? T.blue : T.t2,
              fontWeight: statusFilter === s ? 700 : 500,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'auto' }}>
        <Table
          headers={[
            '',
            'First name',
            'Last name',
            'Account #',
            'Property',
            'Unit / Division',
            'Contract start',
            'Contract end',
            'Email',
            'Phone',
            'Status',
            '',
          ]}
          rows={rows.map((t) => {
            const linked = prospects.find((p) => p.id === t.linkedProspectId || p.accountId === t.accountId)
            return [
              <input
                key={`c-${t.id}`}
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => toggle(t.id)}
              />,
              t.firstName || t.name.split(' ')[0] || '—',
              t.lastName || t.name.split(' ').slice(1).join(' ') || '—',
              <span key={`a-${t.id}`} style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 650 }}>
                {formatAccountDisplay(t.accountId)}
              </span>,
              t.property || AGENCY_PROPERTY,
              t.division || t.workArea || '—',
              t.contractStart || '—',
              t.contractEnd || '—',
              t.email || '—',
              t.phone || '—',
              <Badge key={`s-${t.id}`} color={normalizeStatus(String(t.status)) === 'current' ? T.green : T.amber}>
                {normalizeStatus(String(t.status))}
              </Badge>,
              <RowActionsMenu
                key={`m-${t.id}`}
                items={[
                  {
                    id: 'email',
                    label: 'Send Email',
                    onClick: () => {
                      if (t.email) {
                        sendMessage({ channel: 'email', to: t.email, subject: `Message for ${t.name}`, preview: '' })
                        navigate('/send-email')
                      } else navigate('/send-email')
                    },
                  },
                  {
                    id: 'prospect',
                    label: 'Jump to Prospect',
                    disabled: !linked,
                    onClick: () => navigate('/prospects'),
                  },
                  {
                    id: 'note',
                    label: 'Add Note',
                    onClick: () => {
                      setNoteTarget(t)
                      setNoteType('note')
                      setNoteText('')
                    },
                  },
                  {
                    id: 'call',
                    label: 'Add Call',
                    onClick: () => {
                      setNoteTarget(t)
                      setNoteType('call')
                      setNoteText('')
                    },
                  },
                  {
                    id: 'invoices',
                    label: 'Show All Invoices',
                    onClick: () => navigate('/client-invoices'),
                  },
                  {
                    id: 'renewal',
                    label: 'Create Renewal Offer',
                    onClick: () => navigate('/renewal-offers'),
                  },
                  {
                    id: 'app',
                    label: 'Send Application',
                    stub: true,
                  },
                  { id: 'docs', label: 'Publish Signable Documents', stub: true },
                  { id: 'screening', label: 'Add Screening', stub: true },
                ]}
              />,
            ]
          })}
        />
      </div>
      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onCreate={(input) => {
            createClient(input)
            setShowAdd(false)
          }}
        />
      )}
      {noteTarget && (
        <ModalShell title={noteType === 'call' ? 'Add Call' : 'Add Note'} onClose={() => setNoteTarget(null)} width={400}>
          <Field label={`${noteTarget.name}`}>
            <textarea
              style={{ ...inputStyle, minHeight: 100 }}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              autoFocus
            />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Btn variant="secondary" onClick={() => setNoteTarget(null)}>
              Cancel
            </Btn>
            <Btn
              onClick={() => {
                if (!noteText.trim()) return
                addHistoryNote(noteTarget, noteText.trim(), noteType)
                setNoteTarget(null)
              }}
            >
              Save
            </Btn>
          </div>
        </ModalShell>
      )}
    </Panel>
  )
}
