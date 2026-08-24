import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ClientsModule } from '@/components/agency/ClientsModule'
import type { AgencyTalent } from '@/types/agency'

const { sampleClient, archiveClients, restoreClients } = vi.hoisted(() => {
  const sampleClient: AgencyTalent = {
    id: 'talent_maya',
    accountId: 'NZG-200101',
    name: 'Maya Rivera',
    firstName: 'Maya',
    lastName: 'Rivera',
    email: 'maya@example.com',
    phone: '+1 555-0101',
    role: 'Signed Model',
    status: 'current',
    workArea: 'Modeling',
    division: 'Modeling',
    niches: ['Commercial'],
    property: 'Nzinga Management Agency',
    bankReady: true,
    taxFormsReady: true,
    available: true,
    bookedDates: [],
    contractStart: '2025-09-01',
    contractEnd: null,
  }
  return {
    sampleClient,
    archiveClients: vi.fn(),
    restoreClients: vi.fn(),
  }
})

vi.mock('@/context/AppDataContext', () => ({
  useAppData: () => ({
    talents: [],
    setHistory: vi.fn(),
  }),
}))

vi.mock('@/context/AgencyDataContext', () => ({
  useAgencyData: () => ({
    talent: [sampleClient],
    createClient: vi.fn(),
    archiveClients,
    restoreClients,
    prospects: [],
    sendMessage: vi.fn(),
  }),
}))

describe('ClientsModule', () => {
  it('confirms before moving a client to Past and does nothing on cancel', () => {
    render(
      <MemoryRouter>
        <ClientsModule />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Row actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Move to Past' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/leave the Current list/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(archiveClients).not.toHaveBeenCalled()
  })

  it('archives the client after confirm', () => {
    render(
      <MemoryRouter>
        <ClientsModule />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Row actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Move to Past' }))
    fireEvent.click(screen.getByRole('button', { name: 'Move to Past' }))

    expect(archiveClients).toHaveBeenCalledWith(['talent_maya'])
    expect(restoreClients).not.toHaveBeenCalled()
  })
})
