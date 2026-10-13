import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { wrapReport } from '@/components/agency/ReportWrappers'
import { downloadReport, reportMarkdownFromElement } from '@/lib/report-export'

function sampleReport(): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = `
    <h1>Roster Openings</h1>
    <div>Semester 2026-Jul-Dec. Capacity resets each January and July.</div>
    <div>
      <div>12</div>
      <div>Active roster</div>
    </div>
    <div>
      <div>Pipeline log</div>
      <div>
        <table>
          <thead><tr><th>Division</th><th>Filled</th><th></th></tr></thead>
          <tbody>
            <tr><td>Modeling</td><td>4</td><td><button>Approve</button></td></tr>
            <tr><td>Acting</td><td>1</td><td><button>Approve</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
  return root
}

describe('reportMarkdownFromElement', () => {
  it('writes headings, stat cards, and tables as readable markdown', () => {
    const markdown = reportMarkdownFromElement(sampleReport(), 'Roster Openings')
    expect(markdown).toContain('# Roster Openings')
    expect(markdown).toContain('Semester 2026-Jul-Dec')
    expect(markdown).toContain('**12** — Active roster')
    expect(markdown).toContain('## Pipeline log')
    expect(markdown).toContain('| Division | Filled |')
    expect(markdown).toContain('| Modeling | 4 |')
    expect(markdown).toContain('| Acting | 1 |')
    expect(markdown).not.toContain('Approve')
    expect(markdown).not.toContain('"line"')
    expect(markdown).not.toMatch(/function\s+\w+/)
  })

  it('uses the title when the report element is empty', () => {
    const markdown = reportMarkdownFromElement(document.createElement('div'), 'Escrow Balances')
    expect(markdown).toBe('# Escrow Balances\n\nNo report data.\n')
  })
})

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

function captureDownloads() {
  const files: { name: string; body: Promise<string>; type: string }[] = []
  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: () => '' })
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: () => {} })
  }
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    files.push({ name: '', body: readBlob(blob as Blob), type: (blob as Blob).type })
    return 'blob:report'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    files[files.length - 1].name = this.download
  })
  return files
}

describe('downloadReport', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('saves a markdown file instead of a csv of quoted lines', async () => {
    const files = captureDownloads()

    downloadReport('Roster Openings', ['ignore'], 'markdown', sampleReport())

    expect(files[0].name).toBe('roster-openings.md')
    expect(files[0].type).toContain('text/markdown')
    const body = await files[0].body
    expect(body).toContain('# Roster Openings')
    expect(body).toContain('| Modeling | 4 |')
    expect(body).not.toMatch(/^"line"/m)
  })
})

describe('report download button', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('downloads the on-screen report as markdown', async () => {
    const files = captureDownloads()

    render(
      wrapReport(
        <div>
          <h1>Gross Bookings</h1>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Gross</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Northwind</td>
                <td>$2,800</td>
              </tr>
            </tbody>
          </table>
        </div>,
        'Gross Bookings',
        '20/80 agency vs talent split.',
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Markdown' }))
    expect(files[0].name).toBe('gross-bookings.md')
    expect(await files[0].body).toContain('| Northwind | $2,800 |')
    expect(screen.queryByRole('button', { name: 'CSV' })).not.toBeInTheDocument()
  })
})
