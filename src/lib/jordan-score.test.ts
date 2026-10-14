import { describe, expect, it } from 'vitest'
import { jordanScoreFromPillars, jordanScoreMeetsThreshold } from '@/lib/jordan-score'

describe('Jordan Score', () => {
  it('averages five pillars', () => {
    expect(jordanScoreFromPillars([3, 3, 4, 4, 5])).toBe(3.8)
    expect(jordanScoreFromPillars([5])).toBe(1)
  })

  it('requires an average of 3.5 and every pillar at least 3', () => {
    expect(jordanScoreMeetsThreshold([3, 3, 4, 4, 4])).toBe(true)
    expect(jordanScoreMeetsThreshold([5, 5, 5, 5, 1])).toBe(false)
    expect(jordanScoreMeetsThreshold([3, 3, 3, 3, 3])).toBe(false)
  })
})
