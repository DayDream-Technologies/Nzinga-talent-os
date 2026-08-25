import { Link } from 'react-router-dom'
import { STAGE_COLORS, STAGE_LABELS } from '@/types/stages'
import { TMXLogo } from '@/components/branding'
import { portalCard, portalMuted, useTalentPortalPrefs } from '@/components/talent-portal/TalentPortalShell'
import { useTalentPortal } from '@/hooks/useTalentPortal'
import { useResolvedImageUrl } from '@/hooks/useResolvedImageUrl'
import { isImageDoc, resolveProfilePhoto } from '@/lib/profile-photo'
import {
  agentContact,
  belongingToTalent,
  formatMoney,
  invoiceCommission,
  talentCalendarItems,
  trustBalance,
} from '@/lib/talent-portal'

export function TalentHomePage() {
  const {
    profile,
    talent,
    displayName,
    prospect,
    rosterTalent,
    invoices,
    tickets,
    calendar,
    appointments,
    escrow,
  } = useTalentPortal()
  const { prefs } = useTalentPortalPrefs()
  const photo = resolveProfilePhoto({
    pipelineTalent: talent,
    rosterTalent,
    prospect,
  })
  const photoUrl = useResolvedImageUrl(photo)
  if (!profile || !talent) return null

  const stageColor = STAGE_COLORS[talent.stage] ?? '#6b7280'
  const stageLabel = STAGE_LABELS[talent.stage] ?? talent.stage
  const agent = agentContact(prospect)
  const mineInvoices = belongingToTalent(invoices, displayName, (i) => [i.talentName])
  const openTickets = belongingToTalent(tickets, displayName, (t) => [t.talentName]).filter(
    (t) => t.status === 'open' || t.status === 'in_progress',
  )
  const cal = talentCalendarItems({
    name: displayName,
    calendar,
    appointments,
    invoices: mineInvoices,
    bookedDates: rosterTalent?.bookedDates || [],
  })
  const nextEvent = cal.find((item) => item.date >= new Date().toISOString().slice(0, 10)) || cal[0]
  const outstanding = mineInvoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + invoiceCommission(inv).talentShare, 0)
  const trust = trustBalance(escrow, displayName)

  const tiles = [
    { to: '/talent/activity', label: 'Career activity', value: cal.filter((i) => i.kind === 'Shoot').length, hint: 'confirmed shoots' },
    { to: '/talent/money', label: 'Talent share outstanding', value: formatMoney(outstanding), hint: 'unpaid bookings' },
    { to: '/talent/money', label: 'Trust account', value: formatMoney(trust), hint: 'held for you' },
    { to: '/talent/messages', label: 'Open updates', value: openTickets.length, hint: 'requests & opportunities' },
  ]

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <TMXLogo size="sm" theme={prefs.theme} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          {photo && isImageDoc(photo) && photoUrl ? (
            <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            displayName
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() || '')
              .join('')
          )}
        </div>
        <div>
          <h1 style={{ fontFamily: "'Syne', 'Outfit', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Welcome, {displayName}
          </h1>
          <p style={{ color: portalMuted, fontSize: 14, margin: '6px 0 0' }}>
            Talent dashboard · {talent.account_number || 'Account'} · Agent {agent.name}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 999,
          background: `${stageColor}22`,
          border: `1px solid ${stageColor}66`,
          color: stageColor,
          fontSize: 13,
          fontWeight: 600,
          margin: '16px 0 22px',
        }}
      >
        {stageLabel}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.to} style={{ ...portalCard, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: 11, color: portalMuted, fontWeight: 600 }}>{tile.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 4px' }}>{tile.value}</div>
            <div style={{ fontSize: 12, color: portalMuted }}>{tile.hint}</div>
          </Link>
        ))}
      </div>

      <section style={portalCard}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px' }}>Up next</h2>
        {nextEvent ? (
          <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>
            <strong>{nextEvent.kind}</strong> · {nextEvent.title} · {nextEvent.date}
            {nextEvent.detail ? ` · ${nextEvent.detail}` : ''}
          </p>
        ) : (
          <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>No upcoming shoots, meetings, or deadlines on your calendar.</p>
        )}
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link to="/talent/activity" style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
            Open calendar →
          </Link>
          <Link to="/talent/files" style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
            Contracts & assets →
          </Link>
          <Link to="/talent/messages" style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
            Email {agent.name} →
          </Link>
          <Link to="/talent/settings" style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
            Settings →
          </Link>
        </div>
      </section>
    </>
  )
}
