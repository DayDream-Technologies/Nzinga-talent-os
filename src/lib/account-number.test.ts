import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_NUMBER_START,
  assignAccountNumber,
  formatAccountNumber,
  nextAccountNumber,
  parseAccountSeq,
} from '@/lib/account-number'

describe('account numbers', () => {
  it('formats sequential NZG account IDs', () => {
    expect(formatAccountNumber(ACCOUNT_NUMBER_START)).toBe('NZG-100001')
    expect(formatAccountNumber(100042)).toBe('NZG-100042')
  })

  it('parses account sequences', () => {
    expect(parseAccountSeq('NZG-100010')).toBe(100010)
    expect(parseAccountSeq('nzg-100010')).toBe(100010)
    expect(parseAccountSeq('')).toBeNull()
    expect(parseAccountSeq('t1')).toBeNull()
  })

  it('issues unique next IDs from existing numbers', () => {
    expect(nextAccountNumber([])).toBe('NZG-100001')
    expect(nextAccountNumber(['NZG-100001', 'NZG-100003'])).toBe('NZG-100004')
  })

  it('does not overwrite an existing account number', () => {
    const kept = assignAccountNumber({ account_number: 'NZG-100009' }, ['NZG-100009'])
    expect(kept.account_number).toBe('NZG-100009')
    const created = assignAccountNumber({ account_number: '' }, ['NZG-100009'])
    expect(created.account_number).toBe('NZG-100010')
  })
})
