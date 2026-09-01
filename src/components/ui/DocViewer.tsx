import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { UploadedDoc } from '@/types'
import { downloadUploadedDoc } from '@/lib/representation-agreement'
import { resolveUploadedDocUrl } from '@/services/storage.service'
import { isS3Ref } from '@/lib/application-files'
import { resolveS3Url } from '@/lib/s3-storage'

interface DocViewerProps {
  doc: UploadedDoc | null
  onClose: () => void
}

function initialSrc(doc: UploadedDoc | null): string {
  if (!doc) return ''
  if (doc.cdnUrl) return doc.cdnUrl
  if (isS3Ref(doc.data)) return resolveS3Url(doc.data)
  return doc.data || ''
}

export function DocViewer({ doc, onClose }: DocViewerProps) {
  const [src, setSrc] = useState(() => initialSrc(doc))

  useEffect(() => {
    if (!doc) {
      setSrc('')
      return
    }
    let cancelled = false
    setSrc(initialSrc(doc))
    void resolveUploadedDocUrl(doc).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [doc])

  if (!doc) return null
  const isPdf = doc.type?.includes('pdf')
  const isImage = Boolean(doc.type?.startsWith('image/'))
  const isText =
    Boolean(doc.type?.includes('text')) ||
    doc.name?.toLowerCase().endsWith('.txt') ||
    doc.data?.startsWith('data:text/')

  let textBody = ''
  if (isText && doc.data.startsWith('data:')) {
    try {
      const comma = doc.data.indexOf(',')
      const payload = comma >= 0 ? doc.data.slice(comma + 1) : ''
      textBody = decodeURIComponent(payload)
    } catch {
      textBody = 'Unable to preview this text document.'
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={doc.name}
    >
      <div className="flex max-h-[88vh] max-w-[780px] flex-col overflow-hidden rounded-lg bg-elevated-bg shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-card-border bg-muted-bg px-4 py-2.5">
          <span className="truncate text-sm font-bold text-t1">{doc.name}</span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => downloadUploadedDoc({ ...doc, data: src || doc.data })}
              className="cursor-pointer rounded-md border border-card-border bg-card-bg px-2.5 py-1 text-xs font-semibold text-t2"
            >
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer border-none bg-transparent text-base text-t3"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="min-w-[min(100%,500px)] flex-1 overflow-auto p-4">
          {isPdf ? (
            <iframe src={src} title={doc.name} className="h-[60vh] w-full border-none" />
          ) : isImage ? (
            <img
              src={src}
              alt={doc.name}
              className="mx-auto block max-h-[70vh] max-w-full rounded-md"
            />
          ) : isText ? (
            <pre
              className="whitespace-pre-wrap rounded-md border border-card-border bg-muted-bg p-4 font-serif text-xs leading-relaxed text-t1"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {textBody}
            </pre>
          ) : (
            <div className="text-center text-sm text-t3">
              <p className="mb-3">Preview is not available for this file type.</p>
              <button
                type="button"
                onClick={() => downloadUploadedDoc({ ...doc, data: src || doc.data })}
                className="cursor-pointer rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
              >
                Download file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
