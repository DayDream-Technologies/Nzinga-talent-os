import { useState } from 'react'
import { Btn, Field, ModalShell, inputStyle } from '@/components/agency/AgencyUI'
import { HISTORY_CATEGORIES, type HistoryCategory, type HistoryType } from '@/types/history'
import { T } from '@/lib/tokens'

export function AddNoteModal({
  onClose,
  onSave,
  defaultCategory = 'general',
  personName,
}: {
  onClose: () => void
  onSave: (input: { text: string; category: HistoryCategory; type: HistoryType }) => void
  defaultCategory?: HistoryCategory
  personName?: string
}) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<HistoryCategory>(defaultCategory)
  const [type, setType] = useState<HistoryType>('note')
  const missing = !text.trim() ? ['Note text'] : []

  return (
    <ModalShell title={personName ? `Add note · ${personName}` : 'Add History / Note'} onClose={onClose} width={520}>
      <Field label="Type">
        <select value={type} onChange={(e) => setType(e.target.value as HistoryType)} style={inputStyle}>
          <option value="note">Note</option>
          <option value="call">Phone call</option>
          <option value="meeting">Meeting</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="opportunity">Opportunity</option>
        </select>
      </Field>
      <Field label="Category">
        <select value={category} onChange={(e) => setCategory(e.target.value as HistoryCategory)} style={inputStyle}>
          {HISTORY_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>
          {HISTORY_CATEGORIES.find((c) => c.id === category)?.hint}
        </div>
      </Field>
      <Field label="Note">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Document the conversation, decision, or follow-up."
          style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
        />
      </Field>
      {missing.length > 0 && (
        <div style={{ fontSize: 12, color: T.amber, marginBottom: 10 }}>Required: {missing.join(', ')}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          disabled={missing.length > 0}
          onClick={() => {
            onSave({ text: text.trim(), category, type })
            onClose()
          }}
        >
          Save note
        </Btn>
      </div>
    </ModalShell>
  )
}
