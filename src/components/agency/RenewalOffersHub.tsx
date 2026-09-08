import { useState } from 'react'
import { Btn, Card, Field, ModalShell, Panel, Table, inputStyle } from '@/components/agency/AgencyUI'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { useAgencyData } from '@/context/AgencyDataContext'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/hooks/useAuth'
import { isDocHubConnected } from '@/lib/integrations'
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
  const [term, setTerm] = useState<RenewalTerm>('1y')
  const [sameTerms, setSameTerms] = useState(true)
  const [notes, setNotes] = useState('')
  const [preview, setPreview] = useState('')
  const windowDates = calculateRenewalWindow({
    currentStart: talent.contractStart,
    currentEnd: talent.contractEnd,
    term,
  })
  const connected = isDocHubConnected()
  const rate = talent.udf?.commissionRate || '20%'

  const text = previewRenewalOffer({
    legalName: talent.name,
    division: talent.division || talent.workArea,
    commissionRate: rate,
    start: windowDates.start,
    end: windowDates.end,
    sameTerms,
    notes,
  })

  return (
    <ModalShell title={`Renew · ${talent.name}`} onClose={onClose} width={560}>
      {!connected && <IntegrationNotice id="dochub" compact />}
      <Field label="Renewal term">
        <select value={term} onChange={(e) => setTerm(e.target.value as RenewalTerm)} style={inputStyle}>
          <option value="6m">6 Months</option>
          <option value="1y">1 Year</option>
          <option value="2y">2 Years</option>
          <option value="3y">3 Years</option>
          <option value="custom">Custom</option>
        </select>
      </Field>
      <div style={{ fontSize: 13, marginBottom: 10, color: T.t2 }}>
        Current % Rate: {rate}
        <br />
        New agreement: {windowDates.start} – {windowDates.end}
      </div>
      <Field label="Existing representation terms staying the same?">
        <select value={sameTerms ? 'yes' : 'no'} onChange={(e) => setSameTerms(e.target.value === 'yes')} style={inputStyle}>
          <option value="yes">Yes</option>
          <option value="no">No — terms need review</option>
        </select>
      </Field>
      <Field label="Additional notes / special terms">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={inputStyle} />
      </Field>
      {preview && (
        <pre style={{ whiteSpace: 'pre-wrap', background: T.mutedBg, padding: 12, borderRadius: 8, fontSize: 12 }}>{preview}</pre>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn variant="secondary" onClick={() => setPreview(text)}>
          Preview Offer
        </Btn>
        <Btn
          disabled={!connected || !preview}
          onClick={() => {
            createRenewalOffer(talent.id)
            const prospect = prospects.find((p) => p.id === talent.linkedProspectId)
            if (prospect) {
              addProspectContract(prospect.id, {
                title: `Renewal ${windowDates.start} – ${windowDates.end}`,
                status: 'pending_signature',
                startDate: windowDates.start,
                endDate: windowDates.end,
                document: { name: 'renewal-draft.txt', data: `data:text/plain,${encodeURIComponent(text)}`, type: 'text/plain' },
                dochubStatus: 'draft',
              })
            }
            setHistory((prev) => [
              createHistoryEntry({
                type: 'document',
                text: `Renewal offer drafted for ${talent.name} (${windowDates.start}–${windowDates.end})`,
                category: 'internal',
                staffName: user?.name,
                userId: user?.id,
                accountNumber: talent.accountId,
              }),
              ...prev,
            ])
            onClose()
          }}
        >
          Create & Send Document
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
