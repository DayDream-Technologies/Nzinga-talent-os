import { useState } from 'react'
import { Btn, Card, Field, ModalShell, Panel, Table, inputStyle } from '@/components/agency/AgencyUI'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { createHistoryEntry } from '@/lib/history-ledger'
import { T } from '@/lib/tokens'
import { AUTO_STACK_GRID } from '@/lib/viewport'
import { USERS } from '@/constants/seed-data'

export function AddTaskModal({
  onClose,
  defaultRelated,
}: {
  onClose: () => void
  defaultRelated?: string
}) {
  const { addTask, talent } = useAgencyData()
  const { setHistory } = useAppData()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Default')
  const [assignees, setAssignees] = useState(user?.name || '')
  const [due, setDue] = useState('')
  const [related, setRelated] = useState(defaultRelated || talent[0]?.name || '')
  const [recurring, setRecurring] = useState('')
  const missing = !title.trim() ? ['Subject'] : []

  return (
    <ModalShell title="Add Task" onClose={onClose} width={680}>
      <div style={{ display: 'grid', gridTemplateColumns: AUTO_STACK_GRID, gap: 12 }}>
        <div>
          <Field label="Subject">
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={inputStyle} />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {['Default', 'Urgent', 'Audition Prep', 'Contract Follow-up', 'Onboarding'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <div>
          <Field label="Assigned users">
            <input value={assignees} onChange={(e) => setAssignees(e.target.value)} style={inputStyle} />
            <div style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>
              {USERS.map((u) => u.name).join(', ')}
            </div>
          </Field>
          <Field label="Due date">
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Related talent">
            <input value={related} onChange={(e) => setRelated(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Recurring">
            <select value={recurring} onChange={(e) => setRecurring(e.target.value)} style={inputStyle}>
              <option value="">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
        </div>
      </div>
      {missing.length > 0 && <div style={{ color: T.amber, fontSize: 12 }}>Required: {missing.join(', ')}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          disabled={missing.length > 0}
          onClick={() => {
            addTask({
              title: title.trim(),
              assignee: assignees.split(',')[0]?.trim() || user?.name || 'Staff',
              assignees: assignees.split(',').map((s) => s.trim()).filter(Boolean),
              due: due || new Date().toISOString().slice(0, 10),
              status: 'open',
              relatedClient: related,
              description,
              category,
              recurring,
            })
            setHistory((prev) => [
              createHistoryEntry({
                type: 'task',
                text: `Task created: ${title.trim()}`,
                category: 'internal',
                staffName: user?.name,
                userId: user?.id,
              }),
              ...prev,
            ])
            onClose()
          }}
        >
          Create task
        </Btn>
      </div>
    </ModalShell>
  )
}

export function AgencyTasksBoard() {
  const { tasks, completeTask } = useAgencyData()
  const { user } = useAuth()
  const { setHistory } = useAppData()
  const [open, setOpen] = useState(false)
  return (
    <Panel title="Agency Tasks" subtitle="Assignments, follow-ups, and audition prep." actions={<Btn onClick={() => setOpen(true)}>+ Add Task</Btn>}>
      <Card>
        <Table
          headers={['Task', 'Assignee', 'Due', 'Category', 'Status', '']}
          rows={tasks.map((t) => [
            t.title,
            (t.assignees || [t.assignee]).join(', '),
            t.due,
            t.category || 'Default',
            t.status,
            t.status === 'open' ? (
              <Btn
                key={t.id}
                variant="success"
                onClick={() => {
                  completeTask(t.id, user?.name || 'Staff')
                  setHistory((prev) => [
                    createHistoryEntry({
                      type: 'task',
                      text: `Task completed: ${t.title}`,
                      category: 'internal',
                      staffName: user?.name,
                      userId: user?.id,
                    }),
                    ...prev,
                  ])
                }}
              >
                Complete
              </Btn>
            ) : (
              t.completedBy || 'Done'
            ),
          ])}
        />
      </Card>
      {open && <AddTaskModal onClose={() => setOpen(false)} />}
    </Panel>
  )
}
