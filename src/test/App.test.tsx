import { describe, it, expect } from 'vitest'
import { validateCompanyCode } from '@/services/auth.service'
import { isAppComplete } from '@/constants/app-sections'
import type { Application } from '@/types'

describe('auth.service', () => {
  it('validates company codes', () => {
    expect(validateCompanyCode('NZG')).toBe(true)
    expect(validateCompanyCode('invalid')).toBe(false)
  })
})

describe('app-sections', () => {
  it('detects incomplete applications', () => {
    const partial: Application = {
      id: 'test',
      talent_id: null,
      access_code: 'X',
      talent_name: 'Test',
      talent_email: 't@test.com',
      status: 'in_progress',
      created_at: new Date().toISOString(),
      data: { legal_first: 'A' },
    }
    expect(isAppComplete(partial)).toBe(false)
  })
})
