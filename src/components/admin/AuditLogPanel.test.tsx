import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listUsers, queryAuditLog } from '@/services/admin.service'
import { AuditLogPanel } from './AuditLogPanel'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ companyCode: 'NZG' }),
}))

vi.mock('@/services/admin.service', () => ({
  queryAuditLog: vi.fn(),
  listUsers: vi.fn(),
}))

const mockedQuery = vi.mocked(queryAuditLog)
const mockedListUsers = vi.mocked(listUsers)

describe('AuditLogPanel', () => {
  beforeEach(() => {
    mockedListUsers.mockResolvedValue({
      users: [{ id: 'u5', name: 'Simone Nzinga' } as never],
      error: null,
    })
  })

  it('renders seeded-style audit actions', async () => {
    mockedQuery.mockResolvedValue({
      entries: [
        {
          id: 'a1',
          user_id: 'u5',
          action: 'role_change',
          entity_type: 'user',
          entity_id: 'u2',
          details: { previous_role: 'scout', new_role: 'team1_lead' },
          created_at: '2026-08-20T19:00:00.000Z',
          users: { name: 'Simone Nzinga', email: 'simone@nzinga.co' },
        },
        {
          id: 'a2',
          user_id: 'u5',
          action: 'user_invited',
          entity_type: 'user',
          entity_id: 'u1',
          details: { seed: true, target_name: 'Jordan Hayes' },
          created_at: '2026-08-19T19:00:00.000Z',
          users: { name: 'Simone Nzinga', email: 'simone@nzinga.co' },
        },
      ],
      total: 2,
      error: null,
    })

    render(<AuditLogPanel />)

    expect(await screen.findByText(/previous_role: scout/)).toBeInTheDocument()
    expect(screen.getAllByText('role_change').length).toBeGreaterThan(1)
    expect(screen.getAllByText('user_invited').length).toBeGreaterThan(1)
    expect(screen.getAllByText('Simone Nzinga').length).toBeGreaterThan(0)
    expect(screen.getByText(/target_name: Jordan Hayes/)).toBeInTheDocument()
    expect(screen.queryByText(/seed:/)).not.toBeInTheDocument()
    expect(screen.getByText(/Showing/)).toHaveTextContent('1')
    expect(screen.getByText(/Showing/)).toHaveTextContent('2')
  })

  it('shows an empty state when there are no entries', async () => {
    mockedQuery.mockResolvedValue({ entries: [], total: 0, error: null })

    render(<AuditLogPanel />)

    expect(
      await screen.findByText(/No audit entries found/i),
    ).toBeInTheDocument()
  })

  it('surfaces query errors', async () => {
    mockedQuery.mockResolvedValue({
      entries: [],
      total: 0,
      error: 'Director access required',
    })

    render(<AuditLogPanel />)

    expect(await screen.findByText('Director access required')).toBeInTheDocument()
  })
})
