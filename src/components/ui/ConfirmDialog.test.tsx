import { useState } from 'react'
import { createMemoryRouter, Link, Route, RouterProvider, Routes } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useUnsavedNavigation } from '@/components/ui/ConfirmDialog'

function DirtySettings() {
  const [text, setText] = useState('')
  const dialog = useUnsavedNavigation(text.length > 0)
  return (
    <div>
      <input aria-label="notes" value={text} onChange={(e) => setText(e.target.value)} />
      {dialog}
    </div>
  )
}

function Shell() {
  return (
    <div>
      <Link to="/settings">Settings</Link>
      <Link to="/workspace">Workspace</Link>
      <Routes>
        <Route path="settings" element={<DirtySettings />} />
        <Route path="workspace" element={<div>Workspace page</div>} />
      </Routes>
    </div>
  )
}

function renderApp(initial = '/settings') {
  const router = createMemoryRouter([{ path: '*', element: <Shell /> }], { initialEntries: [initial] })
  return render(<RouterProvider router={router} />)
}

describe('useUnsavedNavigation', () => {
  it('prompts before leaving a dirty settings page and stays on cancel', async () => {
    renderApp()
    fireEvent.change(screen.getByLabelText('notes'), { target: { value: 'draft' } })
    fireEvent.click(screen.getByRole('link', { name: 'Workspace' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Leave without saving?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Stay on page' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Workspace page')).not.toBeInTheDocument()
    expect(screen.getByLabelText('notes')).toHaveValue('draft')
  })

  it('leaves after confirming the unsaved-changes dialog', async () => {
    renderApp()
    fireEvent.change(screen.getByLabelText('notes'), { target: { value: 'draft' } })
    fireEvent.click(screen.getByRole('link', { name: 'Workspace' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }))

    expect(await screen.findByText('Workspace page')).toBeInTheDocument()
  })

  it('does not prompt when there are no unsaved changes', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('link', { name: 'Workspace' }))

    expect(await screen.findByText('Workspace page')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
