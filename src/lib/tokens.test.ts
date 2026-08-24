import { describe, expect, it } from 'vitest'
import { T } from '@/lib/tokens'

describe('design tokens', () => {
  it('binds surface and text colors to CSS variables so inline styles follow theme', () => {
    expect(T.pageBg).toBe('var(--color-page-bg)')
    expect(T.cardBg).toBe('var(--color-card-bg)')
    expect(T.cardBorder).toBe('var(--color-card-border)')
    expect(T.inputBg).toBe('var(--color-input-bg)')
    expect(T.mutedBg).toBe('var(--color-muted-bg)')
    expect(T.elevatedBg).toBe('var(--color-elevated-bg)')
    expect(T.t1).toBe('var(--color-t1)')
    expect(T.t3).toBe('var(--color-t3)')
    expect(T.blueL).toBe('var(--color-brand-blue-light)')
  })

  it('keeps brand hues as hex so alpha suffixes still work', () => {
    expect(T.blue).toBe('#2563eb')
    expect(T.purple).toBe('#7c3aed')
    expect(T.blue + '22').toBe('#2563eb22')
  })
})
