import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FullMenu } from '@/components/layout/Layout'

describe('FullMenu top row', () => {
  it('places Client Management Dashboard between Workspace and Settings', () => {
    render(<FullMenu onClose={vi.fn()} onNav={vi.fn()} userRole="director" companyCode="NZG" />)
    const labels = screen.getAllByRole('button').map((button) => button.textContent)
    const workspace = labels.indexOf('Workspace')
    const dashboard = labels.indexOf('Client Management Dashboard')
    const settings = labels.indexOf('Settings')
    expect(workspace).toBeGreaterThanOrEqual(0)
    expect(dashboard).toBe(workspace + 1)
    expect(settings).toBe(dashboard + 1)
  })
})
