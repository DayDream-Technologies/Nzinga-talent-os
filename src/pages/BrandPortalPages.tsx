import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { T } from '@/lib/tokens'
import { isDocHubConnected, isStripeConnected } from '@/lib/integrations'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { Btn, Card, Money, Panel, Table } from '@/components/agency/AgencyUI'
import { INVOICES_SEED } from '@/constants/agency-seed'
import { useViewport } from '@/hooks/useViewport'
import { staffGridColumns } from '@/lib/viewport'

const SESSION_KEY = 'tmx_brand_session'

export function brandSession(): { email: string; brand: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as { email: string; brand: string }) : null
  } catch {
    return null
  }
}

export function BrandPortalLayout() {
  const session = brandSession()
  const band = useViewport()
  if (!session && !window.location.pathname.endsWith('/login')) {
    return <Navigate to="/client/login" replace />
  }
  const stacked = band === 'mobile'
  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, color: T.t1, fontFamily: "'Outfit', sans-serif" }}>
      <header
        style={{
          display: 'flex',
          flexDirection: stacked ? 'column' : 'row',
          gap: 16,
          alignItems: stacked ? 'stretch' : 'center',
          padding: '12px 20px',
          background: T.navBg,
          borderBottom: `1px solid ${T.navBorder}`,
        }}
      >
        <strong style={{ color: '#fff' }}>Nzinga MGMT</strong>
        <nav style={{ display: 'flex', gap: 12, fontSize: 13, flexWrap: 'wrap' }}>
          <Link to="/client/dashboard" style={{ color: '#93c5fd', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Dashboard</Link>
          <Link to="/client/projects" style={{ color: '#93c5fd', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Active Projects</Link>
          <Link to="/client/billing" style={{ color: '#93c5fd', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Invoices</Link>
          <Link to="/client/contracts" style={{ color: '#93c5fd', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Contracts</Link>
        </nav>
        <div style={{ marginLeft: stacked ? 0 : 'auto', fontSize: 12, color: '#9ca3af' }}>{session?.brand}</div>
      </header>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: stacked ? 14 : 20 }}>
        <Outlet />
      </div>
    </div>
  )
}

export function BrandLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('john@nike.com')
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f17', color: '#fff' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, brand: 'Nike Corporate' }))
          navigate('/client/dashboard')
        }}
        style={{ width: '100%', maxWidth: 360, background: '#111827', padding: 24, borderRadius: 12, boxSizing: 'border-box' }}
      >
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Brand portal</h1>
        <p style={{ color: '#9ca3af', fontSize: 13 }}>Email and password for corporate clients.</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid #374151', background: '#0b0f17', color: '#fff' }} />
        <input type="password" defaultValue="brand123" style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #374151', background: '#0b0f17', color: '#fff' }} />
        <Btn type="submit">Sign in</Btn>
      </form>
    </div>
  )
}

export function BrandDashboardPage() {
  const session = brandSession()
  const band = useViewport()
  if (!session) return <Navigate to="/client/login" replace />
  const open = INVOICES_SEED.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)
  return (
    <Panel title={`Welcome, ${session.brand}`} subtitle={`Signed in as ${session.email}`}>
      <div style={{ display: 'grid', gridTemplateColumns: staffGridColumns(band, 'repeat(3, 1fr)'), gap: 10 }}>
        <Card>
          <div style={{ fontSize: 22, fontWeight: 800 }}><Money value={open} /></div>
          <div style={{ color: T.t3 }}>Open invoices</div>
        </Card>
        <Card>
          <div style={{ fontSize: 22, fontWeight: 800 }}>2</div>
          <div style={{ color: T.t3 }}>Active projects</div>
        </Card>
        <Card>
          <Btn onClick={() => (window.location.href = '/client/billing')}>Pay Invoice</Btn>
        </Card>
      </div>
    </Panel>
  )
}

export function BrandBillingPage() {
  return (
    <Panel title="Invoices & Billing">
      {!isStripeConnected() && <IntegrationNotice id="stripe" audience="public" />}
      <Card>
        <Table
          headers={['Invoice', 'Project', 'Due', 'Gross', 'Status', '']}
          rows={INVOICES_SEED.map((i) => [
            i.invoiceNumber || i.id,
            i.project,
            i.dueAt,
            <Money key={i.id} value={i.amount} />,
            i.status,
            <Btn key={`p-${i.id}`} disabled={!isStripeConnected()}>
              Pay Invoice Now
            </Btn>,
          ])}
        />
      </Card>
    </Panel>
  )
}

export function BrandContractsPage() {
  return (
    <Panel title="Contracts & Licenses">
      {!isDocHubConnected() && <IntegrationNotice id="dochub" audience="public" />}
      <p>Usage agreements will open here for review and e-sign when contract sending is live.</p>
    </Panel>
  )
}

export function BrandProjectsPage() {
  return (
    <Panel title="Active Projects">
      <Card>
        <Table
          headers={['Project', 'Talent', 'Dates', 'Option']}
          rows={[['Fall Commercial Shoot', 'Maya Rivera', '2026-09-12', 'Confirmed']]}
        />
      </Card>
    </Panel>
  )
}
