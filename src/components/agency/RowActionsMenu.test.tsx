import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MENU_OVERLAY_Z, RowActionsMenu } from '@/components/agency/RowActionsMenu'

describe('RowActionsMenu', () => {
  it('renders the menu in a body portal above the table with a high z-index', () => {
    render(
      <div style={{ overflow: 'auto', height: 80 }}>
        <table>
          <tbody>
            <tr>
              <td>
                <RowActionsMenu
                  items={[{ id: 'email', label: 'Send Email', onClick: () => undefined }]}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Row actions' }))

    const menu = screen.getByRole('menu')
    expect(document.body.contains(menu)).toBe(true)
    expect(menu.parentElement).toBe(document.body)
    expect(menu.style.position).toBe('fixed')
    expect(menu.style.zIndex).toBe(String(MENU_OVERLAY_Z))
    expect(Number(menu.style.zIndex)).toBeGreaterThan(100)
    expect(screen.getByRole('menuitem', { name: 'Send Email' })).toBeInTheDocument()
  })
})
