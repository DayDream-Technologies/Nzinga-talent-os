export type ExportFormat = 'pdf' | 'excel' | 'markdown' | 'text' | 'html'

function download(filename: string, mime: string, body: string) {
  const blob = new Blob([body], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function escapePdf(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function simplePdf(title: string, lines: string[]) {
  const content = ['BT', '/F1 12 Tf', '72 740 Td', `(${escapePdf(title)}) Tj`]
  lines.slice(0, 40).forEach((line) => {
    content.push('0 -16 Td', `(${escapePdf(line.slice(0, 90))}) Tj`)
  })
  content.push('ET')
  const stream = content.join('\n')
  const objects = [
    '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
    '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
    `3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj`,
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj`,
    '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj',
  ]
  let body = '%PDF-1.4\n'
  const offsets = [0]
  for (const obj of objects) {
    offsets.push(body.length)
    body += obj + '\n'
  }
  const xref = body.length
  body += `xref\n0 ${objects.length + 1}\n`
  body += '0000000000 65535 f \n'
  for (let i = 1; i < offsets.length; i++) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return body
}

export function reportLinesFromElement(root: HTMLElement | null): string[] {
  if (!root) return []
  const text = root.innerText || ''
  return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

function textOf(el: Element): string {
  const inner = el instanceof HTMLElement && typeof el.innerText === 'string' ? el.innerText : ''
  if (inner.trim()) return inner.replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').trim()
  const blocks = [...el.children].filter((child) => !child.matches('button, input, select, textarea, script, style'))
  if (blocks.length > 0) return blocks.map((child) => textOf(child)).filter(Boolean).join('\n')
  return (el.textContent || '').replace(/\s+/g, ' ').trim()
}

function linesOf(el: Element): string[] {
  return textOf(el)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function cellText(cell: Element): string {
  const copy = cell.cloneNode(true) as HTMLElement
  copy.querySelectorAll('button, input, select, textarea, script, style').forEach((node) => node.remove())
  return (copy.textContent || '').replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|')
}

function dropEmptyColumns(matrix: string[][]): string[][] {
  if (!matrix.length) return matrix
  const width = Math.max(...matrix.map((row) => row.length))
  const keep: number[] = []
  for (let col = 0; col < width; col++) {
    if (matrix.some((row) => (row[col] || '').trim())) keep.push(col)
  }
  return matrix.map((row) => keep.map((col) => row[col] || ''))
}

function tableToMarkdown(table: HTMLTableElement): string {
  const headRow = table.tHead?.rows[0]
  const body = [...table.tBodies].flatMap((section) => [...section.rows])
  const rows = headRow ? [headRow, ...body] : [...table.rows]
  const matrix = dropEmptyColumns(rows.map((row) => [...row.cells].map(cellText))).filter((row) => row.some(Boolean))
  if (!matrix.length) return ''
  const width = Math.max(...matrix.map((row) => row.length))
  const padded = matrix.map((row) => {
    const copy = [...row]
    while (copy.length < width) copy.push('')
    return copy
  })
  const [header, ...rest] = padded
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`
  return [line(header), `| ${header.map(() => '---').join(' | ')} |`, ...rest.map(line)].join('\n')
}

const SKIPPED = 'button, input, select, textarea, script, style'

function isSkipped(el: Element): boolean {
  return el.matches(SKIPPED)
}

function isPlainLabel(el: Element): boolean {
  if (isSkipped(el) || el.children.length > 0) return false
  const text = textOf(el)
  return text.length > 0 && text.length <= 80 && !text.includes('\n')
}

function isStatBlock(el: Element): boolean {
  if (el.querySelector('table, h1, h2, h3, h4, p, button')) return false
  const lines = linesOf(el)
  const kids = [...el.children].filter((child) => !isSkipped(child))
  return lines.length === 2 && lines.every((line) => line.length <= 80) && kids.length > 0 && kids.length <= 3
}

function walk(el: Element, out: string[]) {
  if (isSkipped(el)) return
  if (el.tagName === 'TABLE') {
    const markdown = tableToMarkdown(el as HTMLTableElement)
    if (markdown) out.push(markdown, '')
    return
  }
  if (/^H[1-6]$/.test(el.tagName)) {
    const text = textOf(el).replace(/\s+/g, ' ')
    if (text) out.push(`${'#'.repeat(Number(el.tagName[1]))} ${text}`, '')
    return
  }
  if (el.tagName === 'P') {
    const text = textOf(el).replace(/\s+/g, ' ')
    if (text) out.push(text, '')
    return
  }
  if (isStatBlock(el)) {
    const [first, second] = linesOf(el)
    out.push(`**${first}** — ${second}`, '')
    return
  }

  const kids = [...el.children].filter((child) => !isSkipped(child))
  if (kids.length === 0) {
    const text = textOf(el).replace(/\s+/g, ' ')
    if (text) out.push(text, '')
    return
  }

  for (let i = 0; i < kids.length; i++) {
    const kid = kids[i]
    const next = kids[i + 1]
    if (isPlainLabel(kid) && next?.querySelector('table')) {
      out.push(`## ${textOf(kid).replace(/\s+/g, ' ')}`, '')
      continue
    }
    walk(kid, out)
  }
}

/** Readable report document. Tables stay tables; stat cards stay label/value pairs. */
export function reportMarkdownFromElement(root: HTMLElement | null, title: string): string {
  const out: string[] = []
  if (root) walk(root, out)
  const body = out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!body) return `# ${title}\n\nNo report data.\n`
  if (!body.startsWith('#')) return `# ${title}\n\n${body}\n`
  return `${body}\n`
}

function readableFromLines(title: string, lines: string[]): string {
  const body = lines.map((line) => line.trim()).filter(Boolean)
  if (!body.length) return `# ${title}\n\nNo report data.\n`
  return `# ${title}\n\n${body.join('\n\n')}\n`
}

export function downloadReport(
  title: string,
  lines: string[],
  format: ExportFormat,
  root?: HTMLElement | null,
) {
  const safe = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report'
  const readable = root ? reportMarkdownFromElement(root, title) : readableFromLines(title, lines)
  if (format === 'markdown') {
    download(`${safe}.md`, 'text/markdown', readable)
    return
  }
  if (format === 'text') {
    download(`${safe}.txt`, 'text/plain', readable)
    return
  }
  if (format === 'html') {
    const rows = lines.map((l) => `<li>${l.replace(/</g, '&lt;')}</li>`).join('')
    download(`${safe}.html`, 'text/html', `<!doctype html><title>${title}</title><h1>${title}</h1><ul>${rows}</ul>`)
    return
  }
  if (format === 'excel') {
    const rows = lines.map((l) => `<tr><td>${l.replace(/</g, '&lt;')}</td></tr>`).join('')
    download(`${safe}.xls`, 'application/vnd.ms-excel', `<table><tr><th>${title}</th></tr>${rows}</table>`)
    return
  }
  download(`${safe}.pdf`, 'application/pdf', simplePdf(title, lines))
}
