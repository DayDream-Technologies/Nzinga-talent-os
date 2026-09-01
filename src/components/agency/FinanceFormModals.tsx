import { useEffect, useState } from 'react'
import type {
  ClientInvoice,
  Disbursement,
  EscrowDeposit,
  ExpensePayoutLog,
  InvoiceStatus,
  EscrowStatus,
  PayoutStatus,
  RetainerPlan,
  Vendor,
} from '@/types/agency'
import { Btn, Field, ModalShell, inputStyle } from './AgencyUI'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { T } from '@/lib/tokens'
import { uploadOwnedFile } from '@/services/storage.service'

function Footer({
  isEdit,
  onClose,
  onSave,
  onDelete,
}: {
  isEdit: boolean
  onClose: () => void
  onSave: () => void
  onDelete?: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
      {isEdit && onDelete && (
        <Btn variant="danger" onClick={() => setConfirmDelete(true)}>
          Delete
        </Btn>
      )}
      <div style={{ flex: 1 }} />
      <Btn variant="secondary" onClick={onClose}>
        Cancel
      </Btn>
      <Btn onClick={onSave}>{isEdit ? 'Save' : 'Create'}</Btn>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this record?"
        message="This cannot be undone from this screen."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          onDelete?.()
        }}
      />
    </div>
  )
}

/* ─── Invoice ─── */

export function calcInvoiceTax(amount: number, taxRatePct: number): number {
  return Math.round((Number(amount) || 0) * ((Number(taxRatePct) || 0) / 100))
}

export function invoiceTotal(inv: Pick<ClientInvoice, 'amount' | 'taxAmount'>): number {
  return (inv.amount || 0) + (inv.taxAmount || 0)
}

export function InvoiceFormModal({
  initial,
  clients,
  talentNames,
  onClose,
  onSave,
  onDelete,
}: {
  initial?: ClientInvoice | null
  clients: { id: string; name: string }[]
  talentNames: string[]
  onClose: () => void
  onSave: (values: Omit<ClientInvoice, 'id'>) => void
  onDelete?: () => void
}) {
  const defaultClient = clients[0]
  const [clientId, setClientId] = useState(initial?.clientId || defaultClient?.id || '')
  const [clientName, setClientName] = useState(initial?.clientName || defaultClient?.name || '')
  const [talentName, setTalentName] = useState(initial?.talentName || talentNames[0] || '')
  const [project, setProject] = useState(initial?.project || '')
  const [amount, setAmount] = useState(String(initial?.amount ?? 0))
  const [commissionPct, setCommissionPct] = useState(String(initial?.commissionPct ?? 20))
  const [status, setStatus] = useState<InvoiceStatus>(initial?.status || 'sent')
  const [issuedAt, setIssuedAt] = useState(initial?.issuedAt || new Date().toISOString().slice(0, 10))
  const [dueAt, setDueAt] = useState(
    initial?.dueAt || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  )
  const [paidAt, setPaidAt] = useState(initial?.paidAt || '')
  const [interestApplied, setInterestApplied] = useState(String(initial?.interestApplied ?? 0))
  const [taxId, setTaxId] = useState(initial?.taxId || '')
  const [taxRatePct, setTaxRatePct] = useState(String(initial?.taxRatePct ?? 0))
  const [invoiceNumber, setInvoiceNumber] = useState(
    initial?.invoiceNumber || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
  )
  const [poNumber, setPoNumber] = useState(initial?.poNumber || '')
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms || 'Net 30')
  const [billingAddress, setBillingAddress] = useState(initial?.billingAddress || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [document, setDocument] = useState<ClientInvoice['document']>(initial?.document ?? null)
  const [docUploading, setDocUploading] = useState(false)

  const amountNum = Number(amount) || 0
  const rateNum = Number(taxRatePct) || 0
  const taxAmount = calcInvoiceTax(amountNum, rateNum)
  const total = amountNum + taxAmount

  useEffect(() => {
    if (!initial) return
    setClientId(initial.clientId)
    setClientName(initial.clientName)
    setTalentName(initial.talentName)
    setProject(initial.project)
    setAmount(String(initial.amount))
    setCommissionPct(String(initial.commissionPct))
    setStatus(initial.status)
    setIssuedAt(initial.issuedAt)
    setDueAt(initial.dueAt)
    setPaidAt(initial.paidAt || '')
    setInterestApplied(String(initial.interestApplied))
    setTaxId(initial.taxId || '')
    setTaxRatePct(String(initial.taxRatePct ?? 0))
    setInvoiceNumber(initial.invoiceNumber || '')
    setPoNumber(initial.poNumber || '')
    setPaymentTerms(initial.paymentTerms || 'Net 30')
    setBillingAddress(initial.billingAddress || '')
    setNotes(initial.notes || '')
    setDocument(initial.document ?? null)
  }, [initial])

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setDocUploading(true)
    try {
      const owner = clientId || initial?.id || 'invoice'
      const stored = await uploadOwnedFile(file, `agency/${owner}/invoices`, {
        uploadedBy: 'staff',
        docType: 'invoice',
      })
      setDocument({
        name: stored.name,
        data: stored.data,
        type: stored.type,
        storagePath: stored.storagePath,
        cdnUrl: stored.cdnUrl,
        thumbnailUrl: stored.thumbnailUrl,
      })
    } catch {
      /* keep previous document */
    } finally {
      setDocUploading(false)
    }
  }

  return (
    <ModalShell title={initial ? 'Edit invoice' : 'New invoice'} onClose={onClose} width={580}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Invoice #">
          <input style={inputStyle} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        </Field>
        <Field label="PO number">
          <input style={inputStyle} value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
        </Field>
      </div>
      <Field label="Client">
        <select
          style={inputStyle}
          value={clientId}
          onChange={(e) => {
            const c = clients.find((x) => x.id === e.target.value)
            setClientId(e.target.value)
            setClientName(c?.name || '')
          }}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Talent">
        <select style={inputStyle} value={talentName} onChange={(e) => setTalentName(e.target.value)}>
          {talentNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Project">
        <input style={inputStyle} value={project} onChange={(e) => setProject(e.target.value)} />
      </Field>
      <Field label="Billing address">
        <textarea
          style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }}
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Tax ID / EIN">
          <input
            style={inputStyle}
            placeholder="XX-XXXXXXX"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />
        </Field>
        <Field label="Payment terms">
          <select style={inputStyle} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
            <option value="Due on receipt">Due on receipt</option>
            <option value="Net 15">Net 15</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 45">Net 45</option>
            <option value="Net 60">Net 60</option>
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Field label="Subtotal">
          <input style={inputStyle} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Tax rate %">
          <input
            style={inputStyle}
            type="number"
            step="0.001"
            value={taxRatePct}
            onChange={(e) => setTaxRatePct(e.target.value)}
          />
        </Field>
        <Field label="Commission %">
          <input
            style={inputStyle}
            type="number"
            value={commissionPct}
            onChange={(e) => setCommissionPct(e.target.value)}
          />
        </Field>
      </div>
      <div
        style={{
          background: T.mutedBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 12,
          fontSize: 13,
          display: 'grid',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: T.t3 }}>Tax amount</span>
          <strong>${taxAmount.toLocaleString()}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: T.t3 }}>Interest applied</span>
          <span>${(Number(interestApplied) || 0).toLocaleString()}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: `1px solid ${T.cardBorder}`,
            paddingTop: 6,
            marginTop: 2,
          }}
        >
          <span style={{ fontWeight: 700 }}>Total due</span>
          <strong style={{ fontSize: 15 }}>${total.toLocaleString()}</strong>
        </div>
      </div>
      <Field label="Status">
        <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
          {(['draft', 'sent', 'paid', 'overdue', 'partial'] as InvoiceStatus[]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Field label="Issued">
          <input type="date" style={inputStyle} value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
        </Field>
        <Field label="Due">
          <input type="date" style={inputStyle} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </Field>
        <Field label="Paid at">
          <input type="date" style={inputStyle} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </Field>
      </div>
      <Field label="Interest applied">
        <input
          style={inputStyle}
          type="number"
          value={interestApplied}
          onChange={(e) => setInterestApplied(e.target.value)}
        />
      </Field>
      <Field label="Notes">
        <textarea
          style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 6 }}>
          Supporting document
        </div>
        <label
          style={{
            display: 'block',
            border: `2px dashed ${document ? '#16a34a' : '#d1d5db'}`,
            background: document ? T.greenL : T.mutedBg,
            borderRadius: 8,
            padding: '12px 14px',
            cursor: 'pointer',
            textAlign: document ? 'left' : 'center',
          }}
        >
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleDocUpload}
            style={{ display: 'none' }}
          />
          {docUploading ? (
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t2 }}>Uploading…</div>
          ) : document ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{document.type?.includes('pdf') ? '📄' : '🖼️'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>{document.name}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>Click to replace</div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDocument(null)
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#dc2626',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 18, marginBottom: 4 }}>📎</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t2 }}>
                Upload invoice PDF or supporting docs
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>PDF, image, or Word</div>
            </>
          )}
        </label>
      </div>
      <Footer
        isEdit={Boolean(initial)}
        onClose={onClose}
        onDelete={onDelete}
        onSave={() =>
          onSave({
            clientId,
            clientName,
            talentName,
            project: project.trim() || 'Untitled project',
            amount: amountNum,
            commissionPct: Number(commissionPct) || 0,
            status,
            issuedAt,
            dueAt,
            paidAt: paidAt || undefined,
            interestApplied: Number(interestApplied) || 0,
            taxId: taxId.trim(),
            taxRatePct: rateNum,
            taxAmount,
            invoiceNumber: invoiceNumber.trim() || undefined,
            poNumber: poNumber.trim() || undefined,
            paymentTerms,
            billingAddress: billingAddress.trim() || undefined,
            notes: notes.trim() || undefined,
            document: document || null,
          })
        }
      />
    </ModalShell>
  )
}

/* ─── Retainer ─── */

export function RetainerFormModal({
  initial,
  clients,
  onClose,
  onSave,
  onDelete,
}: {
  initial?: RetainerPlan | null
  clients: { id: string; name: string }[]
  onClose: () => void
  onSave: (values: Omit<RetainerPlan, 'id'>) => void
  onDelete?: () => void
}) {
  const defaultClient = clients[0]
  const [clientId, setClientId] = useState(initial?.clientId || defaultClient?.id || '')
  const [clientName, setClientName] = useState(initial?.clientName || defaultClient?.name || '')
  const [monthlyAmount, setMonthlyAmount] = useState(String(initial?.monthlyAmount ?? 5000))
  const [dayOfMonth, setDayOfMonth] = useState(String(initial?.dayOfMonth ?? 1))
  const [active, setActive] = useState(initial?.active ?? true)
  const [description, setDescription] = useState(initial?.description || '')

  useEffect(() => {
    if (!initial) return
    setClientId(initial.clientId)
    setClientName(initial.clientName)
    setMonthlyAmount(String(initial.monthlyAmount))
    setDayOfMonth(String(initial.dayOfMonth))
    setActive(initial.active)
    setDescription(initial.description)
  }, [initial])

  return (
    <ModalShell title={initial ? 'Edit retainer plan' : 'New retainer plan'} onClose={onClose}>
      <Field label="Client">
        <select
          style={inputStyle}
          value={clientId}
          onChange={(e) => {
            const c = clients.find((x) => x.id === e.target.value)
            setClientId(e.target.value)
            setClientName(c?.name || '')
          }}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Monthly amount">
          <input
            style={inputStyle}
            type="number"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
          />
        </Field>
        <Field label="Bill day of month">
          <input
            style={inputStyle}
            type="number"
            min={1}
            max={28}
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Description">
        <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12 }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>
      <Footer
        isEdit={Boolean(initial)}
        onClose={onClose}
        onDelete={onDelete}
        onSave={() =>
          onSave({
            clientId,
            clientName,
            monthlyAmount: Number(monthlyAmount) || 0,
            dayOfMonth: Math.min(28, Math.max(1, Number(dayOfMonth) || 1)),
            active,
            description: description.trim() || `Monthly retainer — ${clientName}`,
          })
        }
      />
    </ModalShell>
  )
}

/* ─── Escrow ─── */

export function EscrowFormModal({
  initial,
  clientNames,
  onClose,
  onSave,
  onDelete,
}: {
  initial?: EscrowDeposit | null
  clientNames: string[]
  onClose: () => void
  onSave: (values: Omit<EscrowDeposit, 'id'>) => void
  onDelete?: () => void
}) {
  const [clientName, setClientName] = useState(initial?.clientName || clientNames[0] || '')
  const [project, setProject] = useState(initial?.project || '')
  const [amount, setAmount] = useState(String(initial?.amount ?? 0))
  const [receivedAt, setReceivedAt] = useState(
    initial?.receivedAt || new Date().toISOString().slice(0, 10),
  )
  const [status, setStatus] = useState<EscrowStatus>(initial?.status || 'pending')
  const [invoiceId, setInvoiceId] = useState(initial?.invoiceId || '')
  const [notes, setNotes] = useState(initial?.notes || '')

  useEffect(() => {
    if (!initial) return
    setClientName(initial.clientName)
    setProject(initial.project)
    setAmount(String(initial.amount))
    setReceivedAt(initial.receivedAt)
    setStatus(initial.status)
    setInvoiceId(initial.invoiceId || '')
    setNotes(initial.notes)
  }, [initial])

  return (
    <ModalShell title={initial ? 'Edit escrow / deposit' : 'Record escrow / deposit'} onClose={onClose}>
      <Field label="Client">
        <select style={inputStyle} value={clientName} onChange={(e) => setClientName(e.target.value)}>
          {clientNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Project">
        <input style={inputStyle} value={project} onChange={(e) => setProject(e.target.value)} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Amount">
          <input style={inputStyle} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Received">
          <input type="date" style={inputStyle} value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
        </Field>
      </div>
      <Field label="Status">
        <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as EscrowStatus)}>
          {(['pending', 'cleared', 'disbursed'] as EscrowStatus[]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Invoice ID (optional)">
        <input style={inputStyle} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} />
      </Field>
      <Field label="Notes">
        <textarea
          style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <Footer
        isEdit={Boolean(initial)}
        onClose={onClose}
        onDelete={onDelete}
        onSave={() =>
          onSave({
            clientName,
            project: project.trim() || 'Deposit',
            amount: Number(amount) || 0,
            receivedAt,
            status,
            invoiceId: invoiceId.trim() || undefined,
            notes: notes.trim(),
          })
        }
      />
    </ModalShell>
  )
}

/* ─── Expense / payout log ─── */

export function ExpenseFormModal({
  initial,
  clientNames,
  talentNames,
  onClose,
  onSave,
  onDelete,
}: {
  initial?: ExpensePayoutLog | null
  clientNames: string[]
  talentNames: string[]
  onClose: () => void
  onSave: (values: Omit<ExpensePayoutLog, 'id'>) => void
  onDelete?: () => void
}) {
  const [project, setProject] = useState(initial?.project || '')
  const [clientName, setClientName] = useState(initial?.clientName || clientNames[0] || '')
  const [talentName, setTalentName] = useState(initial?.talentName || talentNames[0] || '')
  const [gross, setGross] = useState(String(initial?.gross ?? 0))
  const [commissionPct, setCommissionPct] = useState(
    initial ? String(Math.round((initial.agencyCommission / Math.max(initial.gross, 1)) * 100)) : '20',
  )
  const [status, setStatus] = useState<PayoutStatus>(initial?.status || 'pending')

  useEffect(() => {
    if (!initial) return
    setProject(initial.project)
    setClientName(initial.clientName)
    setTalentName(initial.talentName)
    setGross(String(initial.gross))
    setCommissionPct(String(Math.round((initial.agencyCommission / Math.max(initial.gross, 1)) * 100)))
    setStatus(initial.status)
  }, [initial])

  const grossNum = Number(gross) || 0
  const pct = Number(commissionPct) || 0
  const agencyCommission = Math.round(grossNum * (pct / 100))
  const talentShare = grossNum - agencyCommission

  return (
    <ModalShell title={initial ? 'Edit expense / payout' : 'Log expense / payout'} onClose={onClose}>
      <Field label="Project">
        <input style={inputStyle} value={project} onChange={(e) => setProject(e.target.value)} />
      </Field>
      <Field label="Client">
        <select style={inputStyle} value={clientName} onChange={(e) => setClientName(e.target.value)}>
          {clientNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Talent">
        <select style={inputStyle} value={talentName} onChange={(e) => setTalentName(e.target.value)}>
          {talentNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Gross">
          <input style={inputStyle} type="number" value={gross} onChange={(e) => setGross(e.target.value)} />
        </Field>
        <Field label="Commission %">
          <input
            style={inputStyle}
            type="number"
            value={commissionPct}
            onChange={(e) => setCommissionPct(e.target.value)}
          />
        </Field>
      </div>
      <div style={{ fontSize: 12, color: T.t3, marginBottom: 12 }}>
        Agency: ${agencyCommission.toLocaleString()} · Talent share: ${talentShare.toLocaleString()}
      </div>
      <Field label="Status">
        <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as PayoutStatus)}>
          {(['pending', 'issued', 'completed'] as PayoutStatus[]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Footer
        isEdit={Boolean(initial)}
        onClose={onClose}
        onDelete={onDelete}
        onSave={() =>
          onSave({
            project: project.trim() || 'Job',
            clientName,
            talentName,
            gross: grossNum,
            agencyCommission,
            talentShare,
            status,
            loggedAt: initial?.loggedAt || new Date().toISOString(),
          })
        }
      />
    </ModalShell>
  )
}

/* ─── Vendor ─── */

export function VendorFormModal({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial?: Vendor | null
  onClose: () => void
  onSave: (values: Omit<Vendor, 'id'>) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(initial?.name || '')
  const [type, setType] = useState<Vendor['type']>(initial?.type || 'vendor')
  const [bankLast4, setBankLast4] = useState(initial?.bankLast4 || '')
  const [taxFormsReady, setTaxFormsReady] = useState(initial?.taxFormsReady ?? false)
  const [email, setEmail] = useState(initial?.email || '')

  useEffect(() => {
    if (!initial) return
    setName(initial.name)
    setType(initial.type)
    setBankLast4(initial.bankLast4)
    setTaxFormsReady(initial.taxFormsReady)
    setEmail(initial.email)
  }, [initial])

  return (
    <ModalShell title={initial ? 'Edit vendor' : 'New vendor'} onClose={onClose}>
      <Field label="Name">
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Type">
        <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value as Vendor['type'])}>
          <option value="talent">talent</option>
          <option value="vendor">vendor</option>
          <option value="service">service</option>
        </select>
      </Field>
      <Field label="Bank last 4">
        <input
          style={inputStyle}
          value={bankLast4}
          maxLength={4}
          onChange={(e) => setBankLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
        />
      </Field>
      <Field label="Email">
        <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12 }}>
        <input type="checkbox" checked={taxFormsReady} onChange={(e) => setTaxFormsReady(e.target.checked)} />
        Tax forms ready
      </label>
      <Footer
        isEdit={Boolean(initial)}
        onClose={onClose}
        onDelete={onDelete}
        onSave={() =>
          onSave({
            name: name.trim() || 'Vendor',
            type,
            bankLast4: bankLast4.padStart(4, '0').slice(-4),
            taxFormsReady,
            email: email.trim(),
          })
        }
      />
    </ModalShell>
  )
}

/* ─── Disbursement ─── */

export function DisbursementFormModal({
  initial,
  payeeOptions,
  onClose,
  onSave,
  onDelete,
}: {
  initial?: Disbursement | null
  payeeOptions: string[]
  onClose: () => void
  onSave: (values: Omit<Disbursement, 'id'>) => void
  onDelete?: () => void
}) {
  const [payee, setPayee] = useState(initial?.payee || payeeOptions[0] || '')
  const [amount, setAmount] = useState(String(initial?.amount ?? 0))
  const [method, setMethod] = useState(initial?.method || 'Direct deposit')
  const [status, setStatus] = useState<PayoutStatus>(initial?.status || 'pending')
  const [project, setProject] = useState(initial?.project || '')
  const [paidAt, setPaidAt] = useState(
    initial?.paidAt ? initial.paidAt.slice(0, 16) : '',
  )

  useEffect(() => {
    if (!initial) return
    setPayee(initial.payee)
    setAmount(String(initial.amount))
    setMethod(initial.method)
    setStatus(initial.status)
    setProject(initial.project)
    setPaidAt(initial.paidAt ? initial.paidAt.slice(0, 16) : '')
  }, [initial])

  return (
    <ModalShell title={initial ? 'Edit disbursement' : 'New disbursement'} onClose={onClose}>
      <Field label="Payee">
        <select style={inputStyle} value={payee} onChange={(e) => setPayee(e.target.value)}>
          {!payeeOptions.includes(payee) && payee && <option value={payee}>{payee}</option>}
          {payeeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Amount">
          <input style={inputStyle} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Method">
          <input style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value)} />
        </Field>
      </div>
      <Field label="Project">
        <input style={inputStyle} value={project} onChange={(e) => setProject(e.target.value)} />
      </Field>
      <Field label="Status">
        <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as PayoutStatus)}>
          {(['pending', 'issued', 'completed'] as PayoutStatus[]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Paid at (optional)">
        <input
          type="datetime-local"
          style={inputStyle}
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
        />
      </Field>
      <Footer
        isEdit={Boolean(initial)}
        onClose={onClose}
        onDelete={onDelete}
        onSave={() =>
          onSave({
            payee,
            amount: Number(amount) || 0,
            method: method.trim() || 'Direct deposit',
            status,
            project: project.trim() || 'Payout',
            paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
          })
        }
      />
    </ModalShell>
  )
}
