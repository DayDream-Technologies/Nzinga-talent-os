import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useResolvedImageUrl } from '@/hooks/useResolvedImageUrl'
import { seedProfilePhoto } from '@/lib/profile-photo'

describe('useResolvedImageUrl', () => {
  it('returns data URLs immediately', () => {
    const doc = seedProfilePhoto('Maya Rivera', 'MR')
    const { result } = renderHook(() => useResolvedImageUrl(doc))
    expect(result.current).toBe(doc.data)
  })

  it('returns null when there is no document', () => {
    const { result } = renderHook(() => useResolvedImageUrl(null))
    expect(result.current).toBeNull()
  })
})
