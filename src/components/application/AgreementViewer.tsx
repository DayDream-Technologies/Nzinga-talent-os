import { useState, useRef, useCallback } from 'react'
import { REPRESENTATION_AGREEMENT_TEXT } from '@/lib/representation-agreement'

const AGREEMENT_TEXT = REPRESENTATION_AGREEMENT_TEXT

interface AgreementViewerProps {
  onScrollComplete: (complete: boolean) => void
  hasScrolledToBottom: boolean
}

export function AgreementViewer({ onScrollComplete, hasScrolledToBottom }: AgreementViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollPct, setScrollPct] = useState(0)

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const pct = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
    setScrollPct(pct)
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      onScrollComplete(true)
    }
  }, [onScrollComplete])

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Talent Representation Agreement</span>
        {!hasScrolledToBottom && <span style={{ color: '#f59e0b', fontSize: 10 }}>Scroll to bottom to enable consent</span>}
        {hasScrolledToBottom && <span style={{ color: '#4ade80', fontSize: 10 }}>✓ Agreement reviewed</span>}
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          maxHeight: 360,
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${hasScrolledToBottom ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 8,
          padding: '16px 20px',
          fontFamily: "'Syne', sans-serif",
          fontSize: 12,
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.75)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {AGREEMENT_TEXT}
      </div>
      <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${scrollPct}%`, background: hasScrolledToBottom ? '#4ade80' : '#7c3aed', transition: 'width 0.2s' }} />
      </div>
    </div>
  )
}
