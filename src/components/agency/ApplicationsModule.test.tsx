import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicationsModule } from '@/components/agency/ApplicationsModule'
import type { Application } from '@/types'

const { sampleApp, importAppToPipeline, archiveApplications, restoreApplications, navigate, authState } = vi.hoisted(() => {
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
    importAppToPipeline: vi.fn(),
    archiveApplications: vi.fn().mockResolvedValue(undefined),
    restoreApplications: vi.fn().mockResolvedValue(undefined),
    navigate: vi.fn(),
    authState: { role: 'scout' as string },
  }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})

vi.mock('@/context/AppDataContext', () => ({
  useAppData: () => ({
    applications: { app_kai: sampleApp },
    talents: [],
    importAppToPipeline,
    archiveApplications,
    restoreApplications,
  }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Jordan Hayes', role: authState.role },
    companyCode: 'NZG',
  }),
}))

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({
    prospects: [],
  }),
}))

describe('ApplicationsModule', () => {
  beforeEach(() => {
    authState.role = 'scout'
    sampleApp.status = 'in_progress'
    sampleApp.archived_from = null
    sampleApp.archived_at = null
    archiveApplications.mockClear()
    restoreApplications.mockClear()
  })

  it('renders the prospects-style panel, table columns, and navigates on row click', () => {
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
    expect(navigate).toHaveBeenCalledWith('/applications/app_kai')
    expect(importAppToPipeline).not.toHaveBeenCalled()
  })

  it('keeps Review application disabled until the application is submitted and complete', () => {
    render(
      <MemoryRouter>
        <ApplicationsModule />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Row actions' }))
    expect(screen.getByRole('menuitem', { name: 'Review application' })).toBeDisabled()
    expect(screen.queryByRole('menuitem', { name: 'Archive application' })).not.toBeInTheDocument()
  })

  it('lets an admin archive an application after confirm', async () => {
    authState.role = 'director'
    render(
      <MemoryRouter>
        <ApplicationsModule />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Row actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Archive application' }))
    expect(archiveApplications).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^Archive$/ }))
    await waitFor(() => expect(archiveApplications).toHaveBeenCalledWith(['app_kai']))
  })

  it('hides archived applications until the Archived filter is selected', () => {
    sampleApp.status = 'archived'
    sampleApp.archived_from = 'in_progress'
    render(
      <MemoryRouter>
        <ApplicationsModule />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Kai')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Filter applications'), { target: { value: 'archived' } })
    expect(screen.getByText('Kai')).toBeInTheDocument()
    expect(screen.getAllByText('Archived').length).toBeGreaterThan(1)
  })
})
