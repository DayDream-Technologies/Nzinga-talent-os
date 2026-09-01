import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AgencyWorkspace } from '@/components/agency/AgencyModules'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Simone Director', role: 'director' } }),
}))

describe('AgencyWorkspace', () => {
  it('renders larger welcome and section titles', () => {
    render(
      <MemoryRouter>
        <AgencyWorkspace />
      </MemoryRouter>,
    )

    expect(screen.getByText('Welcome, Simone')).toHaveStyle({ fontSize: '36px' })
    expect(screen.getByText(/Let's get to work/)).toHaveStyle({ fontSize: '16px' })
    expect(screen.getByText('My Favorites')).toHaveStyle({ fontSize: '18px' })
    expect(screen.getByText('My Reports')).toHaveStyle({ fontSize: '18px' })
    expect(screen.getByText('Talent Info')).toHaveStyle({ fontSize: '16px' })
  })
})
