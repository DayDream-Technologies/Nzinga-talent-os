import { useRef, useState } from 'react'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { cropAspectForField } from '@/lib/crop-image'
import { cn } from '@/lib/utils'
import { uploadOwnedFile } from '@/services/storage.service'
import type { UploadedDoc } from '@/types/talent'

export type FileUploadExtra = Pick<UploadedDoc, 'storagePath' | 'cdnUrl' | 'thumbnailUrl'>

interface FileUploadProps {
  fieldId: string
  value?: string
  valueName?: string
  valueType?: string
  onChange: (fieldId: string, data: string, name: string, type: string, extra?: FileUploadExtra) => void
  label: string
  note?: string
  required?: boolean
  error?: boolean
  compact?: boolean
  /** S3 path prefix, e.g. talents/abc/documents/gov_id */
  uploadPath: string
  accept?: string
  crop?: boolean | { aspect: number; maxWidth?: number }
  uploadedBy?: string
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
  uploadPath,
  accept = 'image/*,.pdf,.doc,.docx',
  crop,
  uploadedBy,
}: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null)
  const hasFile = !!value
  const [progress, setProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const aspect =
    crop === false ? undefined : typeof crop === 'object' ? crop.aspect : cropAspectForField(fieldId)
  const maxWidth = typeof crop === 'object' ? crop.maxWidth : 1200
  const busy = progress != null

  function pickFile(file: File) {
    setUploadError('')
    if (file.type.startsWith('image/') && aspect != null) {
      setCropFile(file)
      return
    }
    void send(file)
  }

  async function send(file: File) {
    setProgress(0)
    try {
      const doc = await uploadOwnedFile(file, uploadPath, {
        uploadedBy,
        docType: fieldId,
        onProgress: setProgress,
      })
      onChange(fieldId, doc.data, doc.name, doc.type, {
        storagePath: doc.storagePath,
        cdnUrl: doc.cdnUrl,
        thumbnailUrl: doc.thumbnailUrl,
      })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setProgress(null)
      if (ref.current) ref.current.value = ''
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    pickFile(file)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !busy && ref.current?.click()}
        onClick={() => !busy && ref.current?.click()}
        className={cn(
          'cursor-pointer rounded-lg border-2 border-dashed p-3',
          error && 'border-brand-red bg-brand-red-light',
          !error && hasFile && 'border-brand-green bg-brand-green-light',
          !error && !hasFile && 'border-input-border bg-muted-bg',
          compact && 'px-2.5 py-2',
          busy && 'pointer-events-none opacity-80',
        )}
      >
        <input ref={ref} type="file" accept={accept} onChange={handleFile} className="hidden" />
        {busy ? (
          <div className="text-center">
            <div className="text-xs font-semibold text-t2">Uploading… {progress}%</div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-muted-bg">
              <div className="h-full bg-brand-purple" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : hasFile ? (
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
            {!compact && <div className="mt-1 text-[11px] text-t3">Click to upload · PNG, JPG, PDF</div>}
            {error && (
              <div className="mt-0.5 text-[10px] font-semibold text-brand-red">⚠ Required document missing</div>
            )}
          </div>
        )}
        {uploadError && (
          <div className="mt-1 text-[10px] font-semibold text-brand-red">{uploadError}</div>
        )}
      </div>
      {cropFile && (
        <ImageCropper
          file={cropFile}
          aspect={aspect || 1}
          maxWidth={maxWidth}
          onCancel={() => {
            setCropFile(null)
            if (ref.current) ref.current.value = ''
          }}
          onComplete={(blob, name) => {
            setCropFile(null)
            void send(new File([blob], name, { type: blob.type || 'image/jpeg' }))
          }}
        />
      )}
    </>
  )
}
