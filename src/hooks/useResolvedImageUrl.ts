import { useEffect, useState } from 'react'
import { isS3Ref, parseS3Key, toS3Ref } from '@/lib/application-files'
import { resolveS3Url } from '@/lib/s3-storage'
import { resolveUploadedDocUrl } from '@/services/storage.service'
import type { UploadedDoc } from '@/types/talent'

function immediateDisplayUrl(doc: UploadedDoc | null | undefined): string | null {
  if (!doc) return null
  if (doc.cdnUrl) return doc.cdnUrl
  if (!doc.data) return null
  if (doc.data.startsWith('data:')) return doc.data
  if (doc.data.startsWith('http://') || doc.data.startsWith('https://')) return doc.data
  if (isS3Ref(doc.data) || parseS3Key(doc.data)) return resolveS3Url(doc.data)
  if (doc.storagePath) {
    const key = parseS3Key(doc.storagePath)
    if (key) return resolveS3Url(toS3Ref(key))
  }
  return null
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
    if (immediate) {
      setUrl(immediate)
      if (doc.data?.startsWith('data:') || isS3Ref(doc.data) || doc.cdnUrl) return
    }
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
