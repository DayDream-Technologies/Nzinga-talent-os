import { useMemo, useState } from 'react'
import { Badge, Btn, ModalShell, Table } from '@/components/agency/AgencyUI'
import { T } from '@/lib/tokens'
import { historyCategoryLabel } from '@/lib/history-ledger'
import type { HistoryEntry } from '@/types/history'

export function HistoryLedger({
  entries,
  limit,
  onViewAll,
}: {
  entries: HistoryEntry[]
  limit?: number
  onViewAll?: () => void
}) {
  const [open, setOpen] = useState<HistoryEntry | null>(null)
  const rows = useMemo(() => {
    const sorted = [...entries].sort((a, b) => (a.ts < b.ts ? 1 : -1))
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
  }, [entries, limit])

  return (
    <>
      <Table
        headers={['Type', 'Date', 'Note', 'Category', 'User']}
        onRowClick={(i) => setOpen(rows[i] || null)}
        rows={rows.map((h) => [
          h.type,
          new Date(h.ts).toLocaleString(),
          <span key={`${h.id}-text`} style={{ display: 'block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {h.email_subject || h.text}
          </span>,
          <Badge key={`${h.id}-cat`} color={T.t3}>
            {historyCategoryLabel(h)}
          </Badge>,
          h.staff_name || 'System',
        ])}
      />
      {rows.length === 0 && <div style={{ padding: 16, color: T.t3, fontSize: 13 }}>No history yet.</div>}
      {onViewAll && typeof limit === 'number' && entries.length > limit && (
        <div style={{ marginTop: 8 }}>
          <Btn variant="ghost" onClick={onViewAll}>
            View all
          </Btn>
        </div>
      )}
      {open && (
        <ModalShell title={`${open.type} · ${historyCategoryLabel(open)}`} onClose={() => setOpen(null)} width={560}>
          <div style={{ fontSize: 12, color: T.t3, marginBottom: 8 }}>
            {new Date(open.ts).toLocaleString()} · {open.staff_name || 'System'}
          </div>
          {(open.type === 'email' || open.type === 'sms') && (
            <div style={{ fontSize: 13, marginBottom: 10, display: 'grid', gap: 4 }}>
              {open.email_to && <div>To: {open.email_to}</div>}
              <div>Sent: {new Date(open.ts).toLocaleString()}</div>
              <div>From: {open.staff_name || 'System'}</div>
            </div>
          )}
          {open.email_subject && <div style={{ fontWeight: 700, marginBottom: 8 }}>{open.email_subject}</div>}
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: T.t1 }}>{open.text}</div>
          {open.doc_name && (
            <div style={{ marginTop: 12, fontSize: 12, color: T.t3 }}>
              Attachment: {open.doc_name}
              {open.doc_type ? ` (${open.doc_type})` : ''}
            </div>
          )}
        </ModalShell>
      )}
    </>
  )
}
