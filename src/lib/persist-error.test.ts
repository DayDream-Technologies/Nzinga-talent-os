import { describe, expect, it } from 'vitest'
import { persistErrorMessage } from '@/lib/persist-error'

describe('persistErrorMessage', () => {
  it('uses Error.message when present', () => {
    expect(persistErrorMessage(new Error('upsert failed'))).toBe('upsert failed')
  })

  it('uses a non-empty string', () => {
    expect(persistErrorMessage('network down')).toBe('network down')
  })

  it('uses message on a PostgREST-shaped object', () => {
    expect(persistErrorMessage({ message: 'infinite recursion detected in policy for relation "users"' })).toBe(
      'infinite recursion detected in policy for relation "users"',
    )
  })

  it('falls back for unknown values', () => {
    expect(persistErrorMessage(null)).toBe('Changes could not be saved. Try again.')
    expect(persistErrorMessage({})).toBe('Changes could not be saved. Try again.')
  })
})
