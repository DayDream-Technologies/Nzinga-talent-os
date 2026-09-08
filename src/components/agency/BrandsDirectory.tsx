import { Badge, Btn, Card, Panel, Table } from '@/components/agency/AgencyUI'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { isStripeConnected } from '@/lib/integrations'
import { T } from '@/lib/tokens'
import type { BrandAccount } from '@/types/agency'

const SEED_BRANDS: BrandAccount[] = [
  { id: 'br_nike', name: 'Nike', contactName: 'John Doe', email: 'john@nike.com', phone: '404-555-0100', division: 'Commercial', openBalance: 10000, activeProjects: 2, portalStatus: 'active' },
  { id: 'br_sephora', name: 'Sephora', contactName: 'Amina Cole', email: 'amina@sephora.com', division: 'Modeling', openBalance: 0, activeProjects: 1, portalStatus: 'pending' },
]

export function BrandsDirectoryModule() {
  return (
    <Panel
      title="Brands"
      subtitle="Corporate clients. Send Portal Access invites brand reps to /client."
      actions={<Btn onClick={() => window.open('/client/login', '_blank')}>Open brand portal</Btn>}
    >
      {!isStripeConnected() && <IntegrationNotice id="stripe" />}
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
            <Btn key={`a-${b.id}`} variant="secondary" onClick={() => window.open('/client/login', '_blank')}>
              Send Portal Access
            </Btn>,
          ])}
        />
      </Card>
    </Panel>
  )
}
