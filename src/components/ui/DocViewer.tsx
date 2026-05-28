import type { UploadedDoc } from '@/types'

interface DocViewerProps {
  doc: UploadedDoc | null
  onClose: () => void
}

export function DocViewer({ doc, onClose }: DocViewerProps) {
  if (!doc) return null
  const isPdf = doc.type?.includes('pdf')
  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={doc.name}
    >
      <div className="flex max-h-[88vh] max-w-[780px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-[#fafbfc] px-4 py-2.5">
          <span className="text-sm font-bold text-t1">{doc.name}</span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer border-none bg-transparent text-base text-t3"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="min-w-[500px] flex-1 overflow-auto p-4">
          {isPdf ? (
            <iframe src={doc.data} title={doc.name} className="h-[60vh] w-full border-none" />
          ) : (
            <img
              src={doc.data}
              alt={doc.name}
              className="mx-auto block max-h-[70vh] max-w-full rounded-md"
            />
          )}
        </div>
      </div>
    </div>
  )
}
