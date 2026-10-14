import { useEffect, useState } from 'react'
import { immediateFileUrl, isDurableCdnUrl } from '@/lib/file-access'
import { resolveUploadedDocUrl } from '@/services/storage.service'
import type { UploadedDoc } from '@/types/talent'

function immediateDisplayUrl(doc: UploadedDoc | null | undefined): string | null {
  const url = immediateFileUrl(doc)
  return url || null
}

/** Resolve a stored document (data URL, S3 ref, or public URL) to something an <img> can load. */
export function useResolvedImageUrl(doc: UploadedDoc | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => immediateDisplayUrl(doc))

  useEffect(() => {
    if (!doc?.data && !doc?.cdnUrl) {
      setUrl(null)
      return
    }
    const immediate = immediateDisplayUrl(doc)
    if (immediate) setUrl(immediate)
    if (immediate && (immediate.startsWith('data:') || isDurableCdnUrl(immediate))) return
    let cancelled = false
    void resolveUploadedDocUrl(doc).then((resolved) => {
      if (!cancelled && resolved) setUrl(resolved)
    })
    return () => {
      cancelled = true
    }
  }, [doc?.data, doc?.storagePath, doc?.cdnUrl])

  return url
}
