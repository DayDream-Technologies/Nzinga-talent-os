import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LookupCatalogs } from '@/components/admin/LookupCatalogs'
import { leadSourceNames } from '@/lib/lookup-catalogs'

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({ prospects: [], updateProspect: vi.fn() }),
}))

describe('LookupCatalogs lead sources', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('lets an admin add a lead source that staff can select', () => {
    render(<LookupCatalogs />)

    expect(screen.getByRole('combobox', { name: 'Catalog' })).toHaveValue('Lead Sources')
    expect(screen.getByText('Referral')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('New lead source'), { target: { value: 'Campus Fair' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Campus Fair')).toBeInTheDocument()
    expect(leadSourceNames()).toContain('Campus Fair')

    fireEvent.change(screen.getByLabelText('New lead source'), { target: { value: 'campus fair' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('That value already exists.')).toBeInTheDocument()
    expect(leadSourceNames().filter((name) => name.toLowerCase() === 'campus fair')).toHaveLength(1)
  })
})
