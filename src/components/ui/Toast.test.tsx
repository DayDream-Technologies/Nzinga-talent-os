import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ToastProvider, useToast } from '@/components/ui/Toast'

function Trigger() {
  const { showToast } = useToast()
  return (
    <button type="button" onClick={() => showToast('Save failed', 'error')}>
      Fail
    </button>
  )
}

describe('Toast', () => {
  it('shows an error toast', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Fail' }))
    expect(screen.getByRole('status')).toHaveTextContent('Save failed')
  })
})
