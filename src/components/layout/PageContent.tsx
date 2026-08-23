import type { CSSProperties, ReactNode } from 'react'

/** Max width for form / settings-style pages so content stays readable but uses the canvas. */
export const PAGE_CONTENT_MAX_WIDTH = 1100

export function PageContent({
  children,
  maxWidth = PAGE_CONTENT_MAX_WIDTH,
  style,
}: {
  children: ReactNode
  maxWidth?: number
  style?: CSSProperties
}) {
  return (
    <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'auto' }}>
      <div
        style={{
          width: '100%',
          maxWidth,
          margin: '0 auto',
          padding: '28px 32px 48px',
          boxSizing: 'border-box',
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  )
}
