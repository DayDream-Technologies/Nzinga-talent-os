import { useState, type ReactNode } from 'react'
import { Btn, Card, Field, inputStyle } from '@/components/agency/AgencyUI'
import { useViewport } from '@/hooks/useViewport'
import { staffGridColumns } from '@/lib/viewport'

export function wrapReport(inner: ReactNode, _title: string, _subtitle: string) {
  return <LaunchedReport>{inner}</LaunchedReport>
}

function LaunchedReport({ children }: { children: ReactNode }) {
  const [params, setParams] = useState({ division: 'All', from: '', to: '' })
  const [collapsed, setCollapsed] = useState(false)
  const band = useViewport()
  return (
    <>
      {!collapsed && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: staffGridColumns(band, 'repeat(auto-fit, minmax(180px, 1fr))'), gap: 10 }}>
            <Field label="Division">
              <select value={params.division} onChange={(e) => setParams((p) => ({ ...p, division: e.target.value }))} style={inputStyle}>
                {['All', 'Modeling', 'Acting', 'Commercial', 'Sports'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="From">
              <input type="date" value={params.from} onChange={(e) => setParams((p) => ({ ...p, from: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="To">
              <input type="date" value={params.to} onChange={(e) => setParams((p) => ({ ...p, to: e.target.value }))} style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <Btn onClick={() => setCollapsed(true)}>Run Live View</Btn>
            <Btn variant="secondary" onClick={() => window.print()}>
              PDF
            </Btn>
            <Btn variant="secondary">Excel</Btn>
          </div>
        </Card>
      )}
      {collapsed && (
        <div style={{ marginBottom: 10 }}>
          <Btn variant="secondary" onClick={() => setCollapsed(false)}>
            Edit parameters
          </Btn>
        </div>
      )}
      {children}
    </>
  )
}
