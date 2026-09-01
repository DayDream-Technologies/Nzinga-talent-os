import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CreateProspectModal } from '@/components/agency/CreateProspectModal'

describe('CreateProspectModal minor parent contact', () => {
  it('requires parent contact when the prospect is under 18', () => {
    const onCreate = vi.fn()
    render(
      <CreateProspectModal
        defaultOrganization="NZG"
        agent={{ id: 'u1', name: 'Jordan Scout' }}
        onClose={vi.fn()}
        onCreate={onCreate}
      />,
    )

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Alex Rivera' } })
    fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'alex@example.com' } })
    fireEvent.change(screen.getByLabelText('Date of birth *'), { target: { value: '2015-01-01' } })

    expect(screen.getByText(/minor; parent\/guardian contact required/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create prospect' }))
    expect(screen.getByText(/Parent name, email, and phone are required/i)).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Parent name *'), { target: { value: 'Pat Rivera' } })
    fireEvent.change(screen.getByLabelText('Parent email *'), { target: { value: 'pat@example.com' } })
    fireEvent.change(screen.getByLabelText('Parent phone *'), { target: { value: '555-010-1111' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create prospect' }))

    expect(onCreate).toHaveBeenCalledTimes(1)
    expect(onCreate.mock.calls[0][0]).toMatchObject({
      isMinor: true,
      parentName: 'Pat Rivera',
      parentEmail: 'pat@example.com',
      parentPhone: '555-010-1111',
    })
  })
})
