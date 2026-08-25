import { useMemo, useState } from 'react'
import { DocViewer } from '@/components/ui/DocViewer'
import { portalCard, portalGhost, portalMuted } from '@/components/talent-portal/TalentPortalShell'
import { useTalentPortal } from '@/hooks/useTalentPortal'
import { downloadUploadedDoc } from '@/lib/representation-agreement'
import { collectPortalFiles } from '@/lib/talent-portal'
import { resolveProfilePhoto } from '@/lib/profile-photo'
import type { UploadedDoc } from '@/types'

const GROUPS = ['Contracts & agreements', 'Photos, videos & assets', 'Agency-uploaded materials'] as const

export function TalentFilesPage() {
  const { talent, displayName, prospect, rosterTalent } = useTalentPortal()
  const [viewDoc, setViewDoc] = useState<UploadedDoc | null>(null)
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

  return (
    <>
      <h1 style={{ fontFamily: "'Syne', 'Outfit', sans-serif", fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
        Files & media
      </h1>
      <p style={{ color: portalMuted, fontSize: 14, marginBottom: 22 }}>
        Contracts, photos, videos, and materials your agency has shared with {displayName}.
      </p>

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
