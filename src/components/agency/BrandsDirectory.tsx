import { useState } from 'react'
import { Badge, Btn, Card, Field, ModalShell, Panel, Table, inputStyle } from '@/components/agency/AgencyUI'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { sendDocHubContract } from '@/lib/dochub'
import { isDocHubConnected, isStripeConnected } from '@/lib/integrations'
import { T } from '@/lib/tokens'
import type { BrandAccount } from '@/types/agency'

const SEED_BRANDS: BrandAccount[] = [
  { id: 'br_nike', name: 'Nike', contactName: 'John Doe', email: 'john@nike.com', phone: '404-555-0100', division: 'Commercial', openBalance: 10000, activeProjects: 2, portalStatus: 'active' },
  { id: 'br_sephora', name: 'Sephora', contactName: 'Amina Cole', email: 'amina@sephora.com', division: 'Modeling', openBalance: 0, activeProjects: 1, portalStatus: 'pending' },
]

export function BrandsDirectoryModule() {
  const [brand, setBrand] = useState<BrandAccount | null>(null)
  const connected = isDocHubConnected()
  return (
    <Panel
      title="Brands"
      subtitle="Corporate clients. Send Portal Access invites brand reps to /client."
      actions={<Btn onClick={() => window.open('/client/login', '_blank')}>Open brand portal</Btn>}
    >
      {!isStripeConnected() && <IntegrationNotice id="stripe" />}
      {!connected && <IntegrationNotice id="dochub" compact />}
      <Card>
        <Table
          headers={['Brand', 'Primary contact', 'Active projects', 'Open balance', 'Portal', '']}
          rows={SEED_BRANDS.map((b) => [
            b.name,
            `${b.contactName} · ${b.email}`,
            String(b.activeProjects),
            `$${b.openBalance.toLocaleString()}`,
            <Badge key={b.id} color={b.portalStatus === 'active' ? T.green : T.amber}>
              {b.portalStatus}
            </Badge>,
            <span key={`a-${b.id}`} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn variant="secondary" onClick={() => window.open('/client/login', '_blank')}>
                Send Portal Access
              </Btn>
              <Btn disabled={!connected} onClick={() => setBrand(b)}>
                Send usage agreement
              </Btn>
            </span>,
          ])}
        />
      </Card>
      {brand && <UsageAgreementModal brand={brand} onClose={() => setBrand(null)} />}
    </Panel>
  )
}

function UsageAgreementModal({ brand, onClose }: { brand: BrandAccount; onClose: () => void }) {
  const [project, setProject] = useState('')
  const [shootDates, setShootDates] = useState('')
  const [guarantee, setGuarantee] = useState('')
  const [usageTerm, setUsageTerm] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const ready = project.trim() && shootDates.trim() && guarantee.trim() && usageTerm.trim()

  return (
    <ModalShell title={`Usage agreement · ${brand.name}`} onClose={onClose} width={520}>
      <Field label="Project">
        <input style={inputStyle} value={project} onChange={(e) => setProject(e.target.value)} />
      </Field>
      <Field label="Shoot dates">
        <input style={inputStyle} value={shootDates} onChange={(e) => setShootDates(e.target.value)} />
      </Field>
      <Field label="Guarantee">
        <input style={inputStyle} value={guarantee} onChange={(e) => setGuarantee(e.target.value)} />
      </Field>
      <Field label="Usage term">
        <input style={inputStyle} value={usageTerm} onChange={(e) => setUsageTerm(e.target.value)} />
      </Field>
      {error && <div style={{ color: T.red, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          disabled={!ready || sending}
          onClick={() => {
            void (async () => {
              setSending(true)
              setError('')
              const title = `Usage agreement · ${brand.name} · ${project.trim()}`
              const html = `<!doctype html><html><body><h1>${escapeHtml(title)}</h1><p>Brand: ${escapeHtml(brand.name)}</p><p>Contact: ${escapeHtml(brand.contactName)} (${escapeHtml(brand.email)})</p><p>Project: ${escapeHtml(project)}</p><p>Shoot dates: ${escapeHtml(shootDates)}</p><p>Guarantee: ${escapeHtml(guarantee)}</p><p>Usage term: ${escapeHtml(usageTerm)}</p></body></html>`
              const sent = await sendDocHubContract({
                contractId: `usage_${brand.id}_${Date.now()}`,
                kind: 'usage',
                title,
                signerName: brand.contactName,
                signerEmail: brand.email,
                html,
                filename: 'usage-agreement.html',
                contentType: 'text/html',
              })
              setSending(false)
              if (!sent.ok) {
                setError(sent.error)
                return
              }
              onClose()
            })()
          }}
        >
          {sending ? 'Sending…' : 'Send for signature'}
        </Btn>
      </div>
    </ModalShell>
  )
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
