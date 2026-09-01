import { describe, expect, it } from 'vitest'
import { cropAspectForField, outputExtension, replaceExtension } from '@/lib/crop-image'

describe('cropAspectForField', () => {
  it('uses 1:1 for profile photos and 3:4 for headshots', () => {
    expect(cropAspectForField('doc_profile_photo')).toBe(1)
    expect(cropAspectForField('profile_photo')).toBe(1)
    expect(cropAspectForField('doc_model_headshot')).toBe(3 / 4)
    expect(cropAspectForField('headshot')).toBe(3 / 4)
    expect(cropAspectForField('gov_id')).toBeUndefined()
  })
})

describe('output file names', () => {
  it('swaps the extension when encoding WebP', () => {
    expect(replaceExtension('headshot.JPG', outputExtension('image/webp'))).toBe('headshot.webp')
  })
})
