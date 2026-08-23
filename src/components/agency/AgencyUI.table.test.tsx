import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SelectAllCheckbox, Table } from '@/components/agency/AgencyUI'

describe('Table row click and select-all', () => {
  it('opens a row when clicking the row body, but not when clicking a checkbox', () => {
    const onRowClick = vi.fn()
    render(
      <Table
        headers={['', 'Name']}
        onRowClick={onRowClick}
        rows={[
          [
            <input key="c" type="checkbox" aria-label="Select Maya" onClick={(e) => e.stopPropagation()} />,
            'Maya Chen',
          ],
        ]}
      />,
    )

    fireEvent.click(screen.getByText('Maya Chen'))
    expect(onRowClick).toHaveBeenCalledWith(0)

    onRowClick.mockClear()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Maya' }))
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('selects and clears all rows from the header checkbox', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Table
        headers={['', 'Name']}
        selectAll={<SelectAllCheckbox checked={false} indeterminate={false} onChange={onChange} />}
        rows={[['x', 'One']]}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }))
    expect(onChange).toHaveBeenCalledWith(true)

    rerender(
      <Table
        headers={['', 'Name']}
        selectAll={<SelectAllCheckbox checked onChange={onChange} />}
        rows={[['x', 'One']]}
      />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }))
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
