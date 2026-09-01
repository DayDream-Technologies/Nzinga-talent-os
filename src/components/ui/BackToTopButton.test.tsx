import { fireEvent, render, screen } from '@testing-library/react'
import { useRef, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BackToTopButton } from '@/components/ui/BackToTopButton'

function ScrollHost({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      data-testid="scroll-host"
      data-scroll-container=""
      style={{ height: 120, overflow: 'auto' }}
    >
      <div style={{ height: 800 }}>{children}</div>
    </div>
  )
}

describe('BackToTopButton', () => {
  it('appears after scrolling and returns the panel to the top', () => {
    render(
      <ScrollHost>
        <BackToTopButton threshold={40} />
      </ScrollHost>,
    )

    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument()

    const host = screen.getByTestId('scroll-host')
    Object.defineProperty(host, 'scrollHeight', { configurable: true, value: 800 })
    Object.defineProperty(host, 'clientHeight', { configurable: true, value: 120 })
    host.scrollTo = vi.fn()
    host.scrollTop = 200
    fireEvent.scroll(host)

    expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back to top' }))
    expect(host.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
