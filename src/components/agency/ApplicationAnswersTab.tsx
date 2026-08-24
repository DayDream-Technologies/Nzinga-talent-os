import { useMemo, useState } from 'react'
import { Btn, Card } from '@/components/agency/AgencyUI'
import { DocViewer } from '@/components/ui/DocViewer'
import {
  getVisibleSections,
  isAppComplete,
  isFieldVisible,
  validateSection,
} from '@/constants/app-sections'
import { T } from '@/lib/tokens'
import type { AppField, Application, ApplicationData } from '@/types/application'
import type { UploadedDoc } from '@/types/talent'

function asText(data: ApplicationData, id: string): string {
  const value = data[id]
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return String(value ?? '').trim()
}

export function fileFromApplication(data: ApplicationData, fieldId: string, fallbackName: string): UploadedDoc | null {
  const raw = data[fieldId]
  if (!raw || typeof raw === 'boolean') return null
  const value = String(raw)
  if (!value) return null
  return {
    name: String(data[`${fieldId}_name`] || fallbackName),
    data: value,
    type: String(data[`${fieldId}_type`] || 'application/octet-stream'),
    doc_type: fieldId.replace(/^doc_/, ''),
    uploaded_at: new Date().toISOString(),
    uploaded_by: 'applicant',
    status: 'received',
  }
}

function FieldAnswer({
  field,
  data,
  onView,
}: {
  field: AppField
  data: ApplicationData
  onView: (doc: UploadedDoc) => void
}) {
  if (field.type === 'file_upload') {
    const doc = fileFromApplication(data, field.id, field.label)
    const filename = String(data[`${field.id}_name`] || doc?.name || '')
    if (!doc && !filename) {
      return <span style={{ color: T.t3 }}>—</span>
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span>{filename || doc?.name}</span>
        {doc && (
          <Btn variant="ghost" onClick={() => onView(doc)}>
            View
          </Btn>
        )}
      </span>
    )
  }
  if (field.type === 'checkbox') {
    const value = data[field.id]
    if (value === true) return <span>Yes</span>
    if (value === false) return <span>No</span>
    return <span style={{ color: T.t3 }}>—</span>
  }
  const text = asText(data, field.id)
  if (!text) return <span style={{ color: T.t3 }}>—</span>
  if (field.type === 'multicheck') {
    return (
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
        {text.split(',').map((part) => (
          <span
            key={part}
            style={{
              background: '#eff6ff',
              color: T.blue,
              borderRadius: 999,
              padding: '1px 8px',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {part.trim()}
          </span>
        ))}
      </span>
    )
  }
  if (field.type === 'textarea') {
    return <span style={{ whiteSpace: 'pre-wrap', textAlign: 'right' }}>{text}</span>
  }
  return <span>{text}</span>
}

export function ApplicationAnswersTab({ application }: { application: Application }) {
  const data = application.data || {}
  const sections = useMemo(() => getVisibleSections(data), [data])
  const [doc, setDoc] = useState<UploadedDoc | null>(null)
  const complete = isAppComplete(application)
  const missing = sections.flatMap((section) =>
    validateSection(section.id, data).map((id) => {
      const field = section.fields.find((item) => item.id === id)
      return field?.label || id
    }),
  )

  return (
    <div>
      <div
        style={{
          marginBottom: 12,
          padding: '10px 12px',
          borderRadius: 8,
          background: complete ? '#f0fdf4' : '#fff7ed',
          border: `1px solid ${complete ? '#bbf7d0' : '#fed7aa'}`,
          fontSize: 13,
        }}
      >
        {complete
          ? 'All visible required fields are complete.'
          : `Missing ${missing.length} required field${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''}`}
      </div>
      {sections.map((section) => {
        const visibleFields = section.fields.filter((field) => isFieldVisible(field, data))
        if (visibleFields.length === 0) return null
        return (
          <Card key={section.id} hover={false} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{section.label}</div>
            {visibleFields.map((field) => (
              <div
                key={field.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '7px 0',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: 13,
                }}
              >
                <span style={{ color: T.t3, minWidth: 140 }}>{field.label}</span>
                <span style={{ color: T.t1, fontWeight: 500, textAlign: 'right', flex: 1 }}>
                  <FieldAnswer field={field} data={data} onView={setDoc} />
                </span>
              </div>
            ))}
          </Card>
        )
      })}
      <DocViewer doc={doc} onClose={() => setDoc(null)} />
    </div>
  )
}
