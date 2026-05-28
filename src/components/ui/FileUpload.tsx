import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  fieldId: string
  value?: string
  valueName?: string
  valueType?: string
  onChange: (fieldId: string, data: string, name: string, type: string) => void
  label: string
  note?: string
  required?: boolean
  error?: boolean
  compact?: boolean
}

export function FileUpload({
  fieldId,
  value,
  valueName,
  valueType,
  onChange,
  label,
  note,
  required,
  error,
  compact,
}: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null)
  const hasFile = !!value

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onChange(fieldId, ev.target?.result as string, file.name, file.type)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && ref.current?.click()}
      onClick={() => ref.current?.click()}
      className={cn(
        'cursor-pointer rounded-lg border-2 border-dashed p-3',
        error && 'border-brand-red bg-red-50',
        !error && hasFile && 'border-brand-green bg-green-50',
        !error && !hasFile && 'border-input-border bg-[#fafbfc]',
        compact && 'px-2.5 py-2',
      )}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFile}
        className="hidden"
      />
      {hasFile ? (
        <div className="flex items-center gap-2">
          <span className="text-lg">{valueType?.includes('pdf') ? '📄' : '🖼️'}</span>
          <div className="flex-1">
            <div className="text-xs font-semibold text-brand-green">{valueName || 'File uploaded'}</div>
            <div className="text-[10px] text-t4">Click to replace</div>
          </div>
          <span className="text-sm font-bold text-brand-green">✓</span>
        </div>
      ) : (
        <div className="text-center">
          <div className={cn('mb-1', compact ? 'text-base' : 'text-xl')}>📎</div>
          <div className={cn('text-xs font-semibold', error ? 'text-brand-red' : 'text-t2')}>
            {label}
            {required && <span className="text-brand-red"> *</span>}
          </div>
          {!compact && note && <div className="mt-0.5 text-[10px] text-t4">{note}</div>}
          {!compact && (
            <div className="mt-1 text-[11px] text-t3">Click to upload · PNG, JPG, PDF</div>
          )}
          {error && (
            <div className="mt-0.5 text-[10px] font-semibold text-brand-red">
              ⚠ Required document missing
            </div>
          )}
        </div>
      )}
    </div>
  )
}
