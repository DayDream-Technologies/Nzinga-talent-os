import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { isDocHubConnected, isStripeConnected } from '@/lib/integrations'
import { supabase } from '@/lib/supabase'
import type { DocHubEnvelopeRow } from '@/lib/dochub'
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
  const session = brandSession()
  const connected = isDocHubConnected()
  const [rows, setRows] = useState<DocHubEnvelopeRow[]>([])
  useEffect(() => {
    const email = session?.email?.trim().toLowerCase()
    if (!supabase || !email) return
    let cancel = false
    void supabase
      .from('dochub_envelopes')
      .select('contract_id, kind, title, status, document_id, document_url, expires_at, signer_name, signer_email')
      .eq('kind', 'usage')
      .eq('signer_email', email)
      .then(({ data }) => {
        if (!cancel && data) setRows(data as DocHubEnvelopeRow[])
      })
    return () => {
      cancel = true
    }
  }, [session?.email])

  return (
    <Panel title="Contracts & Licenses">
      {!connected && <IntegrationNotice id="dochub" audience="public" />}
      {connected && rows.length === 0 && (
        <p>
          Usage agreements sent to {session?.email} open here when this browser is signed in to Talent OS with that
          same email. DocHub also emails a signing link that expires in 3 days.
        </p>
      )}
      {rows.length > 0 && (
        <Card>
          <Table
            headers={['Agreement', 'Status', '']}
            rows={rows.map((row) => [
              row.title,
              row.status,
              <Btn
                key={row.contract_id}
                disabled={!row.document_url}
                onClick={() => row.document_url && window.open(row.document_url, '_blank', 'noopener,noreferrer')}
              >
                Open in DocHub
              </Btn>,
            ])}
          />
        </Card>
      )}
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
