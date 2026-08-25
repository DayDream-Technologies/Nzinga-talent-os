import { useMemo, useState } from 'react'
import { portalCard, portalInput, portalMuted, portalPrimary } from '@/components/talent-portal/TalentPortalShell'
import { useTalentPortal } from '@/hooks/useTalentPortal'
import {
  belongingToTalent,
  downloadTextFile,
  formatMoney,
  invoiceCalendarYear,
  invoiceCommission,
  paidEarningsForYear,
  trustBalance,
  usageRightsTimeline,
  yearEnd1099Csv,
} from '@/lib/talent-portal'

export function TalentMoneyPage() {
  const { displayName, rosterTalent, tickets, invoices, escrow, expenseLogs, disbursements, addDisbursement } =
    useTalentPortal()
  const [amount, setAmount] = useState('')
  const [project, setProject] = useState('')
  const [method, setMethod] = useState('ACH')
  const [notice, setNotice] = useState('')
  const paidYears = useMemo(() => {
    const years = belongingToTalent(invoices, displayName, (i) => [i.talentName])
      .filter((inv) => inv.status === 'paid')
      .map((inv) => invoiceCalendarYear(inv))
      .filter(Boolean)
    return [...new Set(years)].sort().reverse()
  }, [displayName, invoices])
  const [year, setYear] = useState(paidYears[0] || String(new Date().getFullYear()))

  const mineInvoices = belongingToTalent(invoices, displayName, (i) => [i.talentName])
  const mineEscrow = belongingToTalent(escrow, displayName, (e) => [e.talentName])
  const mineExpenses = belongingToTalent(expenseLogs, displayName, (e) => [e.talentName])
  const minePayouts = belongingToTalent(disbursements, displayName, (d) => [d.payee])
  const trust = trustBalance(escrow, displayName)
  const projects = [...new Set(mineInvoices.map((i) => i.project))]
  const rights = usageRightsTimeline({
    name: displayName,
    tickets,
    invoices,
    usageRights: rosterTalent?.udf?.usageRights,
  })
  const yearPaid = paidEarningsForYear(invoices, displayName, year)
  const yearShare = yearPaid.reduce((sum, inv) => sum + invoiceCommission(inv).talentShare, 0)
  const taxReady = rosterTalent?.taxFormsReady
  const bankReady = rosterTalent?.bankReady
  const w9 = rosterTalent?.udf?.w9Status

  function submitPayout(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      setNotice('Enter a payout amount.')
      return
    }
    addDisbursement({
      payee: displayName,
      amount: value,
      method,
      status: 'pending',
      project: project || projects[0] || 'General payout',
    })
    setNotice(`Payout request submitted for ${formatMoney(value)}. Finance will review it.`)
    setAmount('')
  }

  function export1099() {
    const csv = yearEnd1099Csv(invoices, displayName, year)
    downloadTextFile(`${displayName.replace(/\s+/g, '_')}_${year}_1099_earnings.csv`, csv)
    setNotice(`Downloaded ${year} earnings export (${yearPaid.length} paid invoice${yearPaid.length === 1 ? '' : 's'}).`)
  }

  return (
    <>
      <h1 style={{ fontFamily: "'Syne', 'Outfit', sans-serif", fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
        Financial transparency
      </h1>
      <p style={{ color: portalMuted, fontSize: 14, marginBottom: 22 }}>
        Earnings, commission, trust balance, invoices, and payout requests.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={portalCard}>
          <div style={{ fontSize: 11, color: portalMuted, fontWeight: 600 }}>Trust account</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{formatMoney(trust)}</div>
        </div>
        <div style={portalCard}>
          <div style={{ fontSize: 11, color: portalMuted, fontWeight: 600 }}>Completed payouts</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>
            {formatMoney(minePayouts.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0))}
          </div>
        </div>
        <div style={portalCard}>
          <div style={{ fontSize: 11, color: portalMuted, fontWeight: 600 }}>W-9 / tax forms</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>{taxReady ? 'Ready' : 'Not on file'}</div>
          <div style={{ fontSize: 12, color: portalMuted, marginTop: 4 }}>{w9 || (taxReady ? 'Agency has tax forms' : 'Ask your agent before year-end')}</div>
        </div>
        <div style={portalCard}>
          <div style={{ fontSize: 11, color: portalMuted, fontWeight: 600 }}>Banking</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>{bankReady ? 'Ready' : 'Not on file'}</div>
          <div style={{ fontSize: 12, color: portalMuted, marginTop: 4 }}>
            {rosterTalent?.udf?.paymentMethod || (bankReady ? 'Payouts can be sent' : 'Add banking with your agent')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Earnings per booking</h2>
          {mineInvoices.length === 0 ? (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>No bookings have been invoiced yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: portalMuted }}>
                    <th style={{ padding: '8px 6px' }}>Booking</th>
                    <th style={{ padding: '8px 6px' }}>Gross</th>
                    <th style={{ padding: '8px 6px' }}>Commission</th>
                    <th style={{ padding: '8px 6px' }}>Your share</th>
                    <th style={{ padding: '8px 6px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mineInvoices.map((inv) => {
                    const split = invoiceCommission(inv)
                    return (
                      <tr key={inv.id} style={{ borderTop: '1px solid var(--tp-border)' }}>
                        <td style={{ padding: '10px 6px' }}>
                          <div style={{ fontWeight: 600 }}>{inv.project}</div>
                          <div style={{ fontSize: 12, color: portalMuted }}>{inv.clientName} · {inv.invoiceNumber}</div>
                        </td>
                        <td style={{ padding: '10px 6px' }}>{formatMoney(split.gross)}</td>
                        <td style={{ padding: '10px 6px' }}>{inv.commissionPct}% · {formatMoney(split.commission)}</td>
                        <td style={{ padding: '10px 6px' }}>{formatMoney(split.talentShare)}</td>
                        <td style={{ padding: '10px 6px', textTransform: 'capitalize' }}>{inv.status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Usage-rights timeline</h2>
          <p style={{ fontSize: 13, color: portalMuted, margin: '0 0 12px' }}>
            Built from contract tickets, buyout invoices, and roster notes.
          </p>
          {rights.length === 0 ? (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>No usage-rights items on file yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {rights.map((row) => (
                <li key={row.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--tp-border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{row.title}</div>
                  <div style={{ fontSize: 12, color: portalMuted, marginTop: 4 }}>
                    {row.source === 'invoice' ? 'Buyout invoice' : row.source === 'contract' ? 'Contract ticket' : 'Roster'}
                    {row.date ? ` · ${row.date}` : ''}
                  </div>
                  <p style={{ fontSize: 13, margin: '6px 0 0', lineHeight: 1.45 }}>{row.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Year-end 1099 / earnings export</h2>
          <p style={{ fontSize: 13, color: portalMuted, margin: '0 0 12px' }}>
            Paid invoices only. Download a CSV of talent share for tax season.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
            <label style={{ fontSize: 12, color: portalMuted }}>
              Tax year
              <select value={year} onChange={(e) => setYear(e.target.value)} style={{ ...portalInput, marginTop: 6, width: 120 }}>
                {(paidYears.length ? paidYears : [year]).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" style={portalPrimary} onClick={export1099} disabled={yearPaid.length === 0}>
              Download CSV
            </button>
          </div>
          <p style={{ fontSize: 13, margin: '10px 0 0' }}>
            {yearPaid.length === 0
              ? `No paid invoices in ${year}.`
              : `${yearPaid.length} paid invoice${yearPaid.length === 1 ? '' : 's'} · your share ${formatMoney(yearShare)}`}
          </p>
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Commission breakdown</h2>
          {mineExpenses.length === 0 ? (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>No commission splits logged yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {mineExpenses.map((row) => (
                <li key={row.id} style={{ fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--tp-border)' }}>
                  {row.project}: gross {formatMoney(row.gross)} · agency {formatMoney(row.agencyCommission)} · you {formatMoney(row.talentShare)} · {row.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Trust account activity</h2>
          {mineEscrow.length === 0 ? (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>No funds are currently held in trust.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {mineEscrow.map((row) => (
                <li key={row.id} style={{ fontSize: 13 }}>
                  {formatMoney(row.amount)} · {row.project} · {row.status}
                  {row.notes ? ` — ${row.notes}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Payment history & invoices</h2>
          {minePayouts.length === 0 && mineInvoices.length === 0 ? (
            <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>No payments yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {minePayouts.map((row) => (
                <li key={row.id} style={{ fontSize: 13 }}>
                  Payout {formatMoney(row.amount)} · {row.project} · {row.method} · {row.status}
                  {row.paidAt ? ` · ${row.paidAt}` : ''}
                </li>
              ))}
              {mineInvoices.map((inv) => (
                <li key={`inv_${inv.id}`} style={{ fontSize: 13, color: portalMuted }}>
                  Invoice {inv.invoiceNumber || inv.id} · {inv.project} · due {inv.dueAt} · {inv.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Submit a payout request</h2>
          <form onSubmit={submitPayout} style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
            <label style={{ fontSize: 12, color: portalMuted }}>
              Amount
              <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...portalInput, marginTop: 6 }} />
            </label>
            <label style={{ fontSize: 12, color: portalMuted }}>
              Project
              <select value={project} onChange={(e) => setProject(e.target.value)} style={{ ...portalInput, marginTop: 6 }}>
                <option value="">Select a booking</option>
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, color: portalMuted }}>
              Method
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ ...portalInput, marginTop: 6 }}>
                <option value="ACH">ACH</option>
                <option value="Check">Check</option>
                <option value="Wire">Wire</option>
              </select>
            </label>
            <button type="submit" style={{ ...portalPrimary, width: 'fit-content' }}>
              Request payout
            </button>
            {notice && <p style={{ fontSize: 13, color: '#16a34a', margin: 0 }}>{notice}</p>}
          </form>
        </section>
      </div>
    </>
  )
}
