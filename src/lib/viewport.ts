export type ViewportBand = 'desktop' | 'tablet' | 'mobile'

/** Staff grids: ≥1280 desktop, 768–1279 tablet, <768 mobile. */
export function viewportBand(width: number): ViewportBand {
  if (width >= 1280) return 'desktop'
  if (width >= 768) return 'tablet'
  return 'mobile'
}

export function staffGridColumns(band: ViewportBand, desktopCols: string): string {
  if (band === 'mobile') return '1fr'
  if (band === 'tablet') return 'repeat(2, minmax(0, 1fr))'
  return desktopCols
}

/** Two- or three-column form grids that wrap to a single column under ~200px cells. */
export const AUTO_STACK_GRID = 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))'
