import { useMemo, useState } from 'react'
import { DocViewer } from '@/components/ui/DocViewer'
import { portalCard, portalGhost, portalMuted, portalPrimary } from '@/components/talent-portal/TalentPortalShell'
import { useTalentPortal } from '@/hooks/useTalentPortal'
import { useTalentAuth } from '@/context/TalentAuthContext'
import { downloadUploadedDoc } from '@/lib/representation-agreement'
import { collectPortalFiles } from '@/lib/talent-portal'
import { resolveProfilePhoto } from '@/lib/profile-photo'
import { SOP_STATUS } from '@/constants/sop-status'
import { upsertTalent } from '@/services/talent.service'
import type { UploadedDoc } from '@/types'

const GROUPS = ['Contracts & agreements', 'Photos, videos & assets', 'Agency-uploaded materials'] as const

export function TalentFilesPage() {
  const { talent, displayName, prospect, rosterTalent, signProspectContract } = useTalentPortal()
  const { session, setSession } = useTalentAuth()
  const [viewDoc, setViewDoc] = useState<UploadedDoc | null>(null)
  const [signingId, setSigningId] = useState<string | null>(null)
  const [typedName, setTypedName] = useState('')
  const [signError, setSignError] = useState('')
  const [signOk, setSignOk] = useState('')
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

  async function confirmSign(contractId: string) {
    if (!prospect) return
    if (typedName.trim().toLowerCase() !== displayName.trim().toLowerCase()) {
      setSignError(`Type your full legal name exactly as ${displayName} to sign.`)
      return
    }
    setSignError('')
    signProspectContract(prospect.id, contractId, typedName.trim())
    if (talent) {
      const next = {
        ...talent,
        stage: 'signed_onboarding' as const,
        applicant_stage_status: SOP_STATUS.active,
      }
      try {
        await upsertTalent(next)
      } catch {
        /* demo / RLS — CRM client row is still created */
      }
      if (session) setSession({ ...session, talent: next })
    }
    setSigningId(null)
    setTypedName('')
    setSignOk('Contract signed. You are now an Active client.')
  }

  return (
    <>
      <h1 style={{ fontFamily: "'Syne', 'Outfit', sans-serif", fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
        Files & media
      </h1>
      <p style={{ color: portalMuted, fontSize: 14, marginBottom: 22 }}>
        Contracts, photos, videos, and materials your agency has shared with {displayName}.
      </p>

      {signOk && <p style={{ color: '#16a34a', fontSize: 13, marginBottom: 16 }}>{signOk}</p>}

      {pending.length > 0 && (
        <section style={{ ...portalCard, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Review and sign</h2>
          <p style={{ fontSize: 13, color: portalMuted, margin: '0 0 12px' }}>
            A contract has been added to your portal. Review it, then type your full name to sign.
          </p>
          {pending.map((c) => (
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
                <button type="button" style={portalPrimary} onClick={() => { setSigningId(c.id); setSignError(''); }}>
                  Review and sign
                </button>
              </div>
              {signingId === c.id && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                    Type your full name ({displayName}) to sign
                    <input
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      style={{
                        display: 'block',
                        marginTop: 6,
                        width: '100%',
                        maxWidth: 360,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--tp-border)',
                        background: 'var(--tp-input)',
                        color: 'var(--tp-fg)',
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                  {signError && <div style={{ color: 'var(--tp-danger)', fontSize: 12, marginBottom: 8 }}>{signError}</div>}
                  <button type="button" style={portalPrimary} onClick={() => void confirmSign(c.id)}>
                    I agree and sign
                  </button>
                </div>
              )}
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
