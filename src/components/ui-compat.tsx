/** Compatibility layer — legacy form API (onChange receives value, not event) */
import type { CSSProperties, ChangeEvent, ReactNode } from 'react'
import { T } from '@/lib/tokens'
import {
  Button as Btn,
  Input,
  Textarea,
  Select,
  Label,
  Avatar as Av,
  StageBadge,
  NichePill,
  ScoreBar,
  Toggle,
  Section,
  TH,
  TD,
  PriorityBadge as PriBadge,
  HistoryIcon as HIcon,
  FileUpload,
  DocViewer,
} from '@/components/ui'
export { T }
export {
  Btn,
  Av,
  StageBadge,
  NichePill,
  ScoreBar,
  Toggle,
  Section,
  TH,
  TD,
  PriBadge,
  HIcon,
  FileUpload,
  DocViewer,
}
export { IncompleteSectionAlert } from '@/components/application/IncompleteSectionAlert'

export function Lbl({
  children,
  required,
  style,
}: {
  children: ReactNode
  required?: boolean
  style?: CSSProperties
}) {
  return (
    <div style={{ fontSize: 11, color: T.t3, fontWeight: 500, marginBottom: 3, ...style }}>
      {children}
      {required && <span style={{ color: T.red, marginLeft: 2 }}>*</span>}
    </div>
  )
}

export function FInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  style,
  readOnly,
  error,
}: {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  type?: string
  style?: CSSProperties
  readOnly?: boolean
  error?: boolean
}) {
  return (
    <Input
      type={type}
      value={value ?? ''}
      readOnly={readOnly}
      error={error}
      placeholder={placeholder}
      style={style}
      onChange={onChange ? (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value) : undefined}
    />
  )
}

export function FTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  readOnly,
  error,
  style,
}: {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  rows?: number
  readOnly?: boolean
  error?: boolean
  style?: CSSProperties
}) {
  return (
    <Textarea
      rows={rows}
      value={value ?? ''}
      readOnly={readOnly}
      error={error}
      placeholder={placeholder}
      style={style}
      onChange={onChange ? (e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value) : undefined}
    />
  )
}

export function FSelect({
  value,
  onChange,
  options,
  labels,
  style,
  disabled,
  error,
}: {
  value?: string
  onChange?: (value: string) => void
  options: (string | { v: string; l: string })[]
  labels?: string[]
  style?: CSSProperties
  disabled?: boolean
  error?: boolean
}) {
  const resolvedOptions = labels
    ? options.map((o, i) => {
        const v = typeof o === 'string' ? o : o.v
        return { v, l: labels[i] ?? (typeof o === 'string' ? o : o.l) }
      })
    : options

  return (
    <Select
      value={value ?? ''}
      disabled={disabled}
      error={error}
      options={resolvedOptions}
      style={style}
      onChange={onChange ? (e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value) : undefined}
    />
  )
}
