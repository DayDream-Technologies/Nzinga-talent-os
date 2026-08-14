import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { filterAgencyNav } from '@/constants/agency-nav'
import { T } from '@/lib/tokens'

const REPORT_ICONS: Record<string, string> = {
  'Roster & Booking Reports': '📊',
  'Receivables & Commissions': '💵',
  'Payables & Talent Disbursals': '📤',
}

const iconBgs = ['#dbeafe', '#bfdbfe', '#93c5fd', '#3b82f6']

/**
 * Role-scoped reports hub — lists only report groups/items the user can open.
 * Deep links still go to individual report modules.
 */
export function AgencyReportsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  const reportCat = filterAgencyNav(user.role).find((c) => c.id === 'reports')
  const groups = reportCat?.groups ?? []

  return (
    <div
      style={{
        padding: '22px 26px',
        flex: 1,
        overflowY: 'auto',
        minHeight: '100%',
        background: '#e8eef5',
        backgroundImage:
          'radial-gradient(circle at 15% 85%, rgba(59,130,246,0.06) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(0,45,86,0.04) 0%, transparent 40%)',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.t1, margin: 0 }}>My Reports</h1>
        <p style={{ fontSize: 13, color: T.t3, marginTop: 4 }}>
          Reports available for your role.
        </p>
      </div>

      {groups.length === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid #dce4ed',
            borderRadius: 10,
            padding: 28,
            textAlign: 'center',
            color: T.t3,
            fontSize: 13,
          }}
        >
          No reports are available for your role.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 14,
          }}
        >
          {groups.map((group, idx) => (
            <div
              key={group.label}
              style={{
                background: '#fff',
                border: '1px solid #dce4ed',
                borderRadius: 10,
                boxShadow: '0 2px 10px rgba(0,45,86,0.07)',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: iconBgs[idx % iconBgs.length],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                  }}
                >
                  {REPORT_ICONS[group.label] || '📊'}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>{group.label}</span>
              </div>
              {group.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/${item.path}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/${item.path}`)}
                  style={{
                    fontSize: 13,
                    color: T.blue,
                    cursor: 'pointer',
                    padding: '5px 0 5px 36px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
