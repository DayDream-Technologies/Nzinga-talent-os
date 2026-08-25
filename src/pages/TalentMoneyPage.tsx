import { useState } from 'react'
import { portalCard, portalInput, portalPrimary } from '@/components/talent-portal/TalentPortalShell'
import { useTalentPortal } from '@/hooks/useTalentPortal'
import { belongingToTalent, formatMoney, invoiceCommission, trustBalance } from '@/lib/talent-portal'

export function TalentMoneyPage() {
  const { displayName, invoices, escrow, expenseLogs, disbursements, addDisbursement } = useTalentPortal()
  const [amount, setAmount] = useState('')
  const [project, setProject] = useState('')
  const [method, setMethod] = useState('ACH')
  const [notice, setNotice] = useState('')

  const mineInvoices = belongingToTalent(invoices, displayName, (i) => [i.talentName])
  const mineEscrow = belongingToTalent(escrow, displayName, (e) => [e.talentName])
  const mineExpenses = belongingToTalent(expenseLogs, displayName, (e) => [e.talentName])
  const minePayouts = belongingToTalent(disbursements, displayName, (d) => [d.payee])
  const trust = trustBalance(escrow, displayName)
  const projects = [...new Set(mineInvoices.map((i) => i.project))]

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

  return (
    <>
      <h1 style={{ fontFamily: "'Syne', 'Outfit', sans-serif", fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
        Financial transparency
      </h1>
      <p style={{ color: 'rgba(232,238,244,0.65)', fontSize: 14, marginBottom: 22 }}>
        Earnings, commission, trust balance, invoices, and payout requests.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={portalCard}>
          <div style={{ fontSize: 11, color: 'rgba(232,238,244,0.55)', fontWeight: 600 }}>Trust account</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{formatMoney(trust)}</div>
        </div>
        <div style={portalCard}>
          <div style={{ fontSize: 11, color: 'rgba(232,238,244,0.55)', fontWeight: 600 }}>Completed payouts</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>
            {formatMoney(minePayouts.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Earnings per booking</h2>
          {mineInvoices.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.55)', margin: 0 }}>No bookings have been invoiced yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'rgba(232,238,244,0.55)' }}>
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
                      <tr key={inv.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '10px 6px' }}>
                          <div style={{ fontWeight: 600 }}>{inv.project}</div>
                          <div style={{ fontSize: 12, color: 'rgba(232,238,244,0.55)' }}>{inv.clientName} · {inv.invoiceNumber}</div>
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
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Commission breakdown</h2>
          {mineExpenses.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.55)', margin: 0 }}>No commission splits logged yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {mineExpenses.map((row) => (
                <li key={row.id} style={{ fontSize: 13, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {row.project}: gross {formatMoney(row.gross)} · agency {formatMoney(row.agencyCommission)} · you {formatMoney(row.talentShare)} · {row.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Trust account activity</h2>
          {mineEscrow.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.55)', margin: 0 }}>No funds are currently held in trust.</p>
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
            <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.55)', margin: 0 }}>No payments yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {minePayouts.map((row) => (
                <li key={row.id} style={{ fontSize: 13 }}>
                  Payout {formatMoney(row.amount)} · {row.project} · {row.method} · {row.status}
                  {row.paidAt ? ` · ${row.paidAt}` : ''}
                </li>
              ))}
              {mineInvoices.map((inv) => (
                <li key={`inv_${inv.id}`} style={{ fontSize: 13, color: 'rgba(232,238,244,0.75)' }}>
                  Invoice {inv.invoiceNumber || inv.id} · {inv.project} · due {inv.dueAt} · {inv.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Submit a payout request</h2>
          <form onSubmit={submitPayout} style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
            <label style={{ fontSize: 12, color: 'rgba(232,238,244,0.65)' }}>
              Amount
              <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...portalInput, marginTop: 6 }} />
            </label>
            <label style={{ fontSize: 12, color: 'rgba(232,238,244,0.65)' }}>
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
            <label style={{ fontSize: 12, color: 'rgba(232,238,244,0.65)' }}>
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
            {notice && <p style={{ fontSize: 13, color: '#86efac', margin: 0 }}>{notice}</p>}
          </form>
        </section>
      </div>
    </>
  )
}
