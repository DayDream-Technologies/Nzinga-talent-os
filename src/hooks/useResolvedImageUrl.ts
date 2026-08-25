import { useEffect, useState } from 'react'
import { resolveUploadedDocUrl } from '@/services/storage.service'
import type { UploadedDoc } from '@/types/talent'

function immediateDisplayUrl(doc: UploadedDoc | null | undefined): string | null {
  if (!doc?.data) return null
  if (doc.data.startsWith('data:')) return doc.data
  if (doc.data.startsWith('http://') || doc.data.startsWith('https://')) return doc.data
  return null
}

/** Resolve a stored document (data URL, storage path, or public URL) to something an <img> can load. */
export function useResolvedImageUrl(doc: UploadedDoc | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => immediateDisplayUrl(doc))

  useEffect(() => {
    if (!doc?.data) {
      setUrl(null)
      return
    }
    const immediate = immediateDisplayUrl(doc)
    if (doc.data.startsWith('data:')) {
      setUrl(doc.data)
      return
    }
    if (immediate) setUrl(immediate)
    let cancelled = false
    void resolveUploadedDocUrl(doc).then((resolved) => {
      if (!cancelled && resolved) setUrl(resolved)
    })
    return () => {
      cancelled = true
    }
  }, [doc?.data, doc?.storagePath])

  return url
}
