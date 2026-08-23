import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { validateCompanyCode } from '@/services/auth.service'
import { isAppComplete } from '@/constants/app-sections'
import { STORAGE_COMPANY_CODE, isPublicAuthPath } from '@/lib/session-storage'
import { AuthProvider } from '@/context/AuthContext'
import { CompanyCodePage } from '@/pages/CompanyCodePage'
import { LoginPage } from '@/pages/LoginPage'
import type { Application } from '@/types'

describe('auth.service', () => {
  it('validates company codes', () => {
    expect(validateCompanyCode('NZG')).toBe(true)
    expect(validateCompanyCode('invalid')).toBe(false)
  })
})

describe('public auth paths', () => {
  it('treats pre-auth screens as public', () => {
    expect(isPublicAuthPath('/tmx')).toBe(true)
    expect(isPublicAuthPath('/login')).toBe(true)
    expect(isPublicAuthPath('/portal')).toBe(true)
    expect(isPublicAuthPath('/talent/login')).toBe(true)
    expect(isPublicAuthPath('/workspace')).toBe(false)
  })
})

describe('app-sections', () => {
  it('detects incomplete applications', () => {
    const partial: Application = {
      id: 'test',
      talent_id: null,
      access_code: 'X',
      company_code: 'NZG',
      talent_name: 'Test',
      talent_email: 't@test.com',
      status: 'in_progress',
      created_at: new Date().toISOString(),
      data: { legal_first: 'A' },
    }
    expect(isAppComplete(partial)).toBe(false)
  })
})

describe('CompanyCodePage', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_COMPANY_CODE)
  })

  it('does not send users back to code entry after a stored code', async () => {
    localStorage.setItem(STORAGE_COMPANY_CODE, 'NZG')
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/tmx']}>
          <Routes>
            <Route path="/tmx" element={<CompanyCodePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(await screen.findByRole('button', { name: /staff login/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /staff login/i }))

    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/e\.g\. NZG/i)).not.toBeInTheDocument()
  })
})
