import { useState } from 'react'
import { T } from '@/lib/tokens'
import { useViewport } from '@/hooks/useViewport'

export type QuickActionId =
  | 'view-profile'
  | 'stage-status'
  | 'assigned-team'
  | 'screening-status'
  | 'add-agreement'
  | 'send-renewal'
  | 'initiate-screening'
  | 'add-issue'
  | 'add-note'
  | 'add-call'
  | 'add-meeting'
  | 'log-email'
  | 'add-appointment'
  | 'add-task'
  | 'add-charge'
  | 'add-payment'
  | 'add-payout'
  | 'related-invoices'
  | 'related-contracts'
  | 'related-screenings'
  | 'send-email'
  | 'send-sms'
  | 'send-dochub'
  | 'export-profile'
  | 'export-ledger'
  | 'export-history'
  | 'export-contract'
  | 'portal-access'
  | 'notifications'
  | 'payment-settings'

const ICONS: { id: string; tip: string; glyph: string; groups: { heading: string; items: { id: QuickActionId; label: string }[] }[] }[] = [
  {
    id: 'nav',
    tip: 'Quick View / Stages',
    glyph: '☰',
    groups: [
      {
        heading: 'Profile',
        items: [
          { id: 'view-profile', label: 'View Talent Profile' },
          { id: 'stage-status', label: 'Stage Status & Lifecycle' },
          { id: 'assigned-team', label: 'Assigned Team' },
          { id: 'screening-status', label: 'Background & Screening Status' },
        ],
      },
    ],
  },
  {
    id: 'add',
    tip: 'Quick Add',
    glyph: '+',
    groups: [
      {
        heading: 'Talent Info',
        items: [
          { id: 'add-agreement', label: 'Add Representation Agreement' },
          { id: 'send-renewal', label: 'Send Renewal' },
          { id: 'initiate-screening', label: 'Initiate Screening' },
          { id: 'add-issue', label: 'Log Issue / Concern' },
        ],
      },
      {
        heading: 'History / Note',
        items: [
          { id: 'add-note', label: 'Add Note' },
          { id: 'add-call', label: 'Add Phone Call' },
          { id: 'add-meeting', label: 'Add Meeting' },
          { id: 'log-email', label: 'Log Email / SMS' },
        ],
      },
      {
        heading: 'Scheduling',
        items: [
          { id: 'add-appointment', label: 'Add Appointment' },
          { id: 'add-task', label: 'Add Audition / Booking Task' },
        ],
      },
      {
        heading: 'Financial',
        items: [
          { id: 'add-charge', label: 'Add Charge' },
          { id: 'add-payment', label: 'Add Payment' },
          { id: 'add-payout', label: 'Add Payout / Commission' },
        ],
      },
    ],
  },
  {
    id: 'related',
    tip: 'Related Records',
    glyph: '⧉',
    groups: [
      {
        heading: 'Linked',
        items: [
          { id: 'related-invoices', label: 'Invoices & Ledger' },
          { id: 'related-contracts', label: 'Signed Contracts & DocHub Documents' },
          { id: 'related-screenings', label: 'Screenings & Background Checks' },
        ],
      },
    ],
  },
  {
    id: 'send',
    tip: 'Send Direct Message',
    glyph: '✉',
    groups: [
      {
        heading: 'Send',
        items: [
          { id: 'send-email', label: 'Send Individual Email' },
          { id: 'send-sms', label: 'Send SMS / Text' },
          { id: 'send-dochub', label: 'Send DocHub Document Request' },
        ],
      },
    ],
  },
  {
    id: 'reports',
    tip: 'Reports',
    glyph: '▤',
    groups: [
      {
        heading: 'Exports',
        items: [
          { id: 'export-profile', label: 'Talent Profile Sheet (PDF)' },
          { id: 'export-ledger', label: 'Account Ledger Statement' },
          { id: 'export-history', label: 'Activity / History Export' },
          { id: 'export-contract', label: 'Contract Summary' },
        ],
      },
    ],
  },
  {
    id: 'settings',
    tip: 'Settings',
    glyph: '⚙',
    groups: [
      {
        heading: 'Settings',
        items: [
          { id: 'portal-access', label: 'Talent Portal Access Settings' },
          { id: 'notifications', label: 'Notification Preferences' },
          { id: 'payment-settings', label: 'Payment / Direct Deposit Settings' },
        ],
      },
    ],
  },
]

export function QuickActionBar({ onAction }: { onAction: (id: QuickActionId) => void }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const mobile = useViewport() === 'mobile'

  return (
    <aside
      aria-label="Quick actions"
      style={
        mobile
          ? {
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 40,
              background: T.navBg,
              borderTop: `1px solid ${T.navBorder}`,
              padding: '6px 8px',
              paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-around',
              gap: 4,
            }
          : {
              position: 'sticky',
              top: 12,
              alignSelf: 'flex-start',
              width: 48,
              flexShrink: 0,
              background: T.navBg,
              border: `1px solid ${T.navBorder}`,
              borderRadius: 10,
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              zIndex: 20,
            }
      }
    >
      {ICONS.map((icon) => (
        <div key={icon.id} style={{ position: 'relative' }}>
          <button
            type="button"
            title={icon.tip}
            onClick={() => setOpenId((cur) => (cur === icon.id ? null : icon.id))}
            style={{
              width: mobile ? 44 : 40,
              height: mobile ? 44 : 40,
              borderRadius: 8,
              border: 'none',
              background: openId === icon.id ? T.blue : 'transparent',
              color: openId === icon.id ? '#fff' : '#e2e8f0',
              cursor: 'pointer',
              fontSize: 16,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 2px ${T.orange}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {icon.glyph}
          </button>
          {openId === icon.id && (
            <div
              style={{
                position: 'absolute',
                right: mobile ? 0 : 52,
                left: mobile ? 0 : undefined,
                top: mobile ? undefined : 0,
                bottom: mobile ? 52 : undefined,
                width: mobile ? 'min(280px, calc(100vw - 24px))' : 260,
                maxHeight: mobile ? '60vh' : undefined,
                overflowY: mobile ? 'auto' : undefined,
                background: T.elevatedBg,
                border: `1px solid ${T.cardBorder}`,
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                padding: 10,
                zIndex: 50,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: T.orange, marginBottom: 6 }}>{icon.tip}</div>
              {icon.groups.map((g) => (
                <div key={g.heading} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {g.heading}
                  </div>
                  {g.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onAction(item.id)
                        setOpenId(null)
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        padding: '10px 4px',
                        minHeight: 44,
                        cursor: 'pointer',
                        fontSize: 12,
                        color: T.t1,
                        fontFamily: 'inherit',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  )
}
