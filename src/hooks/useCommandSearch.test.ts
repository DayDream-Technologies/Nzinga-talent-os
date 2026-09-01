import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { scoreMatch, useCommandSearch } from '@/hooks/useCommandSearch'

vi.mock('@/hooks/useTalentDirectory', () => ({
  useTalentDirectory: () => ({
    list: [
      {
        accountId: 'NZG-200199',
        name: 'Rico Alvarez',
        statusLabel: 'Prospect · communicating',
        socialHandle: '',
      },
    ],
  }),
}))

vi.mock('@/context/AppDataContext', () => ({
  useAppData: () => ({ applications: {} }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'director' } }),
}))

describe('scoreMatch', () => {
  it('does not fuzzy-match a person name against a page slug', () => {
    expect(scoreMatch('Rico', 'report-applicant-pool')).toBeGreaterThan(0)
    expect(scoreMatch('Rico', 'report-applicant-pool', { fuzzy: false })).toBe(0)
    expect(scoreMatch('Rico', 'Applicant Pool & Pipeline Log', { fuzzy: false })).toBe(0)
  })

  it('still matches page titles by substring', () => {
    expect(scoreMatch('applicant', 'Applicant Pool & Pipeline Log', { fuzzy: false })).toBeGreaterThan(0)
    expect(scoreMatch('pool', 'report-applicant-pool', { fuzzy: false })).toBeGreaterThan(0)
  })
})

describe('useCommandSearch', () => {
  it('does not recommend the applicant pool page when searching a person name', () => {
    const { result } = renderHook(() => useCommandSearch('Rico'))
    expect(result.current.some((r) => r.kind === 'person' && r.label.includes('Rico'))).toBe(true)
    expect(
      result.current.some(
        (r) => r.kind === 'page' && (r.path.includes('applicant-pool') || /applicant pool/i.test(r.label)),
      ),
    ).toBe(false)
    expect(result.current.filter((r) => r.kind === 'page')).toHaveLength(0)
  })

  it('still finds the applicant pool page by its title', () => {
    const { result } = renderHook(() => useCommandSearch('applicant pool'))
    expect(result.current.some((r) => r.kind === 'page' && r.path === 'report-applicant-pool')).toBe(true)
  })
})
