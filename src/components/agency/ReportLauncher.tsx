import { useState, type ReactNode } from 'react'
import { Btn, Card, Field, Panel, inputStyle } from '@/components/agency/AgencyUI'
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
  const band = useViewport()

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
            <Btn variant="secondary" onClick={() => window.print()}>
              PDF
            </Btn>
            <Btn variant="secondary" onClick={onRun}>
              Excel
            </Btn>
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
      {ran && children}
    </Panel>
  )
}
