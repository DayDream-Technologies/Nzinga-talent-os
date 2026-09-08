import { T } from '@/lib/tokens'
import { INTEGRATION_LABELS, integrationMessage, type IntegrationId } from '@/lib/integrations'

export function IntegrationNotice({
  id,
  compact,
  audience = 'staff',
}: {
  id: IntegrationId
  compact?: boolean
  audience?: 'staff' | 'public'
}) {
  return (
    <div
      role="status"
      style={{
        background: T.amberL,
        border: `1px solid ${T.amber}44`,
        color: T.t1,
        borderRadius: 8,
        padding: compact ? '8px 10px' : '12px 14px',
        fontSize: 13,
        marginBottom: 12,
      }}
    >
      <div style={{ fontWeight: 800, color: T.amber, letterSpacing: '0.04em', fontSize: compact ? 11 : 12, marginBottom: compact ? 2 : 4 }}>
        COMING SOON
      </div>
      {!compact && audience === 'staff' && (
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{INTEGRATION_LABELS[id]}</div>
      )}
      {integrationMessage(id, audience)}
    </div>
  )
}
