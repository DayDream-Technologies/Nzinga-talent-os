import { useRef, useState, type ReactNode } from 'react'
import { Btn, Card, Field, ModalShell, Panel, inputStyle } from '@/components/agency/AgencyUI'
import { downloadReport, reportLinesFromElement, type ExportFormat } from '@/lib/report-export'
import { useViewport } from '@/hooks/useViewport'
import { staffGridColumns } from '@/lib/viewport'
import { T } from '@/lib/tokens'

export interface ReportParam {
  id: string
  label: string
  type?: 'text' | 'date' | 'select'
  options?: string[]
  value: string
}

export function ReportLauncher({
  title,
  subtitle,
  params,
  onChange,
  onRun,
  ran,
  children,
  kpis,
}: {
  title: string
  subtitle: string
  params: ReportParam[]
  onChange: (id: string, value: string) => void
  onRun: () => void
  ran: boolean
  children: ReactNode
  kpis?: { label: string; value: ReactNode }[]
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [otherOpen, setOtherOpen] = useState(false)
  const [picked, setPicked] = useState<ExportFormat[]>(['pdf'])
  const reportRef = useRef<HTMLDivElement>(null)
  const band = useViewport()

  function exportAs(format: ExportFormat) {
    downloadReport(title, reportLinesFromElement(reportRef.current), format)
  }

  return (
    <Panel
      title={title}
      subtitle={subtitle}
      actions={
        ran ? (
          <Btn variant="secondary" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? 'Edit parameters' : 'Hide parameters'}
          </Btn>
        ) : null
      }
    >
      {(!ran || !collapsed) && (
        <Card style={{ marginBottom: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: staffGridColumns(band, 'repeat(auto-fit, minmax(180px, 1fr))'),
              gap: 10,
            }}
          >
            {params.map((p) => (
              <Field key={p.id} label={p.label}>
                {p.type === 'select' ? (
                  <select value={p.value} onChange={(e) => onChange(p.id, e.target.value)} style={inputStyle}>
                    {(p.options || []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={p.type === 'date' ? 'date' : 'text'}
                    value={p.value}
                    onChange={(e) => onChange(p.id, e.target.value)}
                    style={inputStyle}
                  />
                )}
              </Field>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <Btn onClick={onRun}>Run Live View</Btn>
          </div>
        </Card>
      )}
      {ran && kpis && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: 14,
          }}
        >
          {kpis.map((k) => (
            <Card key={k.label}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.t1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: T.t3 }}>{k.label}</div>
            </Card>
          ))}
        </div>
      )}
      {ran && <div ref={reportRef}>{children}</div>}
      {ran && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: T.t3, alignSelf: 'center' }}>Generate as</span>
          <Btn variant="secondary" onClick={() => exportAs('pdf')}>PDF</Btn>
          <Btn variant="secondary" onClick={() => exportAs('excel')}>Excel</Btn>
          <Btn variant="secondary" onClick={() => { exportAs('pdf'); exportAs('excel') }}>PDF & Excel</Btn>
          <Btn variant="secondary" onClick={() => setOtherOpen(true)}>Other Formats</Btn>
        </div>
      )}
      {otherOpen && (
        <ModalShell title="Report Formats" onClose={() => setOtherOpen(false)} width={360}>
          {(['pdf', 'excel', 'csv', 'text', 'html'] as ExportFormat[]).map((format) => (
            <label key={format} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={picked.includes(format)}
                onChange={(e) =>
                  setPicked((prev) => (e.target.checked ? [...prev, format] : prev.filter((f) => f !== format)))
                }
              />
              {format.toUpperCase()}
            </label>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setOtherOpen(false)}>Cancel</Btn>
            <Btn
              onClick={() => {
                picked.forEach((format) => exportAs(format))
                setOtherOpen(false)
              }}
            >
              Generate
            </Btn>
          </div>
        </ModalShell>
      )}
    </Panel>
  )
}
