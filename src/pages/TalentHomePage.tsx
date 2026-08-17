import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { PLATFORM_BRAND } from '@/constants/company-branding'
import { REQUIRED_DOCS } from '@/constants/stages'
import { STAGE_COLORS, STAGE_LABELS } from '@/types/stages'
import { TMXLogo, TMXMark } from '@/components/branding'
import { DocViewer } from '@/components/ui/DocViewer'
import { AgencyDataProvider, useAgencyData } from '@/context/AgencyDataContext'
import { useTalentAuth } from '@/context/TalentAuthContext'
import { downloadUploadedDoc } from '@/lib/representation-agreement'
import type { UploadedDoc } from '@/types'
import type { ProspectContract } from '@/types/agency'

const pageShell: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#0c1520',
  color: '#e8eef4',
  fontFamily: "'Outfit', 'Segoe UI', sans-serif",
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '20px 22px',
}

const ghostBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 6,
  color: '#e8eef4',
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

function TalentHomeInner() {
  const navigate = useNavigate()
  const { session, loading, logout } = useTalentAuth()
  const { prospects } = useAgencyData()
  const [viewDoc, setViewDoc] = useState<UploadedDoc | null>(null)

  const agencyMatch = useMemo(() => {
    if (!session) return null
    const email = session.profile.email.toLowerCase()
    return (
      prospects.find((p) => p.email.toLowerCase() === email) ??
      prospects.find(
        (p) =>
          Boolean(session.talent.account_number) &&
          p.accountId === session.talent.account_number,
      ) ??
      null
    )
  }, [prospects, session])

  const contracts: ProspectContract[] = agencyMatch?.contracts ?? []

  useEffect(() => {
    if (!loading && !session) {
      navigate('/talent/login', { replace: true })
    }
  }, [loading, session, navigate])

  if (loading) {
    return (
      <div style={{ ...pageShell, alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(232,238,244,0.65)' }}>Loading your talent home…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/talent/login" replace />
  }

  const { profile, talent } = session
  const stageColor = STAGE_COLORS[talent.stage] ?? '#6b7280'
  const stageLabel = STAGE_LABELS[talent.stage] ?? talent.stage
  const agentName = agencyMatch?.assignedAgentName
  const agentContact = talent.email || profile.email

  const docs = REQUIRED_DOCS.map((d) => {
    const uploaded = talent.uploaded_docs?.[d.id] ?? null
    return { key: d.id, label: d.label, doc: uploaded }
  }).filter((row) => row.doc)

  async function handleLogout() {
    await logout()
    navigate('/talent/login', { replace: true })
  }

  return (
    <div style={pageShell}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <TMXMark size="sm" />
          <span style={{ fontSize: 15, fontWeight: 700 }}>{PLATFORM_BRAND.name}</span>
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            color: 'rgba(232,238,244,0.85)',
            fontSize: 13,
            padding: '8px 14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Sign out
        </button>
      </header>

      <main style={{ flex: 1, maxWidth: 880, width: '100%', margin: '0 auto', padding: '36px 20px 64px' }}>
        <div style={{ marginBottom: 28 }}>
          <TMXLogo size="sm" theme="dark" />
        </div>

        <h1
          style={{
            fontFamily: "'Syne', 'Outfit', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          Welcome, {talent.name || profile.name}
        </h1>
        <p style={{ color: 'rgba(232,238,244,0.65)', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
          Your talent home — status, contracts, documents, and how to reach your agent.
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          <section style={cardStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Status</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <span
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
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: stageColor,
                  }}
                />
                {stageLabel}
              </span>
              {talent.account_number && (
                <span style={{ fontSize: 13, color: 'rgba(232,238,244,0.7)' }}>
                  Account {talent.account_number}
                </span>
              )}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Contracts</h2>
            {contracts.length === 0 ? (
              <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.55)', lineHeight: 1.5 }}>
                No representation contracts are available in your portal yet. Your agency can attach
                them to your talent account.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
                {contracts.map((c) => (
                  <li
                    key={c.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(232,238,244,0.55)', marginTop: 4 }}>
                        {c.status === 'current' ? 'Current' : 'Past'}
                        {c.startDate ? ` · ${c.startDate}` : ''}
                        {c.endDate ? ` → ${c.endDate}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() =>
                          setViewDoc({
                            name: c.document.name,
                            data: c.document.data,
                            type: c.document.type,
                          })
                        }
                        style={ghostBtn}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadUploadedDoc({
                            name: c.document.name,
                            data: c.document.data,
                            type: c.document.type,
                          })
                        }
                        style={ghostBtn}
                      >
                        Download
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Documents</h2>
            {docs.length === 0 ? (
              <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.55)', lineHeight: 1.5 }}>
                No compliance documents are on file yet.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
                {docs.map((row) => (
                  <li
                    key={row.key}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{row.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(232,238,244,0.55)', marginTop: 4 }}>
                        {row.doc!.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setViewDoc(row.doc)} style={ghostBtn}>
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadUploadedDoc(row.doc!)}
                        style={ghostBtn}
                      >
                        Download
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Contact your agent</h2>
            <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.7)', lineHeight: 1.55, marginBottom: 8 }}>
              {agentName
                ? `Your assigned agent is ${agentName}.`
                : 'Reach out to your agency contact for scheduling, contracts, and onboarding questions.'}
            </p>
            {talent.phone && (
              <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.65)', marginBottom: 4 }}>
                Phone on file: {talent.phone}
              </p>
            )}
            <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.65)' }}>
              Account email: {agentContact}
            </p>
          </section>
        </div>
      </main>

      <DocViewer doc={viewDoc} onClose={() => setViewDoc(null)} />
    </div>
  )
}

export function TalentHomePage() {
  return (
    <AgencyDataProvider>
      <TalentHomeInner />
    </AgencyDataProvider>
  )
}
