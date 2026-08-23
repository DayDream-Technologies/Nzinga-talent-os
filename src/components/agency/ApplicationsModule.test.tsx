import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationsModule } from '@/components/agency/ApplicationsModule'
import type { Application } from '@/types'

const { sampleApp, setReviewingApp, importAppToPipeline } = vi.hoisted(() => {
  const sampleApp: Application = {
    id: 'app_kai',
    talent_id: 't4',
    access_code: 'KAI2026',
    company_code: 'NZG',
    talent_name: 'Kai Johnson',
    talent_email: 'kai@example.com',
    status: 'in_progress',
    created_at: '2026-05-18T10:00:00Z',
    last_saved: '2026-05-19T14:30:00Z',
    completed_sections: ['personal', 'interests'],
    data: {
      legal_first: 'Kai',
      legal_last: 'Johnson',
      city: 'Chicago',
      state: 'IL',
    },
  }
  return {
    sampleApp,
    setReviewingApp: vi.fn(),
    importAppToPipeline: vi.fn(),
  }
})

vi.mock('@/context/AppDataContext', () => ({
  useAppData: () => ({
    applications: { app_kai: sampleApp },
    talents: [],
    setReviewingApp,
    importAppToPipeline,
  }),
}))

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({
    prospects: [],
  }),
}))

describe('ApplicationsModule', () => {
  it('renders the prospects-style panel, table columns, and opens review on row click', () => {
    render(
      <MemoryRouter>
        <ApplicationsModule />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Applications' })).toBeInTheDocument()
    expect(screen.getByText(/Create and manage people on Prospects/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Prospects' })).toBeInTheDocument()
    expect(screen.getByLabelText('Filter applications')).toBeInTheDocument()

    expect(screen.getByText('First name')).toBeInTheDocument()
    expect(screen.getByText('Last name')).toBeInTheDocument()
    expect(screen.getByText('Property')).toBeInTheDocument()
    expect(screen.getByText('Account #')).toBeInTheDocument()

    expect(screen.getByText('Kai')).toBeInTheDocument()
    expect(screen.getByText('Johnson')).toBeInTheDocument()
    expect(screen.getByText('Chicago')).toBeInTheDocument()
    expect(screen.getByText('KAI2026')).toBeInTheDocument()
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText('Kai'))
    expect(setReviewingApp).toHaveBeenCalledWith(sampleApp)
    expect(importAppToPipeline).not.toHaveBeenCalled()
  })
})
