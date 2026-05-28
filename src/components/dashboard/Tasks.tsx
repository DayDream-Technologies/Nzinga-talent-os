// @ts-nocheck
import { useState } from 'react'
import { USERS } from '@/constants'
import {
  T,
  Av,
  Btn,
  Lbl,
  FInput,
  FSelect,
  TH,
  TD,
  PriBadge,
} from '@/components/ui-compat'

function Tasks({ tasks, setTasks, talents, currentUser }) {
  const [filter, setFilter] = useState('mine')
  const [showAdd, setShowAdd] = useState(false)
  const [nt, setNt] = useState({
    title: '',
    assigned_to: currentUser.id,
    related_talent: '',
    due: '',
    priority: 'medium',
    notes: '',
  })
  const np = (k, v) => setNt((p) => ({ ...p, [k]: v }))
  const filt = tasks.filter((t) => {
    if (filter === 'mine') return t.assigned_to === currentUser.id && t.status === 'open'
    if (filter === 'all') return t.status === 'open'
    if (filter === 'done') return t.status === 'completed'
    return true
  })
  function add() {
    if (!nt.title) return
    setTasks((p) => [
      ...p,
      {
        ...nt,
        id: 'tk' + Date.now(),
        status: 'open',
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
      },
    ])
    setNt({
      title: '',
      assigned_to: currentUser.id,
      related_talent: '',
      due: '',
      priority: 'medium',
      notes: '',
    })
    setShowAdd(false)
  }
  function done(id) {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status: 'completed' } : t)))
  }
  return (
    <div style={{ padding: '14px 18px', flex: 1, overflowY: 'auto' }}>
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            ['mine', 'My Tasks'],
            ['all', 'All Open'],
            ['done', 'Done'],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{
                background: filter === v ? '#fff' : 'transparent',
                border: `1px solid ${filter === v ? '#d1d5db' : 'transparent'}`,
                borderRadius: 5,
                padding: '4px 10px',
                fontSize: 12,
                color: filter === v ? T.blue : T.t3,
                cursor: 'pointer',
                fontWeight: filter === v ? 600 : 400,
                fontFamily: 'inherit',
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <Btn variant="primary" sm onClick={() => setShowAdd((s) => !s)}>
          + New Task
        </Btn>
      </div>
      {showAdd && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ gridColumn: '1/-1' }}>
              <Lbl>Title</Lbl>
              <FInput value={nt.title} onChange={(v) => np('title', v)} placeholder="Task description?" />
            </div>
            <div>
              <Lbl>Assigned To</Lbl>
              <FSelect
                value={nt.assigned_to}
                onChange={(v) => np('assigned_to', v)}
                options={USERS.map((u) => ({ v: u.id, l: u.name }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Lbl>Talent</Lbl>
              <FSelect
                value={nt.related_talent}
                onChange={(v) => np('related_talent', v)}
                options={[{ v: '', l: 'None' }, ...talents.map((t) => ({ v: t.id, l: t.name }))]}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Lbl>Due</Lbl>
              <FInput value={nt.due} onChange={(v) => np('due', v)} type="date" />
            </div>
            <div>
              <Lbl>Priority</Lbl>
              <FSelect
                value={nt.priority}
                onChange={(v) => np('priority', v)}
                options={['urgent', 'high', 'medium', 'low']}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="primary" sm onClick={add}>
              Create
            </Btn>
            <Btn sm onClick={() => setShowAdd(false)}>
              Cancel
            </Btn>
          </div>
        </div>
      )}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: '#fff',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <thead>
          <tr>
            <TH>Task</TH>
            <TH>Priority</TH>
            <TH>Assigned</TH>
            <TH>Talent</TH>
            <TH>Due</TH>
            <TH>Action</TH>
          </tr>
        </thead>
        <tbody>
          {filt.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 14, color: T.t4, textAlign: 'center', fontSize: 12 }}>
                No tasks.
              </td>
            </tr>
          )}
          {filt.map((tk) => {
            const asn = USERS.find((u) => u.id === tk.assigned_to)
            const rel = talents.find((t) => t.id === tk.related_talent)
            const od = tk.due && new Date(tk.due) < new Date() && tk.status === 'open'
            return (
              <tr key={tk.id} style={{ opacity: tk.status === 'completed' ? 0.5 : 1 }}>
                <TD>
                  <span
                    style={{
                      textDecoration: tk.status === 'completed' ? 'line-through' : 'none',
                      fontWeight: 500,
                    }}
                  >
                    {tk.title}
                  </span>
                </TD>
                <TD>
                  <PriBadge p={tk.priority} />
                </TD>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Av user={asn} size={18} />
                    <span style={{ fontSize: 11 }}>{asn?.name}</span>
                  </div>
                </TD>
                <TD muted>{rel ? <span style={{ color: T.blue }}>{rel.name}</span> : '?'}</TD>
                <TD muted style={{ color: od ? T.red : undefined }}>
                  {tk.due || '?'}
                  {od && (
                    <span style={{ fontSize: 10, marginLeft: 3, color: T.red, fontWeight: 700 }}>
                      OVERDUE
                    </span>
                  )}
                </TD>
                <TD>
                  {tk.status === 'open' && (
                    <Btn sm variant="success" onClick={() => done(tk.id)}>
                      ? Done
                    </Btn>
                  )}
                </TD>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export { Tasks }
