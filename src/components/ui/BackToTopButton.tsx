import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { T } from '@/lib/tokens'

function getScrollParent(el: HTMLElement | null): HTMLElement | Window {
  const marked = el?.closest('[data-scroll-container]')
  if (marked instanceof HTMLElement) return marked
  let node = el?.parentElement
  while (node) {
    const style = getComputedStyle(node)
    const overflowY = style.overflowY || style.overflow
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return window
}

function scrollTopOf(target: HTMLElement | Window): number {
  return target instanceof Window ? target.scrollY : target.scrollTop
}

export function BackToTopButton({ threshold = 240 }: { threshold?: number }) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLElement | Window | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const parent = getScrollParent(sentinel)
    targetRef.current = parent
    function onScroll() {
      setVisible(scrollTopOf(parent) > threshold)
    }
    onScroll()
    parent.addEventListener('scroll', onScroll, { passive: true })
    return () => parent.removeEventListener('scroll', onScroll)
  }, [threshold])

  function scrollToTop() {
    const target = targetRef.current
    if (!target) return
    target.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      {visible &&
        createPortal(
          <button
            type="button"
            aria-label="Back to top"
            onClick={scrollToTop}
            style={{
              position: 'fixed',
              right: 22,
              bottom: 22,
              zIndex: 400,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 999,
              border: 'none',
              background: T.blue,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
            }}
          >
            ↑ Back to top
          </button>,
          document.body,
        )}
    </>
  )
}
