export function jordanScoreFromPillars(scores: Array<number | undefined> | undefined): number {
  const five = [0, 1, 2, 3, 4].map((i) => {
    const n = Number(scores?.[i] ?? 0)
    return Number.isFinite(n) ? n : 0
  })
  const avg = five.reduce((sum, n) => sum + n, 0) / 5
  return parseFloat(avg.toFixed(2))
}

export function jordanScoreMeetsThreshold(scores: Array<number | undefined> | undefined): boolean {
  const five = [0, 1, 2, 3, 4].map((i) => Number(scores?.[i] ?? 0))
  return jordanScoreFromPillars(five) >= 3.5 && five.every((n) => n >= 3)
}
