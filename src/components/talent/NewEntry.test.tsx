import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NewEntry } from '@/components/talent/NewEntry'

const currentUser = { id: 'u1', name: 'Jordan Scout', role: 'scout' }

function fillRequiredBasics() {
  fireEvent.change(screen.getByPlaceholderText('Alex'), { target: { value: 'Alex' } })
  fireEvent.change(screen.getByPlaceholderText('Rivera'), { target: { value: 'Rivera' } })
  fireEvent.change(screen.getByPlaceholderText('talent@email.com'), { target: { value: 'alex@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('(555) 000-0000'), { target: { value: '555-010-0000' } })
  fireEvent.change(screen.getByPlaceholderText('Atlanta'), { target: { value: 'Atlanta' } })
  fireEvent.change(screen.getByPlaceholderText('GA'), { target: { value: 'GA' } })
}

function setDob(value: string) {
  const dob = document.querySelectorAll('input[type="date"]')[0] as HTMLInputElement
  fireEvent.change(dob, { target: { value } })
}

describe('NewEntry minor parent contact', () => {
  it('requires parent name, email, and phone when date of birth is under 18', () => {
    const onSave = vi.fn()
    render(
      <NewEntry currentUser={currentUser} onSave={onSave} onCancel={vi.fn()} />,
    )

    fillRequiredBasics()
    fireEvent.click(screen.getByRole('button', { name: 'Create Talent Applicant' }))
    expect(screen.getByText(/Date of birth is required/i)).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()

    setDob('2015-01-01')
    expect(screen.getByText(/minor; parent\/guardian contact required/i)).toBeInTheDocument()
    expect(screen.getByText('Parent / guardian (required under 18)')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Create Talent Applicant' }))
    expect(screen.getByText(/Parent name, email, and phone are required/i)).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('Parent or legal guardian full name'), {
      target: { value: 'Pat Rivera' },
    })
    fireEvent.change(screen.getByPlaceholderText('parent@email.com'), {
      target: { value: 'pat@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('(555) 000-1111'), {
      target: { value: '555-010-1111' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Talent Applicant' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0][0]
    expect(saved.legal_minor_status).toBe('Yes')
    expect(saved.parent_guardian_required).toBe('Yes')
    expect(saved.parent_name).toBe('Pat Rivera')
    expect(saved.parent_email).toBe('pat@example.com')
    expect(saved.parent_phone).toBe('555-010-1111')
  })

  it('does not require parent contact for adult applicants', () => {
    const onSave = vi.fn()
    render(
      <NewEntry currentUser={currentUser} onSave={onSave} onCancel={vi.fn()} />,
    )

    fillRequiredBasics()
    setDob('1998-04-12')
    expect(screen.queryByText('Parent / guardian (required under 18)')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Create Talent Applicant' }))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0].legal_minor_status).toBe('No')
    expect(onSave.mock.calls[0][0].parent_name).toBe('')
  })
})
