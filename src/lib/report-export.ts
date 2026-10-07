export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'text' | 'html'

function download(filename: string, mime: string, body: string) {
  const blob = new Blob([body], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
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

export function downloadReport(title: string, lines: string[], format: ExportFormat) {
  const safe = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report'
  if (format === 'csv') {
    download(`${safe}.csv`, 'text/csv', ['line', ...lines].map((l) => `"${l.replace(/"/g, '""')}"`).join('\n'))
    return
  }
  if (format === 'text') {
    download(`${safe}.txt`, 'text/plain', [title, ...lines].join('\n'))
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
