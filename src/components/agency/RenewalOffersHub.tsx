import { useState } from 'react'
import { Btn, Card, Field, ModalShell, Panel, Table, inputStyle } from '@/components/agency/AgencyUI'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { isDocHubConnected } from '@/lib/integrations'
import { sendDocHubContract } from '@/lib/dochub'
import { catalogNames } from '@/lib/lookup-catalogs'
import { calculateRenewalWindow, previewRenewalOffer, type RenewalTerm } from '@/lib/renewal'
import { createHistoryEntry } from '@/lib/history-ledger'
import { T } from '@/lib/tokens'
import type { AgencyTalent } from '@/types/agency'

export function RenewalOfferModal({
  talent,
  onClose,
}: {
  talent: AgencyTalent
  onClose: () => void
}) {
  const { createRenewalOffer, addProspectContract, prospects } = useAgencyData()
  const { setHistory } = useAppData()
  const { user } = useAuth()
  const term: RenewalTerm = '1y'
  const [existingRepresentation, setExistingRepresentation] = useState(true)
  const [rateChanging, setRateChanging] = useState(false)
  const [newRate, setNewRate] = useState('')
  const [divisionChanging, setDivisionChanging] = useState(false)
  const [newDivision, setNewDivision] = useState(talent.division || talent.workArea || 'Modeling')
  const [notes, setNotes] = useState('')
  const [preview, setPreview] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const windowDates = calculateRenewalWindow({
    currentStart: talent.contractStart,
    currentEnd: talent.contractEnd,
    term,
  })
  const connected = isDocHubConnected()
  const rate = talent.udf?.commissionRate || '20%'

  const text = previewRenewalOffer({
    legalName: talent.name,
    division: !existingRepresentation && divisionChanging ? newDivision : talent.division || talent.workArea,
    commissionRate: !existingRepresentation && rateChanging && newRate.trim() ? newRate.trim() : rate,
    start: windowDates.start,
    end: windowDates.end,
    sameTerms: existingRepresentation,
    notes,
  })

  return (
    <ModalShell title={`Renew · ${talent.name}`} onClose={onClose} width={560}>
      {!connected && <IntegrationNotice id="dochub" compact />}
      <Field label="Renewal term">
        <input style={inputStyle} value="1 Year" readOnly />
      </Field>
      <div style={{ fontSize: 13, marginBottom: 10, color: T.t2 }}>
        Current % Rate: {rate}
        <br />
        New agreement: {windowDates.start} – {windowDates.end}
      </div>
      <Field label="Existing representation">
        <select
          value={existingRepresentation ? 'yes' : 'no'}
          onChange={(e) => setExistingRepresentation(e.target.value === 'yes')}
          style={inputStyle}
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </Field>
      {!existingRepresentation && (
        <>
          <Field label="Is commission rate changing?">
            <select
              value={rateChanging ? 'yes' : 'no'}
              onChange={(e) => setRateChanging(e.target.value === 'yes')}
              style={inputStyle}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </Field>
          {rateChanging && (
            <Field label="New rate">
              <input style={inputStyle} value={newRate} onChange={(e) => setNewRate(e.target.value)} placeholder="25%" />
            </Field>
          )}
          <Field label="Is division changing?">
            <select
              value={divisionChanging ? 'yes' : 'no'}
              onChange={(e) => setDivisionChanging(e.target.value === 'yes')}
              style={inputStyle}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </Field>
          {divisionChanging && (
            <Field label="Division">
              <select style={inputStyle} value={newDivision} onChange={(e) => setNewDivision(e.target.value)}>
                {catalogNames('Roster Groups').map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
          )}
        </>
      )}
      <Field label="Additional notes / special terms">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={inputStyle} />
      </Field>
      {preview && (
        <pre style={{ whiteSpace: 'pre-wrap', background: T.mutedBg, padding: 12, borderRadius: 8, fontSize: 12 }}>{preview}</pre>
      )}
      {sendError && <div style={{ color: T.red, fontSize: 12, marginBottom: 8 }}>{sendError}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn variant="secondary" onClick={() => setPreview(text)}>
          Preview Offer
        </Btn>
        <Btn
          disabled={!connected || !preview || sending}
          onClick={() => {
            void (async () => {
              setSendError('')
              const prospect = prospects.find((p) => p.id === talent.linkedProspectId)
              const contractId = `ctr_${Date.now()}`
              if (!prospect?.email) {
                setSendError('This talent needs a prospect email before DocHub can send the offer.')
                return
              }
              setSending(true)
              const sent = await sendDocHubContract({
                contractId,
                kind: 'renewal',
                title: `Renewal ${windowDates.start} – ${windowDates.end}`,
                signerName: talent.name,
                signerEmail: prospect.email,
                talentAccount: talent.accountId,
                filename: 'renewal.html',
                contentType: 'text/html',
                html: `<!doctype html><html><body><pre style="font-family:Georgia,serif;white-space:pre-wrap">${text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')}</pre></body></html>`,
              })
              setSending(false)
              if (!sent.ok) {
                setSendError(sent.error)
                return
              }
              createRenewalOffer(talent.id)
              addProspectContract(prospect.id, {
                id: contractId,
                title: `Renewal ${windowDates.start} – ${windowDates.end}`,
                status: 'pending_signature',
                startDate: windowDates.start,
                endDate: windowDates.end,
                document: { name: 'renewal.html', data: `data:text/html,${encodeURIComponent(text)}`, type: 'text/html' },
                dochubStatus: sent.data.status || 'sent',
                dochubDocumentId: sent.data.documentId,
                dochubUrl: sent.data.documentUrl,
                expiresAt: sent.data.expiresAt,
              })
              setHistory((prev) => [
                createHistoryEntry({
                  type: 'document',
                  text: `Renewal offer sent via DocHub for ${talent.name} (${windowDates.start}–${windowDates.end})`,
                  category: 'internal',
                  staffName: user?.name,
                  userId: user?.id,
                  accountNumber: talent.accountId,
                }),
                ...prev,
              ])
              onClose()
            })()
          }}
        >
          {sending ? 'Sending…' : 'Create & Send Document'}
        </Btn>
      </div>
    </ModalShell>
  )
}

export function RenewalOffersHub() {
  const { talent } = useAgencyData()
  const [target, setTarget] = useState<AgencyTalent | null>(null)
  return (
    <Panel title="Create Renewal Offers" subtitle="Preview from the stored template, then send via DocHub.">
      <Card>
        <Table
          headers={['Talent', 'Division', 'Current % Rate', 'Contract', '']}
          rows={talent.map((t) => [
            t.name,
            t.division || t.workArea,
            t.udf?.commissionRate || '—',
            `${t.contractStart || '—'} – ${t.contractEnd || 'open'}`,
            <Btn key={t.id} onClick={() => setTarget(t)}>
              Renew
            </Btn>,
          ])}
        />
      </Card>
      {target && <RenewalOfferModal talent={target} onClose={() => setTarget(null)} />}
    </Panel>
  )
}
