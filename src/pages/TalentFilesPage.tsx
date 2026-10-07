import { useEffect, useMemo, useState } from 'react'
import { DocViewer } from '@/components/ui/DocViewer'
import { portalCard, portalGhost, portalMuted, portalPrimary } from '@/components/talent-portal/TalentPortalShell'
import { useTalentPortal } from '@/hooks/useTalentPortal'
import { downloadUploadedDoc } from '@/lib/representation-agreement'
import { collectPortalFiles } from '@/lib/talent-portal'
import { resolveProfilePhoto } from '@/lib/profile-photo'
import { IntegrationNotice } from '@/components/agency/IntegrationNotice'
import { isDocHubConnected } from '@/lib/integrations'
import { supabase } from '@/lib/supabase'
import type { DocHubEnvelopeRow } from '@/lib/dochub'
import type { UploadedDoc } from '@/types'

const GROUPS = ['Contracts & agreements', 'Photos, videos & assets', 'Agency-uploaded materials'] as const

export function TalentFilesPage() {
  const { talent, displayName, prospect, rosterTalent, session } = useTalentPortal()
  const [viewDoc, setViewDoc] = useState<UploadedDoc | null>(null)
  const [envelopes, setEnvelopes] = useState<DocHubEnvelopeRow[]>([])
  const signerEmail = (session?.profile?.email || prospect?.email || talent?.email || '').trim().toLowerCase()

  useEffect(() => {
    if (!supabase || !signerEmail) return
    let cancel = false
    void supabase
      .from('dochub_envelopes')
      .select('contract_id, kind, title, status, document_id, document_url, expires_at, signer_name, signer_email')
      .eq('signer_email', signerEmail)
      .then(({ data }) => {
        if (!cancel && data) setEnvelopes(data as DocHubEnvelopeRow[])
      })
    return () => {
      cancel = true
    }
  }, [signerEmail])
  const files = useMemo(
    () =>
      collectPortalFiles({
        contracts: prospect?.contracts || [],
        uploadedDocs: talent?.uploaded_docs || {},
        profilePhoto: resolveProfilePhoto({ pipelineTalent: talent, rosterTalent, prospect }),
        portalAssets: rosterTalent?.portalAssets || [],
      }),
    [prospect, rosterTalent, talent],
  )
  const pending = (prospect?.contracts || []).filter((c) => c.status === 'pending_signature')

  return (
    <>
      <h1 style={{ fontFamily: "'Syne', 'Outfit', sans-serif", fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
        Files & media
      </h1>
      <p style={{ color: portalMuted, fontSize: 14, marginBottom: 22 }}>
        Contracts, photos, videos, and materials your agency has shared with {displayName}.
      </p>

      {(pending.length > 0 || envelopes.some((row) => row.status !== 'completed' && row.status !== 'voided')) && (
        <section style={{ ...portalCard, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Review and sign</h2>
          <p style={{ fontSize: 13, color: portalMuted, margin: '0 0 12px' }}>
            Contracts are signed in DocHub. In-app name confirmation has been removed.
          </p>
          {!isDocHubConnected() && <IntegrationNotice id="dochub" audience="public" />}
          {pending.map((c) => {
            const envelope = envelopes.find((row) => row.contract_id === c.id)
            const url = c.dochubUrl || envelope?.document_url
            return (
            <div key={c.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={portalGhost}
                  onClick={() => setViewDoc({ name: c.document.name, data: c.document.data, type: c.document.type })}
                >
                  View
                </button>
                <button type="button" style={portalGhost} onClick={() => downloadUploadedDoc(c.document)}>
                  Download
                </button>
                <button
                  type="button"
                  style={portalPrimary}
                  disabled={!isDocHubConnected() || !url}
                  onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
                >
                  Open in DocHub
                </button>
              </div>
            </div>
            )
          })}
          {envelopes
            .filter((row) => row.status !== 'completed' && row.status !== 'voided' && !pending.some((c) => c.id === row.contract_id))
            .map((row) => (
              <div key={row.contract_id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{row.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    style={portalPrimary}
                    disabled={!row.document_url}
                    onClick={() => row.document_url && window.open(row.document_url, '_blank', 'noopener,noreferrer')}
                  >
                    Open in DocHub
                  </button>
                </div>
              </div>
            ))}
        </section>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {GROUPS.map((group) => {
          const rows = files.filter((f) => f.group === group)
          return (
            <section key={group} style={portalCard}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>{group}</h2>
              {rows.length === 0 ? (
                <p style={{ fontSize: 13, color: portalMuted, margin: 0 }}>Nothing in this folder yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
                  {rows.map((row) => (
                    <li
                      key={row.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: 'var(--tp-inset)',
                        border: '1px solid var(--tp-border)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{row.label}</div>
                        <div style={{ fontSize: 12, color: portalMuted, marginTop: 4 }}>{row.doc.name}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" style={portalGhost} onClick={() => setViewDoc(row.doc)}>
                          View
                        </button>
                        <button type="button" style={portalGhost} onClick={() => downloadUploadedDoc(row.doc)}>
                          Download
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
      <DocViewer doc={viewDoc} onClose={() => setViewDoc(null)} />
    </>
  )
}
